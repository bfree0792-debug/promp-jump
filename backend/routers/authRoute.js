const crypto = require("crypto");
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("../utils/email");
const { authRateLimiter, adminRateLimiter, passwordResetLimiter } = require("../middlewares/rateLimiter");
const { requireAdminSession } = require("../middlewares/adminSession");

const router = express.Router();

function getGoogleClient() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  return new OAuth2Client(clientId, clientSecret);
}

async function verifyGoogleCredential(credentialOrToken) {
  if (!credentialOrToken || typeof credentialOrToken !== "string") {
    throw new Error("Missing or invalid Google authentication token.");
  }

  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const client = getGoogleClient();

  // Strategy 1: Verify as Google ID Token (Google Identity Services GIS JWT)
  try {
    const ticket = await client.verifyIdToken({
      idToken: credentialOrToken,
      audience: clientId ? [clientId] : undefined,
    });
    const payload = ticket.getPayload();
    if (payload && payload.email) {
      return {
        email: payload.email,
        emailVerified: payload.email_verified,
        fullName: payload.name || payload.given_name || payload.email.split("@")[0],
        avatarUrl: payload.picture || "",
        googleId: payload.sub,
      };
    }
  } catch (idErr) {
    // Strategy 2: If it's an OAuth2 Access Token instead of ID Token, fetch userinfo from Google API
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${credentialOrToken}` },
      });
      if (response.ok) {
        const userInfo = await response.json();
        if (userInfo && userInfo.email) {
          return {
            email: userInfo.email,
            emailVerified: userInfo.email_verified,
            fullName: userInfo.name || userInfo.given_name || userInfo.email.split("@")[0],
            avatarUrl: userInfo.picture || "",
            googleId: userInfo.sub,
          };
        }
      }
    } catch {
      // Fall through to throw error
    }

    throw new Error(`Google token validation failed: ${idErr.message}`);
  }

  throw new Error("Could not verify Google account details.");
}

function sanitizeString(val) {
  if (typeof val !== "string") return "";
  return val.trim();
}

function isValidEmail(email) {
  if (!email || typeof email !== "string" || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

function isValidPassword(password) {
  if (!password || typeof password !== "string") return false;
  return password.length >= 6 && password.length <= 128;
}

function isValidFullName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

router.post("/signup", authRateLimiter, async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const cleanName = sanitizeString(fullName);
    const cleanEmail = sanitizeString(email).toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required." });
    }

    if (!isValidFullName(cleanName)) {
      return res.status(400).json({ message: "Full name must be between 1 and 100 characters." });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Password must be between 6 and 128 characters." });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const usernameBase = cleanEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30);
    const user = new User({
      fullName: cleanName,
      email: cleanEmail,
      username: usernameBase || `user_${crypto.randomBytes(4).toString("hex")}`,
    });
    user.setPassword(password);
    await user.save();

    return res.status(201).json({
      message: "Signup successful.",
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Could not create account. Please try again." });
  }
});

router.post("/login", authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = sanitizeString(email).toLowerCase();

    if (!cleanEmail || !password || !isValidEmail(cleanEmail) || !isValidPassword(password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = await User.findOne({ email: cleanEmail });
    const isPasswordValid = user ? user.isValidPassword(password) : User().constructor.dummyPasswordVerify();

    if (!user || !isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      message: "Login successful.",
      token: crypto.randomBytes(24).toString("hex"),
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Could not log in. Please try again." });
  }
});

router.post("/admin/login", adminRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = sanitizeString(email).toLowerCase();

    if (!cleanEmail || !password || !isValidEmail(cleanEmail) || !isValidPassword(password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = await User.findOne({ email: cleanEmail });
    const isPasswordValid = user ? user.isValidPassword(password) : User().constructor.dummyPasswordVerify();

    if (!user || !isPasswordValid || user.role !== "admin") {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const activeSessionExpiresAt = user.adminSessionExpiresAt
      ? new Date(user.adminSessionExpiresAt).getTime()
      : 0;
    if (user.adminSessionToken && activeSessionExpiresAt > Date.now()) {
      return res.status(409).json({
        message: "Admin is already signed in on another device.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.adminSessionToken = token;
    user.adminSessionExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    await user.save();

    return res.json({
      message: "Admin login successful.",
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Could not log in. Please try again." });
  }
});

router.post("/admin/logout", requireAdminSession, async (req, res) => {
  try {
    req.adminUser.adminSessionToken = null;
    req.adminUser.adminSessionExpiresAt = null;
    await req.adminUser.save();
    return res.json({ message: "Admin logged out successfully." });
  } catch (error) {
    console.error("Admin logout error:", error);
    return res.status(500).json({ message: "Could not log out admin session." });
  }
});

router.get("/google/client-id", (req, res) => {
  return res.json({
    clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
  });
});

router.post("/google", authRateLimiter, async (req, res) => {
  try {
    const { credential, idToken, token } = req.body;
    const rawToken = sanitizeString(credential || idToken || token);

    if (!rawToken) {
      return res.status(400).json({ message: "Google credential token is required." });
    }

    const googleUser = await verifyGoogleCredential(rawToken);
    const cleanEmail = sanitizeString(googleUser.email).toLowerCase();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: "A valid email address could not be retrieved from Google." });
    }

    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // First-time Google user: automatically create account
      const name = sanitizeString(googleUser.fullName) || cleanEmail.split("@")[0];
      const usernameBase = cleanEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30);

      let finalUsername = usernameBase;
      const existingWithUsername = await User.findOne({ username: finalUsername });
      if (existingWithUsername) {
        finalUsername = `${usernameBase}_${crypto.randomBytes(3).toString("hex")}`;
      }

      user = new User({
        fullName: name,
        email: cleanEmail,
        username: finalUsername || `user_${crypto.randomBytes(4).toString("hex")}`,
        avatarUrl: googleUser.avatarUrl || "",
        role: "user",
        status: "active",
        subscription: "Free",
      });

      // Assign a high-entropy cryptographically secure random password hash for OAuth accounts
      const oauthSecret = crypto.randomBytes(32).toString("hex");
      user.setPassword(oauthSecret);
      await user.save();
    } else {
      // Existing user: check account status
      if (user.status === "inactive") {
        return res.status(403).json({ message: "This account has been deactivated. Please contact support." });
      }

      // Update avatar if not already present
      let needsSave = false;
      if (!user.avatarUrl && googleUser.avatarUrl) {
        user.avatarUrl = googleUser.avatarUrl;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    const authToken = crypto.randomBytes(24).toString("hex");

    return res.json({
      message: "Google login successful.",
      token: authToken,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    return res.status(401).json({
      message: error.message || "Google authentication failed. Please try again.",
    });
  }
});

router.post("/forgot-password", passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = sanitizeString(email).toLowerCase();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // Return generic message to prevent email enumeration
      return res.json({
        message: "If an account with that email exists, password reset instructions have been sent.",
      });
    }

    // Generate a secure reset token that expires in 1 hour
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send the reset link via email
    const configuredFrontendUrl = String(process.env.FRONTEND_URL || "").trim();
    const isProduction = process.env.NODE_ENV === "production";
    const usesLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
      configuredFrontendUrl.replace(/\/$/, "")
    );
    const frontendUrl = (
      isProduction && usesLocalhost
        ? "https://promp-jump-userpanel.vercel.app"
        : configuredFrontendUrl || "https://promp-jump-userpanel.vercel.app"
    ).replace(/\/$/, "");
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError.message);

      return res.status(503).json({
        message: "We could not send the reset email because the email provider is currently unavailable. Please use the reset link below or contact support.",
        smtpFailure: true,
        resetLink,
      });
    }

    return res.json({
      message: "If an account with that email exists, password reset instructions have been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Could not process password reset. Please try again." });
  }
});

router.post("/reset-password", passwordResetLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const cleanToken = sanitizeString(token);

    if (!cleanToken || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ message: "Password must be between 6 and 128 characters." });
    }

    if (cleanToken.length < 16 || cleanToken.length > 128 || !/^[a-fA-F0-9]+$/.test(cleanToken)) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    const user = await User.findOne({
      resetToken: cleanToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    // Set the new password securely
    user.setPassword(newPassword);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Could not reset password. Please try again." });
  }
});

module.exports = router;
