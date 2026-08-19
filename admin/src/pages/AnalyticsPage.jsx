import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Eye,
  Heart,
  Download,
  Users,
  FileText,
  Image as ImageIcon,
  PlayCircle,
} from "lucide-react";
import { api } from "../lib/api";

function StatBox({ icon: Icon, label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    rose: "bg-rose-50 text-rose-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color = "bg-blue-500" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [prompts, setPrompts] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [promptData, userStats, categoryData] = await Promise.all([
          api.getPrompts(),
          api.getUserStats(),
          api.getCategories(),
        ]);
        setPrompts(Array.isArray(promptData) ? promptData : []);
        setStats(userStats);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (err) {
        setError(err.message || "Could not load analytics.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const metrics = useMemo(() => {
    const totalViews = prompts.reduce((sum, p) => sum + Number(p.views || 0), 0);
    const totalLikes = prompts.reduce((sum, p) => sum + Number(p.likes || 0), 0);
    const totalDownloads = prompts.reduce((sum, p) => sum + Number(p.downloads || 0), 0);
    const totalCopies = prompts.reduce((sum, p) => sum + Number(p.copies || 0), 0);

    const byAccess = {
      Free: prompts.filter((p) => p.access === "Free").length,
      Pro: prompts.filter((p) => p.access === "Pro").length,
      Team: prompts.filter((p) => p.access === "Team").length,
      Unassigned: prompts.filter((p) => p.access === "Unassigned").length,
    };

    const byType = {
      Image: prompts.filter((p) => p.type === "Image").length,
      Video: prompts.filter((p) => p.type === "Video").length,
    };

    const byStatus = {
      Published: prompts.filter((p) => p.status === "Published").length,
      Draft: prompts.filter((p) => p.status === "Draft").length,
      Archived: prompts.filter((p) => p.status === "Archived").length,
    };

    const topLiked = [...prompts]
      .sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0))
      .slice(0, 5);

    const topCopied = [...prompts]
      .sort((a, b) => Number(b.copies || 0) - Number(a.copies || 0))
      .slice(0, 5);

    return {
      totalViews,
      totalLikes,
      totalDownloads,
      totalCopies,
      byAccess,
      byType,
      byStatus,
      topLiked,
      topCopied,
    };
  }, [prompts]);

  const accessMax = Math.max(...Object.values(metrics.byAccess), 1);
  const typeMax = Math.max(...Object.values(metrics.byType), 1);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading analytics...</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <div>
          <h2 className="text-[15px] font-bold text-slate-800">Analytics</h2>
          <p className="text-xs text-slate-500">Usage trends, engagement, and content performance.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatBox icon={Users} label="Active Users" value={stats?.active ?? 0} tone="blue" />
        <StatBox icon={FileText} label="Total Prompts" value={prompts.length} tone="violet" />
        <StatBox icon={Eye} label="Total Views" value={metrics.totalViews} tone="green" />
        <StatBox icon={Heart} label="Total Likes" value={metrics.totalLikes} tone="rose" />
        <StatBox icon={Download} label="Downloads" value={metrics.totalDownloads} tone="orange" />
        <StatBox icon={BarChart3} label="Copies" value={metrics.totalCopies} tone="blue" />
        <StatBox icon={ImageIcon} label="Image Prompts" value={metrics.byType.Image} tone="green" />
        <StatBox icon={PlayCircle} label="Video Prompts" value={metrics.byType.Video} tone="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Content by Access</h3>
          <BarRow label="Free" value={metrics.byAccess.Free} max={accessMax} color="bg-slate-400" />
          <BarRow label="Pro" value={metrics.byAccess.Pro} max={accessMax} color="bg-amber-500" />
          <BarRow label="Team" value={metrics.byAccess.Team} max={accessMax} color="bg-violet-500" />
          <BarRow
            label="Unassigned"
            value={metrics.byAccess.Unassigned}
            max={accessMax}
            color="bg-orange-400"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Content by Type & Status</h3>
          <BarRow label="Image" value={metrics.byType.Image} max={typeMax} color="bg-emerald-500" />
          <BarRow label="Video" value={metrics.byType.Video} max={typeMax} color="bg-orange-500" />
          <div className="pt-2 grid grid-cols-3 gap-2 text-center">
            {Object.entries(metrics.byStatus).map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 px-2 py-3">
                <p className="text-lg font-bold text-slate-900">{value}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-3">
            <p className="text-xs text-slate-500">Categories</p>
            <p className="text-lg font-bold text-slate-900">{categories.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Top Liked Prompts</h3>
          <div className="space-y-2">
            {metrics.topLiked.length === 0 ? (
              <p className="text-sm text-slate-500">No prompts yet.</p>
            ) : (
              metrics.topLiked.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {index + 1}. {p.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.category} · {p.type}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-rose-500">{p.likes || 0}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Top Copied Prompts</h3>
          <div className="space-y-2">
            {metrics.topCopied.length === 0 ? (
              <p className="text-sm text-slate-500">No prompts yet.</p>
            ) : (
              metrics.topCopied.map((p, index) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {index + 1}. {p.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.category} · {p.access}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{p.copies || 0}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3">User Subscriptions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {["Free", "Pro", "Team"].map((plan) => (
            <div key={plan} className="rounded-xl bg-slate-50 px-4 py-4">
              <p className="text-xs text-slate-500">{plan} users</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.subscriptions?.[plan] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
