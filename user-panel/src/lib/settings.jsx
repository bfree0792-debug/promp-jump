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

      const previousProfile = profile;
      const previousSettings = settings;

      const optimisticProfile = { ...profile, ...payload };
      const optimisticSettings = {
        ...settings,
        ...(payload.preferences ? { preferences: { ...settings.preferences, ...payload.preferences } } : {}),
        ...(payload.emailNotifications ? { emailNotifications: { ...settings.emailNotifications, ...payload.emailNotifications } } : {}),
        ...(payload.appearance ? { appearance: { ...settings.appearance, ...payload.appearance } } : {}),
      };

      setProfile(optimisticProfile);
      setSettings(optimisticSettings);

      setSaving(true);
      try {
        const updated = await api.updateUserProfile(profile.id, payload);
        setProfile(updated);
        setSettings(mergeSettings(updated));
        updateStoredUser(updated);
        return updated;
      } catch (err) {
        setProfile(previousProfile);
        setSettings(previousSettings);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [profile?.id, profile, settings]
  );

  const uploadAvatar = useCallback(
    async (file) => {
      if (!profile?.id) return null;

      const previousProfile = profile;
      const previousSettings = settings;

      setSaving(true);
      try {
        const updated = await api.uploadUserAvatar(profile.id, file);
        setProfile(updated);
        setSettings(mergeSettings(updated));
        updateStoredUser(updated);
        return updated;
      } catch (err) {
        setProfile(previousProfile);
        setSettings(previousSettings);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [profile?.id, profile, settings]
  );

  const subscribeToPlan = useCallback(
    async (plan) => {
      if (!profile?.id) return null;

      const previousProfile = profile;
      const previousSettings = settings;

      setSaving(true);
      try {
        const updated = await api.subscribeToPlan(profile.id, plan);
        setProfile(updated);
        setSettings(mergeSettings(updated));
        updateStoredUser(updated);
        return updated;
      } catch (err) {
        setProfile(previousProfile);
        setSettings(previousSettings);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [profile?.id, profile, settings]
  );

  const updatePreference = useCallback(
    async (key, value) => {
      const next = {
        ...settings,
        preferences: { ...settings.preferences, [key]: value },
      };
      const previousSettings = settings;
      setSettings(next);
      try {
        await saveProfile({ preferences: next.preferences });
      } catch (err) {
        setSettings(previousSettings);
        throw err;
      }
    },
    [saveProfile, settings]
  );

  const updateEmailNotification = useCallback(
    async (key, value) => {
      const next = {
        ...settings,
        emailNotifications: { ...settings.emailNotifications, [key]: value },
      };
      const previousSettings = settings;
      setSettings(next);
      try {
        await saveProfile({ emailNotifications: next.emailNotifications });
      } catch (err) {
        setSettings(previousSettings);
        throw err;
      }
    },
    [saveProfile, settings]
  );

  const updateTheme = useCallback(
    async (theme) => {
      const next = {
        ...settings,
        appearance: { theme },
      };
      const previousSettings = settings;
      setSettings(next);
      applyTheme(theme);
      try {
        await saveProfile({ appearance: next.appearance });
      } catch (err) {
        setSettings(previousSettings);
        applyTheme(settings.appearance.theme);
        throw err;
      }
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
