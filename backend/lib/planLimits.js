const SubscriptionPlan = require("../models/SubscriptionPlan");

// `null` is an intentional unlimited value. Absent values fall back to the
// legacy tier defaults; they never silently become unlimited.
const PLAN_LIMITS = {
  // These retain the original tier behaviour. New, structured plan values below
  // override them at request time, so an admin change is immediately a user rule.
  Free: { imageCopies: 6, videoCopies: 4, savedPrompts: 6, favorites: 20, premiumPrompts: null, savesImagesOnly: true, historyUnlimited: true, allowedAccess: ["Free"], resetCadence: "Daily" },
  Pro: { imageCopies: null, videoCopies: null, savedPrompts: null, favorites: null, premiumPrompts: null, savesImagesOnly: false, historyUnlimited: true, allowedAccess: ["Free", "Pro"] },
  Team: { imageCopies: null, videoCopies: null, savedPrompts: null, favorites: null, premiumPrompts: null, savesImagesOnly: false, historyUnlimited: true, allowedAccess: ["Free", "Pro", "Team"] },
};

function normalizeLimits(value, fallback) {
  const source = value && typeof value === "object" ? value : {};
  const numeric = (key, legacyKey) => {
    const raw = Object.prototype.hasOwnProperty.call(source, key) ? source[key] : source[legacyKey];
    return raw === null || Number.isFinite(Number(raw)) ? raw === null ? null : Math.max(0, Number(raw)) : fallback[key];
  };
  const imageCopies = numeric("imageCopies", "dailyImageCopies");
  const videoCopies = numeric("videoCopies", "dailyVideoCopies");
  const savedPrompts = numeric("savedPrompts", "maxSaves");
  const favorites = numeric("favorites", "maxFavorites");
  const premiumPrompts = numeric("premiumPrompts", "maxPremiumPrompts");
  return {
    imageCopies, videoCopies, savedPrompts, favorites, premiumPrompts,
    // Compatibility aliases keep existing consumers and existing stored plans working.
    dailyImageCopies: imageCopies, dailyVideoCopies: videoCopies, maxSaves: savedPrompts, maxFavorites: favorites,
    savesImagesOnly: typeof source.savesImagesOnly === "boolean" ? source.savesImagesOnly : fallback.savesImagesOnly,
    historyUnlimited: typeof source.historyUnlimited === "boolean" ? source.historyUnlimited : fallback.historyUnlimited,
    allowedAccess: Array.isArray(source.allowedAccess) && source.allowedAccess.length ? source.allowedAccess : fallback.allowedAccess,
    resetCadence: typeof source.resetCadence === "string" && source.resetCadence.trim() ? source.resetCadence.trim() : undefined,
  };
}

async function resolvePlanForUser(user) {
  const fallbackName = PLAN_LIMITS[user?.subscription] ? user.subscription : "Free";
  let plan = null;
  try {
    if (user?.billing?.planId) plan = await SubscriptionPlan.findById(user.billing.planId);
    if (!plan && user?.billing?.planName) {
      const plans = await SubscriptionPlan.find();
      plan = plans.find((item) => item.name?.toLowerCase() === String(user.billing.planName).toLowerCase());
    }
  } catch { /* retain backwards-compatible defaults */ }
  return { name: plan?.name || user?.billing?.planName || fallbackName, features: plan?.features || [], limits: normalizeLimits(plan?.limits, PLAN_LIMITS[fallbackName]) };
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function ensureDailyUsage(user) {
  const today = todayKey();
  if (!user.dailyUsage || user.dailyUsage.date !== today) {
    user.dailyUsage = {
      date: today,
      imageCopies: 0,
      videoCopies: 0,
      premiumPrompts: 0,
    };
  }
  return user.dailyUsage;
}

async function canAccessPrompt(user, prompt, plan) {
  return (plan || await resolvePlanForUser(user)).limits.allowedAccess.includes(prompt.access);
}

function canUsePremiumPrompt(user, prompt, plan) {
  if (!prompt || prompt.access === "Free") return true;
  const limits = plan.limits;
  if (limits.premiumPrompts === null) return true;
  const usage = ensureDailyUsage(user);
  return (usage.premiumPrompts || 0) < limits.premiumPrompts;
}

async function getUsageSummary(user, resolvedPlan) {
  const plan = resolvedPlan || await resolvePlanForUser(user);
  const today = todayKey();
  const usage =
    user.dailyUsage && user.dailyUsage.date === today
      ? user.dailyUsage
      : { date: today, imageCopies: 0, videoCopies: 0 };

  return {
    plan: plan.name,
    features: plan.features,
    limits: plan.limits,
    usage: {
      date: usage.date,
      imageCopies: usage.imageCopies || 0,
      videoCopies: usage.videoCopies || 0,
      premiumPrompts: usage.premiumPrompts || 0,
      saves: (user.savedPrompts || []).length,
      favorites: (user.likedPrompts || []).length,
    },
  };
}

module.exports = {
  PLAN_LIMITS,
  resolvePlanForUser,
  todayKey,
  ensureDailyUsage,
  canAccessPrompt,
  canUsePremiumPrompt,
  getUsageSummary,
};
