import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { api } from "../lib/api";
import { useLibrary } from "../lib/library";
import { PortraitPromptGrid } from "../components/PromptCard";

export default function HistoryPage() {
  const { getHistoryIds } = useLibrary();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const ids = getHistoryIds();
        if (!ids.length) {
          setPrompts([]);
          return;
        }

        const all = await api.getPrompts();
        const published = (Array.isArray(all) ? all : []).filter(
          (p) => p.status === "Published" && p.access !== "Unassigned"
        );
        const byId = new Map(published.map((p) => [p.id, p]));
        setPrompts(ids.map((id) => byId.get(id)).filter(Boolean));
      } catch (error) {
        window.alert(error.message);
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getHistoryIds]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <History className="w-5 h-5 text-slate-600" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Recently viewed and downloaded prompts. History is unlimited.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading history...</p>
      ) : (
        <PortraitPromptGrid
          prompts={prompts}
          emptyText="No history yet. Open or download prompts to see them here."
        />
      )}
    </div>
  );
}
