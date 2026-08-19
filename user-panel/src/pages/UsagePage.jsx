import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gauge, ArrowUpRight } from "lucide-react";
import { api } from "../lib/api";
import { getStoredUser } from "../lib/auth";
import { useLibrary } from "../lib/library";

function limitLabel(value) {
  return value === null || value === undefined ? "Unlimited" : String(value);
}

function StatCard({ label, used, limit, hint }) {
  const unlimited = limit === null || limit === undefined;
  const pct = unlimited || !limit ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const reached = !unlimited && used >= limit;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
          {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>}
        </div>
        <p className={`text-sm font-bold ${reached ? "text-rose-600" : "text-indigo-600"}`}>
          {used} / {limitLabel(limit)}
        </p>
      </div>
      {!unlimited && (
        <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full ${reached ? "bg-rose-500" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function UsagePage() {
  const stored = getStoredUser();
  const { usage: libraryUsage } = useLibrary();
  const [usage, setUsage] = useState(libraryUsage || stored?.usage || null);
  const [loading, setLoading] = useState(!usage);

  useEffect(() => {
    async function load() {
      if (!stored?.id) return;
      setLoading(true);
      try {
        const data = await api.getUsage(stored.id);
        setUsage(data);
      } catch {
        setUsage(libraryUsage || stored?.usage || null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [stored?.id, libraryUsage]);

  const plan = usage?.plan || stored?.subscription || "Free";
  const limits = usage?.limits || {};
  const used = usage?.usage || {};

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-indigo-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Usage & Limits
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Current plan: <span className="font-semibold text-indigo-600">{plan}</span>
            </p>
          </div>
        </div>
        {plan === "Free" && (
          <Link
            to="/subscription"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Upgrade
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading usage...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard
              label="Image copies today"
              used={used.imageCopies || 0}
              limit={limits.dailyImageCopies}
              hint="Copy image prompt descriptions"
            />
            <StatCard
              label="Video copies today"
              used={used.videoCopies || 0}
              limit={limits.dailyVideoCopies}
              hint="Copy video prompt descriptions"
            />
            <StatCard
              label="Saved prompts"
              used={used.saves || 0}
              limit={limits.maxSaves}
              hint={limits.savesImagesOnly ? "Free plan: images only" : "Images and videos"}
            />
            <StatCard
              label="Favorites"
              used={used.favorites || 0}
              limit={limits.maxFavorites}
              hint="Liked prompts"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Plan rules
            </h2>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>
                Content access:{" "}
                <span className="font-medium">
                  {(limits.allowedAccess || ["Free"]).join(", ")}
                </span>
              </li>
              <li>History: Unlimited</li>
              {plan === "Free" && (
                <>
                  <li>Daily: 6 image description copies + 4 video description copies</li>
                  <li>Saves: max 6 image prompts only</li>
                  <li>Favorites: max 20</li>
                </>
              )}
              {plan !== "Free" && (
                <li>Paid plan: unlimited copies, saves, and favorites for allowed content.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
