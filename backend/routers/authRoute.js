const crypto = require("crypto");
const express = require("express");
const User = require("../models/User");

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = new User({
      fullName,
      email,
      username: email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    });
    user.setPassword(password);
    await user.save();

    return res.status(201).json({
      message: "Signup successful.",
      user: user.toSafeJSON(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not create account. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isValidPassword(password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      message: "Login successful.",
      token: crypto.randomBytes(24).toString("hex"),
      user: user.toSafeJSON(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not log in. Please try again." });
  }
});

router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isValidPassword(password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "You do not have admin access." });
    }

    return res.json({
      message: "Admin login successful.",
      token: crypto.randomBytes(24).toString("hex"),
      user: user.toSafeJSON(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not log in. Please try again." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address." });
    }

    // Generate a reset token that expires in 1 hour
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // In production, send the reset link via email
    // For now, we'll just return a success message
    // TODO: Implement email sending with nodemailer or similar service
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    return res.json({
      message: "Password reset instructions have been sent to your email.",
      // For development purposes only - remove in production
      // resetToken,
      // resetLink: `http://localhost:3000/reset-password?token=${resetToken}`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not process password reset. Please try again." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset token is invalid or has expired." });
    }

    // Set the new password
    user.setPassword(newPassword);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Could not reset password. Please try again." });
  }
});

module.exports = router;
