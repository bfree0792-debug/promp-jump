const User = require("../models/User");

async function requireAdminSession(req, res, next) {
  const authorization = String(req.headers.authorization || "");
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token) {
    return res.status(401).json({ message: "Admin session is required." });
  }

  try {
    const user = await User.findOne({ adminSessionToken: token });
    const expiresAt = user?.adminSessionExpiresAt ? new Date(user.adminSessionExpiresAt).getTime() : 0;

    if (!user || user.role !== "admin" || user.status !== "active" || !expiresAt || expiresAt <= Date.now()) {
      return res.status(401).json({ message: "Admin session is invalid or expired. Please sign in again." });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin session validation error:", error.message);
    return res.status(401).json({ message: "Admin session could not be validated." });
  }
}

module.exports = { requireAdminSession };