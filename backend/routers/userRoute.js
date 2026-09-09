const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const Prompt = require("../models/Prompt");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const { userRateLimiter, adminRateLimiter } = require("../middlewares/rateLimiter");
const { requireAdminSession } = require("../middlewares/adminSession");

const router = express.Router();

const avatarDir = path.join(__dirname, "../uploads/avatars");
fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

function normalizeUsername(username) {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

router.get("/", requireAdminSession, adminRateLimiter, async (_req, res) => {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.json(users.map((u) => u.toSafeJSON()));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch users." });
  }
});

router.get("/stats", requireAdminSession, adminRateLimiter, async (_req, res) => {
  try {
    const [active, inactive, free, pro, team, mostCopied] = await Promise.all([
      User.countDocuments({ role: "user", status: "active" }),
      User.countDocuments({ role: "user", status: "inactive" }),
      User.countDocuments({ role: "user", subscription: "Free" }),
      User.countDocuments({ role: "user", subscription: "Pro" }),
      User.countDocuments({ role: "user", subscription: "Team" }),
      Prompt.find().sort({ copies: -1 }).limit(5),
    ]);

    res.json({
      active,
      inactive,
      subscriptions: { Free: free, Pro: pro, Team: team },
      mostCopied: mostCopied.map((p) => p.toJSON()),
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch user stats." });
  }
});

router.get("/revenue", requireAdminSession, adminRateLimiter, async (_req, res) => {
  try {
    const users = await User.find({ role: "user" });
    const invoices = [];
    let totalRevenue = 0;
    let activePaid = 0;
    const byPlan = {};

    users.forEach((user) => {
      const billing = user.billing || {};
      if (billing.status === "active" && Number(billing.planPrice || 0) > 0) {
        activePaid += 1;
        const planName = billing.planName || user.subscription || "Paid";
        byPlan[planName] = (byPlan[planName] || 0) + 1;
      }

      (billing.invoices || []).forEach((invoice) => {
        const amount = Number(invoice.amount || 0);
        totalRevenue += amount;
        invoices.push({
          invoiceId: invoice.invoiceId,
          planName: invoice.planName,
          amount,
          billingPeriod: invoice.billingPeriod,
          status: invoice.status || "paid",
          issuedAt: invoice.issuedAt,
          userName: user.fullName,
          userEmail: user.email,
        });
      });
    });

    invoices.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

    res.json({
      totalRevenue,
      activePaidSubscribers: activePaid,
      invoiceCount: invoices.length,
      byPlan,
      invoices: invoices.slice(0, 50),
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch revenue." });
  }
});

router.get("/:id", userRateLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user.toSafeJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not fetch user profile." });
  }
});

router.patch("/:id", userRateLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { fullName, username, preferences, emailNotifications, appearance } = req.body;

    if (fullName !== undefined) {
      const trimmed = String(fullName).trim();
      if (!trimmed) {
        return res.status(400).json({ message: "Full name cannot be empty." });
      }
      user.fullName = trimmed;
    }

    if (username !== undefined) {
      const normalized = normalizeUsername(username);
      if (!normalized) {
        return res.status(400).json({ message: "Username is invalid." });
      }

      const existing = await User.findOne({
        username: normalized,
        _id: { $ne: user._id },
      });
      if (existing) {
        return res.status(409).json({ message: "Username is already taken." });
      }

      user.username = normalized;
    }

    if (preferences) {
      if (preferences.showTrendingOnDashboard !== undefined) {
        user.preferences.showTrendingOnDashboard = Boolean(preferences.showTrendingOnDashboard);
      }
      if (preferences.enablePromptSuggestions !== undefined) {
        user.preferences.enablePromptSuggestions = Boolean(preferences.enablePromptSuggestions);
      }
    }

    if (emailNotifications) {
      if (emailNotifications.productUpdates !== undefined) {
        user.emailNotifications.productUpdates = Boolean(emailNotifications.productUpdates);
      }
      if (emailNotifications.weeklyNewsletter !== undefined) {
        user.emailNotifications.weeklyNewsletter = Boolean(emailNotifications.weeklyNewsletter);
      }
      if (emailNotifications.promptOffers !== undefined) {
        user.emailNotifications.promptOffers = Boolean(emailNotifications.promptOffers);
      }
    }

    if (appearance?.theme && ["light", "dark"].includes(appearance.theme)) {
      user.appearance.theme = appearance.theme;
    }

    await user.save();
    res.json(user.toSafeJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not update profile." });
  }
});

function mapPlanToSubscription(planName = "") {
  const name = planName.toLowerCase();
  if (name.includes("team")) return "Team";
  if (name.includes("pro") || name.includes("premium")) return "Pro";
  if (name.includes("free") || name.includes("starter")) return "Free";
  return "Pro";
}

function nextBillingFromPeriod(billingPeriod, fromDate = new Date()) {
  const next = new Date(fromDate);
  if (billingPeriod === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }
  if (billingPeriod === "lifetime") {
    return null;
  }
  next.setMonth(next.getMonth() + 1);
  return next;
}

router.post("/:id/subscribe", userRateLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { planId, billingPeriod } = req.body;
    const selectedPlan = await SubscriptionPlan.findById(planId);
    if (!selectedPlan || selectedPlan.isActive === false) {
      return res.status(400).json({ message: "Choose an active subscription plan." });
    }

    const period = ["monthly", "yearly", "lifetime"].includes(billingPeriod)
      ? billingPeriod
      : "monthly";
    const amount = Number(period === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice);
    if (!Number.isFinite(amount)) {
      return res.status(400).json({ message: "That billing period is not available for this plan." });
    }
    const now = new Date();
    const invoiceId = `INV-${Date.now().toString().slice(-8)}`;

    user.subscription = mapPlanToSubscription(selectedPlan.name);
    user.billing = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      planPrice: amount,
      billingPeriod: period,
      status: amount <= 0 ? "free" : "active",
      subscribedAt: now,
      nextBillingDate: amount <= 0 ? null : nextBillingFromPeriod(period, now),
      invoices: [
        ...(user.billing?.invoices || []),
        {
          invoiceId,
          planName: selectedPlan.name,
          amount,
          billingPeriod: period,
          status: "paid",
          issuedAt: now,
        },
      ],
    };

    await user.save();
    res.json(user.toSafeJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not subscribe to plan." });
  }
});

router.post("/:id/avatar", userRateLimiter, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Avatar image is required." });
    }

    user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json(user.toSafeJSON());
  } catch (error) {
    res.status(500).json({ message: error.message || "Could not upload avatar." });
  }
});

router.patch("/:id/status", requireAdminSession, adminRateLimiter, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user.toSafeJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not update user status." });
  }
});

module.exports = router;
