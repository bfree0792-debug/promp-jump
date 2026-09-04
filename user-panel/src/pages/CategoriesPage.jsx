import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { api, mediaUrl } from "../lib/api";
import { PortraitPromptGrid } from "../components/PromptCard";

export default function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedName = searchParams.get("name") || "";
  const [categories, setCategories] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [cats, all] = await Promise.all([api.getCategories(), api.getPrompts()]);
        setCategories(Array.isArray(cats) ? cats : []);
        setPrompts(
          (Array.isArray(all) ? all : []).filter(
            (p) => p.status === "Published" && p.access !== "Unassigned"
          )
        );
      } catch (error) {
        window.alert(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!selectedName) return prompts;
    return prompts.filter((p) => p.category === selectedName);
  }, [prompts, selectedName]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Categories</h1>
        <p className="text-sm text-slate-500 mt-1">Browse all categories created by admin.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading categories...</p>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          No categories yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => setSearchParams({})}
              className={`rounded-xl border p-4 text-left ${
                !selectedName
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">All Categories</p>
              <p className="text-xs text-slate-500 mt-1">{prompts.length} prompts</p>
            </button>

            {categories.map((c) => {
              const count = prompts.filter((p) => p.category === c.name).length;
              const active = selectedName === c.name;
              return (
                <button
                  key={c.id}
                  onClick={() => setSearchParams({ name: c.name })}
                  className={`rounded-xl border p-4 text-left ${
                    active
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {c.iconUrl ? (
                        <img src={mediaUrl(c.iconUrl)} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <FolderKanban size={18} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {c.description || `${count} prompts`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">
              {selectedName ? `${selectedName} prompts` : "All prompts"}
            </h2>
            <PortraitPromptGrid
              prompts={filtered}
              emptyText={
                selectedName
                  ? `No prompts in ${selectedName} yet.`
                  : "No published prompts yet. Assign Free, Pro, or Team in admin."
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
