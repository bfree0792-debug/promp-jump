import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { getStoredUser, updateStoredUser } from "./auth";

const DEFAULT_SETTINGS = {
  preferences: {
    showTrendingOnDashboard: true,
    enablePromptSuggestions: true,
  },
  emailNotifications: {
    productUpdates: true,
    weeklyNewsletter: false,
    promptOffers: true,
  },
  appearance: {
    theme: "light",
  },
};

const SettingsContext = createContext(null);

function mergeSettings(user) {
  return {
    preferences: {
      ...DEFAULT_SETTINGS.preferences,
      ...(user?.preferences || {}),
    },
    emailNotifications: {
      ...DEFAULT_SETTINGS.emailNotifications,
      ...(user?.emailNotifications || {}),
    },
    appearance: {
      ...DEFAULT_SETTINGS.appearance,
      ...(user?.appearance || {}),
    },
  };
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function SettingsProvider({ children }) {
  const [profile, setProfile] = useState(() => getStoredUser());
  const [settings, setSettings] = useState(() => mergeSettings(getStoredUser()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refreshProfile = useCallback(async () => {
    const stored = getStoredUser();
    if (!stored?.id) {
      setProfile(stored);
      setSettings(mergeSettings(stored));
      setLoading(false);
      return;
    }

    try {
      const user = await api.getUserProfile(stored.id);
      setProfile(user);
      setSettings(mergeSettings(user));
      updateStoredUser(user);
    } catch {
      setProfile(stored);
      setSettings(mergeSettings(stored));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    applyTheme(settings.appearance.theme);
  }, [settings.appearance.theme]);

  const saveProfile = useCallback(
    async (payload) => {
      if (!profile?.id) return null;

      setSaving(true);
      try {
        const updated = await api.updateUserProfile(profile.id, payload);
        setProfile(updated);
        setSettings(mergeSettings(updated));
        updateStoredUser(updated);
        return updated;
      } finally {
        setSaving(false);
      }
    },
    [profile?.id]
  );

  const uploadAvatar = useCallback(
    async (file) => {
      if (!profile?.id) return null;

      setSaving(true);
      try {
        const updated = await api.uploadUserAvatar(profile.id, file);
        setProfile(updated);
        setSettings(mergeSettings(updated));
        updateStoredUser(updated);
        return updated;
      } finally {
        setSaving(false);
      }
    },
    [profile?.id]
  );

  const subscribeToPlan = useCallback(
    async (plan) => {
      if (!profile?.id) return null;

      setSaving(true);
      try {
        const updated = await api.subscribeToPlan(profile.id, plan);
        setProfile(updated);
        setSettings(mergeSettings(updated));
        updateStoredUser(updated);
        return updated;
      } finally {
        setSaving(false);
      }
    },
    [profile?.id]
  );

  const updatePreference = useCallback(
    async (key, value) => {
      const next = {
        ...settings,
        preferences: { ...settings.preferences, [key]: value },
      };
      setSettings(next);
      await saveProfile({ preferences: next.preferences });
    },
    [saveProfile, settings]
  );

  const updateEmailNotification = useCallback(
    async (key, value) => {
      const next = {
        ...settings,
        emailNotifications: { ...settings.emailNotifications, [key]: value },
      };
      setSettings(next);
      await saveProfile({ emailNotifications: next.emailNotifications });
    },
    [saveProfile, settings]
  );

  const updateTheme = useCallback(
    async (theme) => {
      const next = {
        ...settings,
        appearance: { theme },
      };
      setSettings(next);
      applyTheme(theme);
      await saveProfile({ appearance: next.appearance });
    },
    [saveProfile, settings]
  );

  const value = useMemo(
    () => ({
      profile,
      settings,
      loading,
      saving,
      saveProfile,
      uploadAvatar,
      subscribeToPlan,
      updatePreference,
      updateEmailNotification,
      updateTheme,
      refreshProfile,
    }),
    [
      profile,
      settings,
      loading,
      saving,
      saveProfile,
      uploadAvatar,
      subscribeToPlan,
      updatePreference,
      updateEmailNotification,
      updateTheme,
      refreshProfile,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
