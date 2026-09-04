import { useEffect, useRef, useState } from "react";
import { Camera, Moon, Sun, User } from "lucide-react";
import { mediaUrl } from "../lib/api";
import { useSettings } from "../lib/settings";

function SettingsCard({ title, description, children }) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-slate-900 dark:text-white">{label}</span>
        {description && (
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500";

export default function SettingsPage() {
  const {
    profile,
    settings,
    saving,
    saveProfile,
    uploadAvatar,
    updatePreference,
    updateEmailNotification,
    updateTheme,
  } = useSettings();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(profile?.fullName || "");
    setUsername(profile?.username || "");
  }, [profile]);

  const avatarSrc = profile?.avatarUrl ? mediaUrl(profile.avatarUrl) : "";
  const displayUsername =
    profile?.username || profile?.email?.split("@")[0]?.replace(/[^a-z0-9_]/g, "_") || "username";

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");
    try {
      await uploadAvatar(file);
      setMessage("Profile photo updated.");
    } catch (err) {
      setError(err.message || "Could not upload photo.");
    } finally {
      event.target.value = "";
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await saveProfile({ fullName, username });
      setMessage("Profile details saved.");
    } catch (err) {
      setError(err.message || "Could not save profile.");
    }
  };

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your profile, preferences, notifications, and appearance.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      <SettingsCard title="User Details" description="Your public profile information.">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
          <div className="relative w-20 h-20 shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={profile?.fullName || "User"}
                className="w-20 h-20 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
                {profile?.fullName?.charAt(0) || <User size={28} />}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p className="font-medium text-slate-900 dark:text-white">{profile?.fullName || "User"}</p>
            <p>{profile?.email}</p>
            <p className="mt-1">@{displayUsername}</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="grid gap-4">
          <Field label="Full name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              placeholder="Your full name"
            />
          </Field>

          <Field label="Username">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              placeholder="username"
            />
          </Field>

          <Field label="Gmail / Email">
            <input
              type="email"
              value={profile?.email || ""}
              readOnly
              className={`${inputClass} bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed`}
            />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </SettingsCard>

      <SettingsCard
        title="General Preferences"
        description="Customize how PromptJump works for you."
      >
        <Toggle
          label="Show trending prompts on dashboard"
          description="Display the trending section on your home dashboard."
          checked={settings.preferences.showTrendingOnDashboard}
          onChange={(value) => updatePreference("showTrendingOnDashboard", value)}
        />
        <Toggle
          label="Enable prompt suggestions while typing"
          description="See matching prompts in the search bar as you type."
          checked={settings.preferences.enablePromptSuggestions}
          onChange={(value) => updatePreference("enablePromptSuggestions", value)}
        />
      </SettingsCard>

      <SettingsCard
        title="Email Notifications"
        description="Choose which emails you want to receive."
      >
        <Toggle
          label="Weekly newsletter"
          description="A curated digest of trending prompts every week."
          checked={settings.emailNotifications.weeklyNewsletter}
          onChange={(value) => updateEmailNotification("weeklyNewsletter", value)}
        />
        <Toggle
          label="Prompt offers"
          description="Special deals on premium prompts and plans."
          checked={settings.emailNotifications.promptOffers}
          onChange={(value) => updateEmailNotification("promptOffers", value)}
        />
      </SettingsCard>

      <SettingsCard title="Appearance" description="Switch between light and dark mode.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
          ].map(({ id, label, icon: Icon }) => {
            const active = settings.appearance.theme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => updateTheme(id)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {id === "light" ? "Bright and clean" : "Easy on the eyes"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </SettingsCard>
    </div>
  );
}
