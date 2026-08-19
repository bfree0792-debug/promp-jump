import { Search, Plus } from "lucide-react";

export default function FilterBar({
  onAddNew,
  search,
  onSearchChange,
  categories = [],
  category,
  onCategoryChange,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
        <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
          <Search className="w-4 h-4 shrink-0" />
          <input
            type="search"
            value={search || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search prompts by title, tags, or content..."
            className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 flex-1 min-w-0"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-[11px] text-slate-400">Category</label>
          <select
            value={category || "all"}
            onChange={(e) => onCategoryChange?.(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="General">General</option>
            {categories.map((c) => (
              <option key={c.id || c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 whitespace-nowrap self-end"
        >
          <Plus className="w-4 h-4" />
          Add New Prompt
        </button>
      </div>
    </div>
  );
}
