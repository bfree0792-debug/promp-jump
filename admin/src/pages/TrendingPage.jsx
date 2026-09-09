import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Heart, PlayCircle, Search, TrendingUp, X } from "lucide-react";
import { api, mediaUrl } from "../lib/api";

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Cpath d='M160 210l40 40 60-70 80 90H60z' fill='%23cbd5e1'/%3E%3Ccircle cx='130' cy='140' r='25' fill='%23cbd5e1'/%3E%3C/svg%3E";

function MediaPreview({ prompt }) {
  if (prompt.type === "Video") {
    return (
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-200">
        <video src={mediaUrl(prompt.mediaUrl)} poster={mediaUrl(prompt.thumbnail)} muted playsInline controls className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
          <PlayCircle className="w-3 h-3" /> Video
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-200">
      <img src={mediaUrl(prompt.thumbnail || prompt.mediaUrl)} alt={prompt.title} onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} className="w-full h-full object-cover" />
      <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">Image</span>
    </div>
  );
}

export default function TrendingPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getPrompts();
        setPrompts(Array.isArray(data) ? data : []);
      } catch (requestError) {
        setError(requestError.message || "Could not load prompts.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const visiblePrompts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return prompts.filter((prompt) => {
      if (filter !== "All" && prompt.type !== filter) return false;
      if (!query) return true;
      return [prompt.title, prompt.description, prompt.category].filter(Boolean).join(" ").toLowerCase().includes(query);
    });
  }, [filter, prompts, search]);

  const selectedCount = prompts.filter((prompt) => prompt.isTrending).length;

  async function toggleTrending(prompt) {
    const promptId = prompt.id || prompt._id;
    if (!promptId) return;

    const nextValue = !prompt.isTrending;
    setSavingId(promptId);
    setError("");
    setPrompts((current) => current.map((item) => (item.id || item._id) === promptId ? { ...item, isTrending: nextValue } : item));

    try {
      await api.setPromptTrending(promptId, nextValue);
    } catch (requestError) {
      setPrompts((current) => current.map((item) => (item.id || item._id) === promptId ? { ...item, isTrending: !nextValue } : item));
      setError(requestError.message || "Could not update trending selection.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-[15px] font-bold text-slate-800">Trending Prompts</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">Select the image and video prompts that should appear in the user trending section.</p>
          </div>
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{selectedCount} selected</div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompts..." className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            {["All", "Image", "Video"].map((type) => (
              <button key={type} type="button" onClick={() => setFilter(type)} className={`px-3 py-2 rounded-lg text-sm font-semibold border ${filter === type ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6 text-slate-500 text-sm">Loading...</div>
      ) : visiblePrompts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6 text-slate-500 text-sm">No prompts match this filter.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visiblePrompts.map((prompt) => {
            const promptId = prompt.id || prompt._id;
            const selected = Boolean(prompt.isTrending);
            const saving = savingId === promptId;
            return (
              <div key={promptId} className={`bg-white rounded-xl border shadow-card overflow-hidden ${selected ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-100"}`}>
                <MediaPreview prompt={prompt} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 truncate">{prompt.title}</p>
                    {selected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prompt.description || "No description"}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" />{prompt.likes ?? 0}</span>
                    <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5 text-indigo-500" />{prompt.copies ?? 0}</span>
                    <span className="ml-auto">{prompt.access}</span>
                  </div>
                  <button type="button" disabled={saving} onClick={() => toggleTrending(prompt)} className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-60 ${selected ? "border border-slate-200 text-slate-600 hover:bg-slate-50" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                    {selected ? <X className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    {saving ? "Saving..." : selected ? "Remove from Trending" : "Add to Trending"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
