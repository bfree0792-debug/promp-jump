import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  PlayCircle,
  Heart,
  Crown,
  MoreVertical,
  Pencil,
  TrendingUp,
  ToggleLeft,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { categoryTagStyles } from "../data/mockData";
import { mediaUrl } from "../lib/api";

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Cpath d='M160 210l40 40 60-70 80 90H60z' fill='%23cbd5e1'/%3E%3Ccircle cx='130' cy='140' r='25' fill='%23cbd5e1'/%3E%3C/svg%3E";

const statusDot = {
  Published: "bg-green-500 text-green-700",
  Draft: "bg-blue-500 text-blue-700",
  Archived: "bg-slate-400 text-slate-500",
};

function RowMenu({ open, onClose, prompt, onAction }) {
  const ref = useRef(null);
  const isPremium = prompt.access === "Premium" || prompt.access === "Pro";
  const isTrending = Boolean(prompt.isTrending);
  const isArchived = prompt.status === "Archived";

  const actions = [
    { key: "edit", label: "Edit", icon: Pencil },
    {
      key: "trending",
      label: isTrending ? "Remove Trending" : "Make Trending",
      icon: TrendingUp,
    },
    {
      key: "toggle",
      label: isPremium ? "Make Free" : "Toggle Premium",
      icon: ToggleLeft,
    },
    {
      key: "archive",
      label: isArchived ? "Unarchive" : "Archive",
      icon: Archive,
    },
    { key: "delete", label: "Delete", icon: Trash2, danger: true },
  ];

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-100 shadow-lg py-1.5 z-30"
    >
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium hover:bg-slate-50 ${
            action.danger ? "text-red-500" : "text-slate-600"
          }`}
          onClick={() => {
            onAction?.(action.key, prompt);
            onClose();
          }}
        >
          <action.icon className="w-[15px] h-[15px]" />
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default function PromptTable({ prompts, onAction }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [checkedAll, setCheckedAll] = useState(false);
  const [checked, setChecked] = useState({});

  const toggleAll = () => {
    const next = !checkedAll;
    setCheckedAll(next);
    const map = {};
    prompts.forEach((p) => (map[p.id] = next));
    setChecked(map);
  };

  const toggleOne = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="border-b border-slate-100 text-[12px] text-slate-400">
              <th className="py-3 pl-5 pr-2 w-10">
                <input
                  type="checkbox"
                  checked={checkedAll}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-blue-600"
                />
              </th>
              <th className="py-3 pr-3 font-medium">Thumbnail</th>
              <th className="py-3 pr-3 font-medium">Title</th>
              <th className="py-3 pr-3 font-medium">Category</th>
              <th className="py-3 pr-3 font-medium">Type</th>
              <th className="py-3 pr-3 font-medium">Views</th>
              <th className="py-3 pr-3 font-medium">Downloads</th>
              <th className="py-3 pr-3 font-medium">Likes</th>
              <th className="py-3 pr-3 font-medium">Access</th>
              <th className="py-3 pr-3 font-medium">Status</th>
              <th className="py-3 pr-5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="py-3 pl-5 pr-2">
                  <input
                    type="checkbox"
                    checked={!!checked[p.id]}
                    onChange={() => toggleOne(p.id)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                </td>
                <td className="py-2.5 pr-3">
                  <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-slate-200 border border-slate-100 shadow-sm">
                    <img
                      src={mediaUrl(p.thumbnail || p.mediaUrl)}
                      alt={p.title}
                      onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                      className="w-full h-full object-cover"
                    />
                    {p.type === "Video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <PlayCircle className="w-6 h-6 text-white" fill="black" fillOpacity={0.2} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-2.5 pr-3 max-w-[220px]">
                  <p className="text-[13.5px] font-semibold text-slate-800 truncate">{p.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.isTrending && (
                      <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">
                        Trending
                      </span>
                    )}
                    {(p.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10.5px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`text-[11.5px] font-medium px-2.5 py-1 rounded-md ${
                      categoryTagStyles[p.category] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.category}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-1.5 text-[13px] text-slate-600">
                    {p.type === "Image" ? (
                      <ImageIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <PlayCircle className="w-4 h-4 text-orange-500" />
                    )}
                    {p.type}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-[13px] text-slate-600">{p.views}</td>
                <td className="py-2.5 pr-3 text-[13px] text-slate-600">{p.downloads}</td>
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-1 text-[13px] text-slate-600">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    {p.likes}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  {p.access === "Premium" || p.access === "Pro" ? (
                    <span className="flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 w-fit">
                      <Crown className="w-3 h-3" />
                      Pro
                    </span>
                  ) : p.access === "Team" ? (
                    <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 w-fit">
                      Team
                    </span>
                  ) : p.access === "Free" ? (
                    <span className="text-[11.5px] font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 w-fit">
                      Free
                    </span>
                  ) : (
                    <span className="text-[11.5px] font-medium px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 w-fit">
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-1.5 text-[13px] text-slate-600">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status]?.split(" ")[0]}`} />
                    {p.status}
                  </span>
                </td>
                <td className="py-2.5 pr-5 text-right relative">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400"
                    title="Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <RowMenu
                    open={openMenuId === p.id}
                    onClose={() => setOpenMenuId(null)}
                    prompt={p}
                    onAction={onAction}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
        <p className="text-[13px] text-slate-500">
          Showing {prompts.length} prompt{prompts.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-md text-[13px] font-medium flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-200"
          >
            1
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
