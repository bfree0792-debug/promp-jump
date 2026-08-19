const express = require("express");
const SubscriptionPlan = require("../models/SubscriptionPlan");

const router = express.Router();

function parseFeatures(features) {
  if (typeof features === "string") {
    return features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
  }
  return Array.isArray(features) ? features : [];
}

function parseOptionalPrice(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return NaN;
  return num;
}

router.get("/", async (_req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: 1 });
    res.json(plans.map((p) => p.toJSON()));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch plans." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, monthlyPrice, yearlyPrice, price, billingPeriod, features } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Plan name is required." });
    }

    let monthly = parseOptionalPrice(monthlyPrice);
    let yearly = parseOptionalPrice(yearlyPrice);

    // Legacy create support
    if (monthly === null && yearly === null && price !== undefined) {
      const legacy = parseOptionalPrice(price);
      if (Number.isNaN(legacy)) {
        return res.status(400).json({ message: "Valid price is required." });
      }
      if (billingPeriod === "yearly") yearly = legacy;
      else monthly = legacy;
    }

    if (Number.isNaN(monthly) || Number.isNaN(yearly)) {
      return res.status(400).json({ message: "Prices must be valid numbers (0 or more)." });
    }

    if (monthly === null && yearly === null) {
      return res.status(400).json({ message: "Set at least a monthly or yearly price." });
    }

    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      monthlyPrice: monthly,
      yearlyPrice: yearly,
      price: monthly ?? yearly ?? 0,
      billingPeriod: monthly !== null && yearly !== null ? "both" : yearly !== null ? "yearly" : "monthly",
      features: parseFeatures(features),
      isActive: true,
    });

    res.status(201).json(plan.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not create plan." });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found." });
    }

    const { name, monthlyPrice, yearlyPrice, features, isActive } = req.body;

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({ message: "Plan name cannot be empty." });
      }
      plan.name = trimmed;
    }

    if (monthlyPrice !== undefined) {
      const monthly = parseOptionalPrice(monthlyPrice);
      if (Number.isNaN(monthly)) {
        return res.status(400).json({ message: "Monthly price is invalid." });
      }
      plan.monthlyPrice = monthly;
    }

    if (yearlyPrice !== undefined) {
      const yearly = parseOptionalPrice(yearlyPrice);
      if (Number.isNaN(yearly)) {
        return res.status(400).json({ message: "Yearly price is invalid." });
      }
      plan.yearlyPrice = yearly;
    }

    if (features !== undefined) {
      plan.features = parseFeatures(features);
    }

    if (isActive !== undefined) {
      plan.isActive = Boolean(isActive);
    }

    const monthly = plan.monthlyPrice;
    const yearly = plan.yearlyPrice;
    if (
      (monthly === null || monthly === undefined) &&
      (yearly === null || yearly === undefined)
    ) {
      return res.status(400).json({ message: "Set at least a monthly or yearly price." });
    }

    plan.price = monthly ?? yearly ?? 0;
    plan.billingPeriod =
      monthly != null && yearly != null ? "both" : yearly != null ? "yearly" : "monthly";

    await plan.save();
    res.json(plan.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not update plan." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Plan not found." });
    }
    res.json({ message: "Plan deleted." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete plan." });
  }
});

module.exports = router;
