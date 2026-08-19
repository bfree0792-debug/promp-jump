const crypto = require("crypto");
const mongoose = require("mongoose");
const { getUsageSummary } = require("../lib/planLimits");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      required: [true, "Full name is required"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, "Email is required"],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordSalt: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    subscription: {
      type: String,
      enum: ["Free", "Pro", "Team"],
      default: "Free",
    },
    savedPrompts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prompt",
      },
    ],
    likedPrompts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prompt",
      },
    ],
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    preferences: {
      showTrendingOnDashboard: { type: Boolean, default: true },
      enablePromptSuggestions: { type: Boolean, default: true },
    },
    emailNotifications: {
      productUpdates: { type: Boolean, default: true },
      weeklyNewsletter: { type: Boolean, default: false },
      promptOffers: { type: Boolean, default: true },
    },
    appearance: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
    },
    billing: {
      planId: { type: String, default: "" },
      planName: { type: String, default: "Free" },
      planPrice: { type: Number, default: 0 },
      billingPeriod: {
        type: String,
        enum: ["monthly", "yearly", "lifetime", "none"],
        default: "none",
      },
      status: {
        type: String,
        enum: ["free", "active", "canceled"],
        default: "free",
      },
      subscribedAt: { type: Date, default: null },
      nextBillingDate: { type: Date, default: null },
      invoices: [
        {
          invoiceId: String,
          planName: String,
          amount: Number,
          billingPeriod: String,
          status: { type: String, default: "paid" },
          issuedAt: { type: Date, default: Date.now },
        },
      ],
    },
    dailyUsage: {
      date: { type: String, default: "" },
      imageCopies: { type: Number, default: 0 },
      videoCopies: { type: Number, default: 0 },
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.setPassword = function setPassword(password) {
  this.passwordSalt = crypto.randomBytes(16).toString("hex");
  this.passwordHash = crypto
    .pbkdf2Sync(password, this.passwordSalt, 100000, 64, "sha512")
    .toString("hex");
};

userSchema.methods.isValidPassword = function isValidPassword(password) {
  const hash = crypto
    .pbkdf2Sync(password, this.passwordSalt, 100000, 64, "sha512")
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(this.passwordHash, "hex"), Buffer.from(hash, "hex"));
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    username: this.username || "",
    avatarUrl: this.avatarUrl || "",
    role: this.role,
    status: this.status,
    subscription: this.subscription,
    savedPrompts: (this.savedPrompts || []).map((id) => id.toString()),
    likedPrompts: (this.likedPrompts || []).map((id) => id.toString()),
    preferences: {
      showTrendingOnDashboard: this.preferences?.showTrendingOnDashboard ?? true,
      enablePromptSuggestions: this.preferences?.enablePromptSuggestions ?? true,
    },
    emailNotifications: {
      productUpdates: this.emailNotifications?.productUpdates ?? true,
      weeklyNewsletter: this.emailNotifications?.weeklyNewsletter ?? false,
      promptOffers: this.emailNotifications?.promptOffers ?? true,
    },
    appearance: {
      theme: this.appearance?.theme || "light",
    },
    billing: {
      planId: this.billing?.planId || "",
      planName: this.billing?.planName || "Free",
      planPrice: this.billing?.planPrice ?? 0,
      billingPeriod: this.billing?.billingPeriod || "none",
      status: this.billing?.status || "free",
      subscribedAt: this.billing?.subscribedAt || null,
      nextBillingDate: this.billing?.nextBillingDate || null,
      invoices: (this.billing?.invoices || []).map((invoice) => ({
        invoiceId: invoice.invoiceId,
        planName: invoice.planName,
        amount: invoice.amount,
        billingPeriod: invoice.billingPeriod,
        status: invoice.status || "paid",
        issuedAt: invoice.issuedAt,
      })),
    },
    usage: getUsageSummary(this),
  };
};

module.exports = mongoose.model("User", userSchema);
