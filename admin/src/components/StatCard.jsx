import { FileText, Image, Play, Gem, Flame, ArrowUp } from "lucide-react";

const ICONS = { fileText: FileText, image: Image, play: Play, gem: Gem, flame: Flame };

const THEMES = {
  purple: "bg-violet-50 text-violet-600",
  green: "bg-green-50 text-green-600",
  orange: "bg-orange-50 text-orange-600",
  pink: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
};

export default function StatCard({ stat }) {
  const Icon = ICONS[stat.icon];

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 flex items-center gap-3.5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${THEMES[stat.theme]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{stat.label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight mt-0.5">{stat.value}</p>
        <p className="text-[11px] text-green-600 font-medium flex items-center gap-0.5 mt-0.5">
          <ArrowUp className="w-3 h-3" />
          {stat.delta} from last month
        </p>
      </div>
    </div>
  );
}
