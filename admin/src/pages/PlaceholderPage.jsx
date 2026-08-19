import { Construction } from "lucide-react";

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-card p-10 flex flex-col items-center justify-center text-center min-h-[420px]">
      <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <Construction className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
        {description ?? "This section is wired up and ready — connect it to your backend to bring it to life."}
      </p>
    </div>
  );
}
