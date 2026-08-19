import { useEffect, useState } from "react";
import { Heart, Copy, Crown } from "lucide-react";
import { api, mediaUrl } from "../lib/api";

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Cpath d='M160 210l40 40 60-70 80 90H60z' fill='%23cbd5e1'/%3E%3Ccircle cx='130' cy='140' r='25' fill='%23cbd5e1'/%3E%3C/svg%3E";

export default function TrendingPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getTrending();
        setPrompts(Array.isArray(data) ? data : []);
      } catch (error) {
        window.alert(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
        <h2 className="text-[15px] font-bold text-slate-800">Trending Prompts</h2>
        <p className="text-sm text-slate-500 mt-1">
          Prompts ranked by most likes and most copied descriptions.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6 text-slate-500 text-sm">
          Loading...
        </div>
      ) : prompts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6 text-slate-500 text-sm">
          No trending prompts yet. Upload prompts and they will appear here as likes/copies grow.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((p, index) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden"
            >
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-200">
                <img
                  src={mediaUrl(p.thumbnail || p.mediaUrl)}
                  alt={p.title}
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 z-10 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  #{index + 1}
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-slate-900 truncate">{p.title}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {p.description || "No description"}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" /> {p.likes ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5 text-indigo-500" /> {p.copies ?? 0}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-amber-600 font-medium">
                    <Crown className="w-3.5 h-3.5" /> {p.access}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
