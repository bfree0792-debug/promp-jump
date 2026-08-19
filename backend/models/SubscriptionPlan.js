const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    yearlyPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    // Legacy fields (kept for older documents)
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    billingPeriod: {
      type: String,
      enum: ["monthly", "yearly", "lifetime", "both"],
      default: "both",
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

function normalizePlan(ret) {
  let monthlyPrice =
    ret.monthlyPrice === null || ret.monthlyPrice === undefined
      ? null
      : Number(ret.monthlyPrice);
  let yearlyPrice =
    ret.yearlyPrice === null || ret.yearlyPrice === undefined
      ? null
      : Number(ret.yearlyPrice);

  // Migrate legacy single-price documents
  if (monthlyPrice === null && yearlyPrice === null && ret.price !== undefined) {
    if (ret.billingPeriod === "yearly") {
      yearlyPrice = Number(ret.price) || 0;
    } else if (ret.billingPeriod === "lifetime") {
      monthlyPrice = Number(ret.price) || 0;
      yearlyPrice = Number(ret.price) || 0;
    } else {
      monthlyPrice = Number(ret.price) || 0;
    }
  }

  const hasMonthly = monthlyPrice !== null && !Number.isNaN(monthlyPrice);
  const hasYearly = yearlyPrice !== null && !Number.isNaN(yearlyPrice);

  return {
    id: ret._id ? ret._id.toString() : ret.id,
    name: ret.name,
    monthlyPrice: hasMonthly ? monthlyPrice : null,
    yearlyPrice: hasYearly ? yearlyPrice : null,
    price: hasMonthly ? monthlyPrice : hasYearly ? yearlyPrice : Number(ret.price) || 0,
    billingPeriod: hasMonthly && hasYearly ? "both" : hasYearly ? "yearly" : "monthly",
    features: ret.features || [],
    isActive: ret.isActive !== false,
    createdAt: ret.createdAt,
    updatedAt: ret.updatedAt,
  };
}

subscriptionPlanSchema.methods.toJSON = function toJSON() {
  return normalizePlan(this.toObject());
};

subscriptionPlanSchema.statics.normalize = normalizePlan;

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
