const PLAN_LIMITS = {
  Free: {
    dailyImageCopies: 6,
    dailyVideoCopies: 4,
    maxSaves: 6,
    savesImagesOnly: true,
    maxFavorites: 20,
    historyUnlimited: true,
    allowedAccess: ["Free"],
  },
  Pro: {
    dailyImageCopies: null,
    dailyVideoCopies: null,
    maxSaves: null,
    savesImagesOnly: false,
    maxFavorites: null,
    historyUnlimited: true,
    allowedAccess: ["Free", "Pro"],
  },
  Team: {
    dailyImageCopies: null,
    dailyVideoCopies: null,
    maxSaves: null,
    savesImagesOnly: false,
    maxFavorites: null,
    historyUnlimited: true,
    allowedAccess: ["Free", "Pro", "Team"],
  },
};

function getPlanLimits(subscription = "Free") {
  return PLAN_LIMITS[subscription] || PLAN_LIMITS.Free;
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
    };
  }
  return user.dailyUsage;
}

function canAccessPrompt(user, prompt) {
  const limits = getPlanLimits(user.subscription);
  return limits.allowedAccess.includes(prompt.access);
}

function getUsageSummary(user) {
  const limits = getPlanLimits(user.subscription);
  const today = todayKey();
  const usage =
    user.dailyUsage && user.dailyUsage.date === today
      ? user.dailyUsage
      : { date: today, imageCopies: 0, videoCopies: 0 };

  return {
    plan: user.subscription || "Free",
    limits: {
      dailyImageCopies: limits.dailyImageCopies,
      dailyVideoCopies: limits.dailyVideoCopies,
      maxSaves: limits.maxSaves,
      maxFavorites: limits.maxFavorites,
      savesImagesOnly: limits.savesImagesOnly,
      historyUnlimited: limits.historyUnlimited,
      allowedAccess: limits.allowedAccess,
    },
    usage: {
      date: usage.date,
      imageCopies: usage.imageCopies || 0,
      videoCopies: usage.videoCopies || 0,
      saves: (user.savedPrompts || []).length,
      favorites: (user.likedPrompts || []).length,
    },
  };
}

module.exports = {
  PLAN_LIMITS,
  getPlanLimits,
  todayKey,
  ensureDailyUsage,
  canAccessPrompt,
  getUsageSummary,
};
