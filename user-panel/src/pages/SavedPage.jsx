import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { getStoredUser } from "../lib/auth";
import { api } from "../lib/api";
import { PortraitPromptGrid } from "../components/PromptCard";

export default function SavedPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await api.getLibrary(user.id);
        setPrompts(Array.isArray(data.saved) ? data.saved : []);
      } catch (error) {
        window.alert(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-indigo-600" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Saved Prompts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Images, videos, and category prompts you saved.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading saved prompts...</p>
      ) : (
        <PortraitPromptGrid
          prompts={prompts}
          emptyText="No saved prompts yet. Tap Save on any prompt to add it here."
        />
      )}
    </div>
  );
}
