import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { api } from "../lib/api";
import { PromptGrid } from "../components/PromptCard";

export default function TrendingPage() {
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

        const published = (Array.isArray(promptData) ? promptData : []).filter(
          (p) =>
            p.status === "Published" &&
            p.access !== "Unassigned" &&
            (p.type === "Image" || p.type === "Video")
        );

        const trendingPublished = (Array.isArray(trendingData) ? trendingData : []).filter(
          (p) =>
            p.status === "Published" &&
            p.access !== "Unassigned" &&
            (p.type === "Image" || p.type === "Video")
        );

        setPrompts(trendingPublished.length ? trendingPublished : published);
      } catch (err) {
        setError(err.message || "Could not load trending prompts.");
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Trending Prompts</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          All trending image and video prompts.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading trending prompts...</p>
      ) : (
        <PromptGrid
          prompts={prompts}
          emptyText="No trending image or video prompts yet."
        />
      )}
    </div>
  );
}
