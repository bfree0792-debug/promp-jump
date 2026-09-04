import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import { isFreeAccess, isPremiumAccess, isPublishedPrompt } from "../lib/prompts";
import { PromptGrid, LandscapePromptGrid } from "../components/PromptCard";

const SECTION_META = {
  trending: {
    title: "Trending Prompts",
    description: "Most liked and copied prompts.",
  },
  premium: {
    title: "Premium Prompts",
    description: "Pro and Team access prompts.",
  },
  free: {
    title: "Free Prompts",
    description: "Prompts available on the Free plan.",
  },
  random: {
    title: "Random Prompts",
    description: "A mixed showcase of Free, Pro, and Team AI image prompts.",
  },
  video: {
    title: "Video Prompts",
    description: "High quality AI video prompts, animations, and cinematic scenes.",
  },
};

export default function BrowsePage() {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") || "trending";
  const meta = SECTION_META[section] || SECTION_META.trending;

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [promptData, trendingData] = await Promise.all([
          api.getPrompts(),
          api.getTrending(),
        ]);

        const published = (Array.isArray(promptData) ? promptData : []).filter(isPublishedPrompt);

        if (section === "premium") {
          setPrompts(published.filter((p) => isPremiumAccess(p.access)));
          return;
        }

        if (section === "free") {
          setPrompts(published.filter((p) => isFreeAccess(p.access)));
          return;
        }

        if (section === "random") {
          const isVideoPrompt = (p) =>
            p.type === "Video" ||
            (p.mediaUrl && /\.(mp4|webm|mov|ogg)$/i.test(p.mediaUrl)) ||
            (p.category && p.category.toLowerCase().includes("video"));

          const isImagePrompt = (p) =>
            p.type === "Image" ||
            (!p.type && (!p.mediaUrl || !/\.(mp4|webm|mov|ogg)$/i.test(p.mediaUrl))) ||
            (!isVideoPrompt(p));

          const allImages = published.filter(isImagePrompt);
          setPrompts([...allImages].sort(() => Math.random() - 0.5));
          return;
        }

        if (section === "video") {
          const isVideoPrompt = (p) =>
            p.type === "Video" ||
            (p.mediaUrl && /\.(mp4|webm|mov|ogg)$/i.test(p.mediaUrl)) ||
            (p.category && p.category.toLowerCase().includes("video"));
          setPrompts(published.filter(isVideoPrompt));
          return;
        }

        const trendingPublished = (Array.isArray(trendingData) ? trendingData : []).filter(
          (p) => p.status === "Published" && p.access !== "Unassigned"
        );
        setPrompts(trendingPublished.length ? trendingPublished : published);
      } catch (err) {
        setError(err.message || "Could not load prompts.");
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [section]);

  const emptyText = useMemo(() => {
    if (section === "premium") return "No premium prompts yet. Assign Pro or Team in admin.";
    if (section === "free") return "No free prompts yet. Assign Free in admin.";
    if (section === "random") return "No image prompts found.";
    if (section === "video") return "No video prompts yet. Add Video type prompts in admin.";
    return "No published prompts yet. Assign Free, Pro, or Team in admin.";
  }, [section]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{meta.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{meta.description}</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading prompts...</p>
      ) : section === "video" ? (
        <LandscapePromptGrid prompts={prompts} emptyText={emptyText} />
      ) : (
        <PromptGrid prompts={prompts} emptyText={emptyText} />
      )}
    </div>
  );
}
