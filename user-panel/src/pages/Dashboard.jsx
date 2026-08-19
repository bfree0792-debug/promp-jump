import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FolderKanban } from "lucide-react";
import { api, mediaUrl } from "../lib/api";
import { isPremiumAccess, isPublishedPrompt } from "../lib/prompts";
import { useSettings } from "../lib/settings";
import { PromptCard, PromptModal, TrendingPromptCard, PORTRAIT_CARD_CLASS } from "../components/PromptCard";

const PREVIEW_LIMIT = 5;

function HorizontalPromptRow({ prompts, emptyText, viewMoreTo, alwaysShowViewMore, variant = "default" }) {
  const [selected, setSelected] = useState(null);
  const preview = prompts.slice(0, PREVIEW_LIMIT);
  const hasMore = prompts.length > PREVIEW_LIMIT;
  const showViewMore = viewMoreTo && (alwaysShowViewMore || hasMore);
  const isPortrait = variant === "portrait";
  const cardClass = isPortrait ? `${PORTRAIT_CARD_CLASS} snap-start` : "w-[220px] sm:w-[240px] shrink-0 snap-start";

  if (!prompts.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
        {preview.map((prompt) => (
          <div key={prompt.id} className={cardClass}>
            {isPortrait ? (
              <TrendingPromptCard prompt={prompt} onOpen={setSelected} />
            ) : (
              <PromptCard prompt={prompt} onOpen={setSelected} />
            )}
          </div>
        ))}

        {showViewMore && (
          <Link
            to={viewMoreTo}
            className={`${cardClass} snap-start flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-colors ${
              isPortrait ? "aspect-[3/4]" : "min-h-[220px]"
            }`}
          >
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700">
              <ChevronRight size={18} />
            </span>
            <span className="text-xs font-semibold text-slate-800">View more</span>
            {hasMore ? (
              <span className="text-[10px] text-slate-500">{prompts.length - PREVIEW_LIMIT} more</span>
            ) : (
              <span className="text-[10px] text-slate-500">See all</span>
            )}
          </Link>
        )}
      </div>
      <PromptModal prompt={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function PromptSection({ title, prompts, emptyText, viewMoreTo, alwaysShowViewMore, variant }) {
  const hasMore = prompts.length > PREVIEW_LIMIT;
  const showHeaderViewMore = viewMoreTo && (alwaysShowViewMore || hasMore);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {showHeaderViewMore ? (
          <Link
            to={viewMoreTo}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            View more
          </Link>
        ) : (
          <span className="text-xs text-slate-400">{prompts.length} items</span>
        )}
      </div>
      <HorizontalPromptRow
        prompts={prompts}
        emptyText={emptyText}
        viewMoreTo={viewMoreTo}
        alwaysShowViewMore={alwaysShowViewMore}
        variant={variant}
      />
    </section>
  );
}

function CategoriesSection({ categories }) {
  if (!categories.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-slate-900">Categories</h2>
        <Link
          to="/categories"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/categories?name=${encodeURIComponent(category.name)}`}
            className="w-[148px] sm:w-[160px] shrink-0 snap-start rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center mb-3">
              {category.iconUrl ? (
                <img
                  src={mediaUrl(category.iconUrl)}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FolderKanban size={18} className="text-slate-400" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900 truncate">{category.name}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {category.description || "Browse prompts"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [trending, setTrending] = useState([]);
  const [premium, setPremium] = useState([]);
  const [free, setFree] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { profile, settings } = useSettings();
  const firstName = profile?.fullName?.split(" ")[0] || "User";
  const showTrending = settings.preferences.showTrendingOnDashboard;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [promptData, trendingData, categoryData] = await Promise.all([
          api.getPrompts(),
          api.getTrending(),
          api.getCategories(),
        ]);

        const published = (Array.isArray(promptData) ? promptData : []).filter(isPublishedPrompt);

        const isMediaPrompt = (p) => p.type === "Image" || p.type === "Video";

        const trendingPublished = (Array.isArray(trendingData) ? trendingData : []).filter(
          (p) =>
            p.status === "Published" &&
            p.access !== "Unassigned" &&
            isMediaPrompt(p)
        );

        setTrending(
          trendingPublished.length
            ? trendingPublished
            : published.filter(isMediaPrompt).slice(0, 12)
        );
        setPremium(published.filter((p) => isPremiumAccess(p.access)));
        setFree(published.filter((p) => p.access === "Free"));
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (err) {
        setError(err.message || "Could not load content.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
        Welcome back, {firstName} 👋
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6 text-sm sm:text-base">
        Discover trending, premium, and free prompts.
      </p>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading content...</p>
      ) : (
        <>
          <CategoriesSection categories={categories} />
          {showTrending && (
            <PromptSection
              title="Trending Prompts"
              prompts={trending}
              viewMoreTo="/trending"
              alwaysShowViewMore
              variant="portrait"
              emptyText="No trending prompts yet. Upload and publish prompts in admin to see them here."
            />
          )}
          <PromptSection
            title="Premium Prompts"
            prompts={premium}
            viewMoreTo="/browse?section=premium"
            emptyText="No premium prompts yet."
          />
          <PromptSection
            title="Free Prompts"
            prompts={free}
            viewMoreTo="/browse?section=free"
            variant="portrait"
            emptyText="No free prompts yet."
          />
        </>
      )}
    </>
  );
}
