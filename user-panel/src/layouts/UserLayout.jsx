import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Home,
  Grid3x3,
  Bookmark,
  History,
  Heart,
  Gauge,
  Star,
  CreditCard,
  Settings,
  ChevronRight,
  X,
  Menu,
} from "lucide-react";
import { clearAuthSession, redirectToLogin } from "../lib/auth";
import { api, mediaUrl } from "../lib/api";
import { useSettings } from "../lib/settings";
import { isPublishedPrompt, matchesPromptSearch } from "../lib/prompts";

const navMain = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "Categories", path: "/categories", icon: Grid3x3 },
];

const navLibrary = [
  { label: "Saved Prompts", path: "/saved", icon: Bookmark },
  { label: "History", path: "/history", icon: History },
  { label: "Favorites", path: "/favorites", icon: Heart },
];

const navAccount = [
  { label: "Usage & Limits", path: "/usage", icon: Gauge },
  { label: "Subscription", path: "/subscription", icon: Star },
  { label: "Billing", path: "/billing", icon: CreditCard },
  { label: "Settings", path: "/settings", icon: Settings },
];

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-indigo-600 text-white"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      <Icon size={17} strokeWidth={2} />
      <span className="flex-1 text-left">{item.label}</span>
      <ChevronRight size={15} className="opacity-0 peer-[]:opacity-100" />
    </NavLink>
  );
}

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-lg shrink-0">
          *
        </div>
        <span className="text-[15px] font-semibold">
          <span style={{ color: "#088FD5" }}>Prompt</span>
          <span style={{ color: "#F07604" }}>Jump</span>
        </span>
      </div>

      <nav className="flex flex-col gap-1 mb-6">
        {navMain.map((item) => (
          <NavItem key={item.label} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 mb-2">
        MY LIBRARY
      </div>
      <nav className="flex flex-col gap-1 mb-6">
        {navLibrary.map((item) => (
          <NavItem key={item.label} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 mb-2">
        ACCOUNT
      </div>
      <nav className="flex flex-col gap-1">
        {navAccount.map((item) => (
          <NavItem key={item.label} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
    </>
  );
}

export default function UserLayout() {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { profile, settings } = useSettings();

  const avatarSrc = profile?.avatarUrl ? mediaUrl(profile.avatarUrl) : "";
  const suggestionsEnabled = settings?.preferences?.enablePromptSuggestions !== false;

  useEffect(() => {
    async function loadPrompts() {
      try {
        const data = await api.getPrompts();
        setPrompts((Array.isArray(data) ? data : []).filter(isPublishedPrompt));
      } catch {
        setPrompts([]);
      }
    }
    loadPrompts();
  }, []);

  const suggestions = useMemo(() => {
    if (!suggestionsEnabled) return [];
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 1) return [];

    return prompts
      .filter((prompt) => matchesPromptSearch(prompt, query))
      .slice(0, 8);
  }, [prompts, searchQuery, suggestionsEnabled]);

  const handleLogout = () => {
    clearAuthSession();
    redirectToLogin();
  };

  function goToSearch(query) {
    const q = String(query || "").trim();
    setShowSuggestions(false);
    if (!q) {
      navigate("/search");
      return;
    }
    setSearchQuery(q);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    goToSearch(searchQuery);
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <aside className="hidden md:flex w-64 shrink-0 bg-[#0f1123] flex-col py-5 px-3 overflow-y-auto">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[#0f1123] flex flex-col py-5 px-3 overflow-y-auto">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="self-end mb-2 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <header className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 lg:px-8 py-3 sm:py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <Menu size={20} className="text-slate-600 dark:text-slate-300" />
          </button>

          <form onSubmit={handleSearchSubmit} className="flex-1 relative max-w-xl min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
              placeholder="Search prompts..."
              className="w-full pl-9 pr-20 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              Search
            </button>

            {showSuggestions && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden z-30">
                {suggestionsEnabled && suggestions.length > 0 ? (
                  suggestions.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        goToSearch(prompt.title || prompt.description || searchQuery);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {prompt.title || "Untitled prompt"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {[prompt.category, prompt.type, prompt.access].filter(Boolean).join(" · ")}
                      </p>
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goToSearch(searchQuery);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Search for “{searchQuery.trim()}”
                  </button>
                )}
              </div>
            )}
          </form>

          <button onClick={handleLogout} className="flex items-center gap-2 pl-1 ml-auto shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={profile?.fullName || "User"}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                {profile?.fullName?.charAt(0) || "U"}
              </div>
            )}
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {profile?.fullName || "User"}
              </div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                {profile?.subscription || "Free"}
              </div>
            </div>
            <ChevronDown size={15} className="hidden sm:block text-slate-400" />
          </button>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
