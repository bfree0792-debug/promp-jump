import { Gift, Crown, Users, ChevronRight } from "lucide-react";

const ICONS = { gift: Gift, crown: Crown, users: Users };

const THEMES = {
  blue: {
    card: "bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100",
    iconBg: "bg-blue-600",
    title: "text-blue-900",
    badge: "bg-blue-600 text-white",
    arrow: "bg-white text-blue-600",
  },
  orange: {
    card: "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100",
    iconBg: "bg-orange-500",
    title: "text-orange-900",
    badge: "bg-orange-500 text-white",
    arrow: "bg-white text-orange-500",
  },
  purple: {
    card: "bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100",
    iconBg: "bg-violet-600",
    title: "text-violet-900",
    badge: "bg-violet-100 text-violet-700",
    arrow: "bg-white text-violet-600",
  },
};

export default function TierCard({ tier }) {
  const Icon = ICONS[tier.icon];
  const theme = THEMES[tier.theme];

  return (
    <div className={`relative rounded-2xl p-5 flex flex-col gap-4 ${theme.card}`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${theme.iconBg}`}>
          <Icon className="w-5 h-5 text-white" fill="white" fillOpacity={0.2} />
        </div>
        <div>
          <h3 className={`font-bold text-[15px] ${theme.title}`}>{tier.title}</h3>
          <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">{tier.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${theme.badge}`}>
          {tier.count}
        </span>
        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${theme.arrow}`}
          aria-label={`View ${tier.title}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
