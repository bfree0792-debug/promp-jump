import { useEffect, useState } from "react";
import { Image as ImageIcon, PlayCircle, Plus, Trash2, Crown } from "lucide-react";
import { api, mediaUrl } from "../lib/api";

export default function ContentTierSection({ tier }) {
  const [items, setItems] = useState([]);
  const [allPrompts, setAllPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [tierItems, all] = await Promise.all([
        api.getPrompts(tier),
        api.getPrompts(),
      ]);
      setItems(Array.isArray(tierItems) ? tierItems : []);
      setAllPrompts(Array.isArray(all) ? all : []);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tier]);

  async function assignToTier(promptId) {
    try {
      await api.setPromptAccess(promptId, tier);
      setShowPicker(false);
      await load();
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function removeFromTier(promptId) {
    const ok = window.confirm(
      `Remove this prompt from ${tier} section?\n\nIt will NOT be deleted. It will stay in Prompt Management.`
    );
    if (!ok) return;

    try {
      // Only unassign from this section — never permanently delete here
      await api.setPromptAccess(promptId, "Unassigned");
      await load();
    } catch (error) {
      window.alert(error.message);
    }
  }

  const available = allPrompts.filter((p) => p.access !== tier);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-slate-800">{tier} Contents</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select which images/videos belong in the {tier} section for users.
          </p>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Select for {tier}
        </button>
      </div>

      <div className="p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No prompts in {tier} yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50"
              >
                <div className="relative h-28 bg-slate-200">
                  {item.type === "Video" ? (
                    <video src={mediaUrl(item.mediaUrl || item.thumbnail)} className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={mediaUrl(item.thumbnail || item.mediaUrl)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-black/60 text-white flex items-center gap-1">
                    {item.type === "Video" ? (
                      <PlayCircle className="w-3 h-3" />
                    ) : (
                      <ImageIcon className="w-3 h-3" />
                    )}
                    {item.type}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {item.description || "No description"}
                  </p>
                  <button
                    onClick={() => removeFromTier(item.id)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove from {tier}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPicker(false)} />
          <div className="relative max-w-3xl mx-auto mt-16 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Select content for {tier}</h4>
                <p className="text-sm text-slate-500">Choose an image or video to move into this section.</p>
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="w-9 h-9 rounded-lg hover:bg-slate-50 text-slate-500"
              >
                ×
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
              {available.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No other prompts available. Create prompts in Prompt Management first.
                </p>
              ) : (
                available.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => assignToTier(p.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 text-left"
                  >
                    <img
                      src={mediaUrl(p.thumbnail || p.mediaUrl)}
                      alt={p.title}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {p.type} · Current: {p.access}
                      </p>
                    </div>
                    <Crown className="w-4 h-4 text-blue-600" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
