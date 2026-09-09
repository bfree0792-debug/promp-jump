import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TierCard from "../components/TierCard";
import StatCard from "../components/StatCard";
import ContentTierSection from "../components/ContentTierSection";
import PromptTable from "../components/PromptTable";
import { api } from "../lib/api";

const tierMeta = [
  {
    key: "Free",
    title: "Free Contents",
    description: "Manage free content available for all users.",
    icon: "gift",
    theme: "blue",
  },
  {
    key: "Pro",
    title: "Pro Contents",
    description: "Manage premium content for subscribed users.",
    icon: "crown",
    theme: "orange",
  },
  {
    key: "Team",
    title: "Team Contents",
    description: "Manage team-shared content and collaboration.",
    icon: "users",
    theme: "purple",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [counts, setCounts] = useState({ Free: 0, Pro: 0, Team: 0 });
  const [activeTier, setActiveTier] = useState("Free");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [all, userStats] = await Promise.all([api.getPrompts(), api.getUserStats()]);
        setPrompts(Array.isArray(all) ? all : []);
        setCounts({
          Free: all.filter((p) => p.access === "Free").length,
          Pro: all.filter((p) => p.access === "Pro").length,
          Team: all.filter((p) => p.access === "Team").length,
        });
        setStats(userStats);
      } catch {
        // keep empty state
      }
    }
    load();
  }, [activeTier]);

  const contentTiers = tierMeta.map((t) => ({
    ...t,
    count: `${counts[t.key] || 0} Contents`,
  }));

  const dashboardStats = [
    {
      key: "total",
      label: "Total Prompts",
      value: String(prompts.length),
      delta: "",
      icon: "fileText",
      theme: "purple",
    },
    {
      key: "image",
      label: "Image Prompts",
      value: String(prompts.filter((p) => p.type === "Image").length),
      delta: "",
      icon: "image",
      theme: "green",
    },
    {
      key: "video",
      label: "Video Prompts",
      value: String(prompts.filter((p) => p.type === "Video").length),
      delta: "",
      icon: "play",
      theme: "orange",
    },
    {
      key: "active",
      label: "Active Users",
      value: String(stats?.active ?? 0),
      delta: "",
      icon: "gem",
      theme: "pink",
    },
    {
      key: "copied",
      label: "Most Copied",
      value: String(stats?.mostCopied?.[0]?.copies ?? 0),
      delta: "",
      icon: "flame",
      theme: "sky",
    },
  ];

  async function handlePromptAction(action, prompt) {
    const promptId = prompt.id || prompt._id;
    if (!promptId) return;

    if (action === "edit") {
      navigate(`/prompts?edit=${encodeURIComponent(promptId)}`);
      return;
    }

    if (action === "delete") {
      if (!window.confirm(`Delete prompt "${prompt.title}"?`)) return;
      const previousPrompts = prompts;
      setPrompts((current) => current.filter((item) => (item.id || item._id) !== promptId));
      try {
        await api.deletePrompt(promptId);
      } catch (error) {
        setPrompts(previousPrompts);
        window.alert(error.message || "Could not delete prompt.");
      }
      return;
    }

    const previousPrompts = prompts;
    let update;
    let save;

    if (action === "trending") {
      update = { isTrending: !prompt.isTrending };
      save = api.setPromptTrending(promptId, update.isTrending);
    } else if (action === "archive") {
      update = { status: prompt.status === "Archived" ? "Published" : "Archived" };
      save = api.setPromptStatus(promptId, update.status);
    } else if (action === "toggle") {
      update = { access: prompt.access === "Premium" || prompt.access === "Pro" ? "Free" : "Pro" };
      save = api.setPromptAccess(promptId, update.access);
    } else {
      return;
    }

    setPrompts((current) =>
      current.map((item) =>
        (item.id || item._id) === promptId ? { ...item, ...update } : item
      )
    );

    try {
      await save;
    } catch (error) {
      setPrompts(previousPrompts);
      window.alert(error.message || "Action failed.");
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contentTiers.map((tier) => (
          <button key={tier.key} onClick={() => setActiveTier(tier.key)} className="text-left">
            <TierCard tier={tier} />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>

      <ContentTierSection tier={activeTier} />

      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-slate-800">Recent Prompts</h2>
        <Link to="/prompts" className="text-[13px] font-semibold text-blue-600 hover:underline">
          View all →
        </Link>
      </div>
      <PromptTable
        prompts={prompts.slice(0, 5).map((p) => ({
          ...p,
          tags: p.tags || [],
          views: String(p.views ?? 0),
          downloads: String(p.downloads ?? 0),
          likes: String(p.likes ?? 0),
          access: p.access === "Pro" ? "Premium" : p.access,
        }))}
        onAction={handlePromptAction}
      />
    </div>
  );
}
