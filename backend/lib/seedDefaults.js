const Category = require("../models/Category");
const SubscriptionPlan = require("../models/SubscriptionPlan");

const DEFAULT_CATEGORIES = [
  { name: "General", description: "Uncategorized prompts" },
  { name: "Marketing", description: "Ads, campaigns, and copy" },
  { name: "Design", description: "Visual and UI creative work" },
  { name: "Writing", description: "Articles, scripts, and stories" },
];

const DEFAULT_PLANS = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    price: 0,
    billingPeriod: "both",
    isActive: true,
    features: [
      "Access to Free prompts",
      "Daily copy limits",
      "Save and favorite prompts",
    ],
    limits: { dailyImageCopies: 6, dailyVideoCopies: 4, maxSaves: 6, savesImagesOnly: true, maxFavorites: 20, historyUnlimited: true, allowedAccess: ["Free"], resetCadence: "Daily" },
  },
  {
    name: "Pro",
    monthlyPrice: 12,
    yearlyPrice: 120,
    price: 12,
    billingPeriod: "both",
    isActive: true,
    features: [
      "All Free features",
      "Access to Pro prompts",
      "Higher daily copy limits",
    ],
    limits: { dailyImageCopies: null, dailyVideoCopies: null, maxSaves: null, savesImagesOnly: false, maxFavorites: null, historyUnlimited: true, allowedAccess: ["Free", "Pro"] },
  },
  {
    name: "Team",
    monthlyPrice: 29,
    yearlyPrice: 290,
    price: 29,
    billingPeriod: "both",
    isActive: true,
    features: [
      "All Pro features",
      "Team-tier prompts",
      "Highest usage limits",
    ],
    limits: { dailyImageCopies: null, dailyVideoCopies: null, maxSaves: null, savesImagesOnly: false, maxFavorites: null, historyUnlimited: true, allowedAccess: ["Free", "Pro", "Team"] },
  },
];

async function seedDefaults() {
  const [planCount, categoryCount] = await Promise.all([
    SubscriptionPlan.countDocuments(),
    Category.countDocuments(),
  ]);

  if (planCount === 0) {
    await SubscriptionPlan.insertMany(DEFAULT_PLANS);
    console.log("Seeded default subscription plans (Free, Pro, Team)");
  }

  if (categoryCount === 0) {
    await Category.insertMany(DEFAULT_CATEGORIES);
    console.log("Seeded default categories");
  }
}

module.exports = { seedDefaults };
