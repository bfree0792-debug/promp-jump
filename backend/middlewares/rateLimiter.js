const rateLimit = require("express-rate-limit");

function createLimiter(customOptions = {}) {
  const windowMs = customOptions.windowMs || 15 * 60 * 1000;
  const max = customOptions.max || 100;
  const message = customOptions.message || "Too many requests. Please slow down and try again.";

  return rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    statusCode: 429,
    validate: { keyGeneratorIpFallback: false },
    message: {
      success: false,
      status: 429,
      error: "Too Many Requests",
      message,
    },
    handler: (req, res, _next, options) => {
      const retryAfter = res.getHeader("Retry-After");
      return res.status(options.statusCode).json({
        success: false,
        status: options.statusCode,
        error: "Too Many Requests",
        message: typeof options.message === "object" ? options.message.message : options.message,
        retryAfterSeconds: retryAfter ? Number(retryAfter) : Math.ceil(options.windowMs / 1000),
      });
    },
    ...customOptions,
  });
}

// Global base rate limiter for all /api endpoints
const globalApiLimiter = createLimiter({
  windowMs: Number(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS || 15 * 60 * 1000), // 15 minutes
  max: Number(process.env.RATE_LIMIT_GLOBAL_MAX || 1000), // 1000 req / 15 min
  message: "Global API rate limit exceeded. Please try again shortly.",
});

// User actions rate limiter (Library, saves, likes, copies, profile updates, subscriptions)
const userRateLimiter = createLimiter({
  windowMs: Number(process.env.USER_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 minutes
  max: Number(process.env.USER_RATE_LIMIT_MAX || 200), // 200 req / 15 min
  keyGenerator: (req) => {
    const userId = req.headers["x-user-id"] || req.params?.userId || req.body?.userId;
    if (userId && typeof userId === "string" && userId.trim()) {
      return `user_${userId.trim()}`;
    }
    return req.ip || req.socket?.remoteAddress || "unknown-user-ip";
  },
  message: "Too many user requests. Please slow down and try again in a few minutes.",
});

// Admin actions rate limiter (Admin dashboard, management endpoints, prompt mutations)
const adminRateLimiter = createLimiter({
  windowMs: Number(process.env.ADMIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 minutes
  max: Number(process.env.ADMIN_RATE_LIMIT_MAX || 600), // 600 req / 15 min
  keyGenerator: (req) => {
    const adminId = req.headers["x-admin-id"] || req.headers["x-user-id"] || req.params?.adminId;
    if (adminId && typeof adminId === "string" && adminId.trim()) {
      return `admin_${adminId.trim()}`;
    }
    return req.ip || req.socket?.remoteAddress || "unknown-admin-ip";
  },
  message: "Admin API rate limit exceeded. Please wait a moment before sending more administrative requests.",
});

// Authentication rate limiter (Sign in, sign up, admin sign in)
const authRateLimiter = createLimiter({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 minutes
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 25), // 25 attempts / 15 min
  message: "Too many authentication attempts. Please try again after 15 minutes.",
});

// Admin Login rate limiter (Strict: 3 attempts / 3 minutes window)
const adminLoginLimiter = createLimiter({
  windowMs: Number(process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS || 3 * 60 * 1000), // 3 minutes
  max: Number(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX || 3), // 3 attempts / 3 min
  message: "Too many admin login attempts. Access is blocked for 3 minutes. Please try again later.",
});

// Password reset rate limiter (Forgot password, reset password)
const passwordResetLimiter = createLimiter({
  windowMs: Number(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 minutes
  max: Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || 5), // 5 requests / 15 min
  keyGenerator: (req) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const token = String(req.body?.token || "").trim();

    if (email) return `password-reset-email_${email}`;
    if (token) return `password-reset-token_${token}`;

    return req.ip || req.socket?.remoteAddress || "unknown-reset-ip";
  },
  message: "Too many password reset requests for this account. Please wait before trying again.",
});

module.exports = {
  globalApiLimiter,
  userRateLimiter,
  adminRateLimiter,
  authRateLimiter,
  adminLoginLimiter,
  passwordResetLimiter,
};
