import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { api } from "../lib/api";
import { isPublishedPrompt, matchesPromptSearch } from "../lib/prompts";
import { PromptGrid } from "../components/PromptCard";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [input, setInput] = useState(query);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api.getPrompts();
        setPrompts((Array.isArray(data) ? data : []).filter(isPublishedPrompt));
      } catch (err) {
        setError(err.message || "Could not search prompts.");
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return prompts.filter((prompt) => matchesPromptSearch(prompt, query));
  }, [prompts, query]);

  function submitSearch(event) {
    event.preventDefault();
    const next = input.trim();
    if (!next) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-3"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Search results
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {query.trim()
            ? `Showing matches for “${query.trim()}”`
            : "Type a prompt title, description, or category to search."}
        </p>
      </div>

      <form onSubmit={submitSearch} className="relative max-w-xl">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search prompts..."
          className="w-full pl-9 pr-24 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Searching...</p>
      ) : !query.trim() ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-10 text-center text-sm text-slate-500">
          Enter a search term to find prompts.
        </div>
      ) : (
        <PromptGrid
          prompts={results}
          emptyText={`No prompts found for “${query.trim()}”.`}
        />
      )}
    </div>
  );
}
