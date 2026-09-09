import { useState, useEffect } from "react";
import {
  Bookmark,
  Crown,
  Download,
  Heart,
  Play,
  X,
} from "lucide-react";
import { useLibrary } from "../lib/library";
import { mediaUrl } from "../lib/api";

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f1f5f9'/%3E%3Cpath d='M160 210l40 40 60-70 80 90H60z' fill='%23cbd5e1'/%3E%3Ccircle cx='130' cy='140' r='25' fill='%23cbd5e1'/%3E%3C/svg%3E";

function promptMedia(prompt) {
  return mediaUrl(prompt.thumbnail || prompt.mediaUrl);
}

export function LandscapePromptCard({ prompt, onOpen }) {
  const { isSaved, isLiked, toggleSave, toggleLike, copyPromptText } = useLibrary();
  const isVideo = prompt.type === "Video" || (prompt.mediaUrl && /\.(mp4|webm|mov|ogg)$/i.test(prompt.mediaUrl));
  const media = promptMedia(prompt);
  const saved = isSaved(prompt.id);
  const liked = isLiked(prompt.id);

  return (
    <div className="group relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-sm hover:shadow-lg transition-all duration-300">
      <button
        type="button"
        onClick={() => onOpen?.(prompt)}
        className="absolute inset-0 w-full h-full block text-left"
      >
        {isVideo ? (
          <video
            src={media}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            muted
            loop
            onMouseEnter={(e) => { e.currentTarget.play().catch(() => {}); }}
            onMouseLeave={(e) => { e.currentTarget.pause(); }}
          />
        ) : (
          <img
            src={media}
            alt={prompt.title}
            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
            <Play size={10} className="fill-white" />
            {prompt.category || "Video AI"}
          </span>
          <span className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
            <Crown size={11} />
            {prompt.access}
          </span>
        </div>

        {/* Play Icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 bg-black/40 backdrop-blur-sm group-hover:bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform group-hover:scale-110">
            <Play size={18} className="fill-white ml-0.5" />
          </div>
        </div>
      </button>

      {/* Bottom info and actions bar */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/55 to-transparent flex items-center justify-between gap-2 z-20">
        <div className="min-w-0 flex-1 pr-1">
          <p className="text-xs sm:text-sm font-semibold text-white truncate drop-shadow-sm">
            {prompt.title}
          </p>
          <p className="text-[11px] text-slate-300 truncate opacity-80">
            {prompt.description || "16:9 AI Video Prompt"}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSave(prompt.id);
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
              saved ? "bg-indigo-600 text-white" : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title="Save"
          >
            <Bookmark size={13} fill={saved ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(prompt.id);
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
              liked ? "bg-rose-600 text-white" : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title="Like"
          >
            <Heart size={13} fill={liked ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyPromptText(prompt.id, prompt.description || prompt.title);
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-colors"
            title="Copy Prompt"
          >
            <Download size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TrendingPromptCard({ prompt, onOpen }) {
  const { isSaved, isLiked, toggleSave, toggleLike, copyPromptText } = useLibrary();
  const isVideo = prompt.type === "Video";
  const media = promptMedia(prompt);
  const saved = isSaved(prompt.id);
  const liked = isLiked(prompt.id);

  return (
    <div className="group relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={() => onOpen?.(prompt)}
        className="absolute inset-0 w-full h-full"
      >
        {isVideo ? (
          <video src={media} className="absolute inset-0 w-full h-full object-cover" muted />
        ) : (
          <img
            src={media}
            alt={prompt.title}
            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow">
              <Play size={16} className="text-slate-900 ml-0.5" />
            </div>
          </div>
        )}
      </button>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 px-2 py-2.5 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSave(prompt.id);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm ${
            saved ? "bg-indigo-500 text-white" : "bg-white/90 text-slate-700 hover:bg-white"
          }`}
          title="Save"
        >
          <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(prompt.id);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm ${
            liked ? "bg-rose-500 text-white" : "bg-white/90 text-slate-700 hover:bg-white"
          }`}
          title="Like"
        >
          <Heart size={15} fill={liked ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            copyPromptText(prompt.id, prompt.description || prompt.title);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/90 text-slate-700 hover:bg-white backdrop-blur-sm"
          title="Download"
        >
          <Download size={15} />
        </button>
      </div>
    </div>
  );
}

export function PromptCard({ prompt, onOpen, mediaFit = "cover" }) {
  const { isSaved, isLiked, toggleSave, toggleLike, copyPromptText } = useLibrary();
  const isVideo = prompt.type === "Video";
  const media = promptMedia(prompt);
  const saved = isSaved(prompt.id);
  const liked = isLiked(prompt.id);
  const fitClass = mediaFit === "contain" ? "object-contain" : "object-cover";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <button type="button" onClick={() => onOpen?.(prompt)} className="block w-full text-left">
        <div
          className="relative w-full aspect-[3/4] overflow-hidden bg-slate-200"
        >
          {isVideo ? (
            <video src={media} className={`absolute inset-0 w-full h-full ${fitClass}`} muted />
          ) : (
            <img
              src={media}
              alt={prompt.title}
              onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              className={`absolute inset-0 w-full h-full ${fitClass}`}
            />
          )}
          <span className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 rounded">
            {prompt.category || prompt.type}
          </span>
          {isVideo && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center">
                <Play size={15} className="text-slate-900 ml-0.5" />
              </div>
            </div>
          )}
        </div>
      </button>

      <div className="p-3">
        <button type="button" onClick={() => onOpen?.(prompt)} className="w-full text-left">
          <div className="text-sm font-semibold text-slate-900 mb-1 truncate">{prompt.title}</div>
          <div className="text-xs text-slate-500 mb-3 line-clamp-2">
            {prompt.description || "No description"}
          </div>
        </button>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleSave(prompt.id)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                saved ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
              title="Save"
            >
              <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => toggleLike(prompt.id)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                liked ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
              title="Like / Favorites"
            >
              <Heart size={14} fill={liked ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => copyPromptText(prompt.id, prompt.description || prompt.title)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-slate-100"
              title="Download (copy text)"
            >
              <Download size={14} />
            </button>
          </div>
          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
            <Crown size={12} /> {prompt.access}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PromptModal({ prompt, onClose }) {
  const { isSaved, isLiked, toggleSave, toggleLike, copyPromptText, recordHistory, usage, user } = useLibrary();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (prompt?.id) recordHistory(prompt.id);
  }, [prompt?.id, recordHistory]);

  if (!prompt) return null;

  const isVideo = prompt.type === "Video";
  const media = mediaUrl(prompt.mediaUrl || prompt.thumbnail);
  const saved = isSaved(prompt.id);
  const liked = isLiked(prompt.id);
  const currentUsage = usage?.usage || user?.usage || user?.dailyUsage || {};
  const limits = usage?.limits || user?.usage?.limits || {};
  const promptLimitKey = isVideo ? "videoCopies" : "imageCopies";
  const limitValue = limits[promptLimitKey] ?? limits[isVideo ? "dailyVideoCopies" : "dailyImageCopies"] ?? null;
  const usedValue = currentUsage[promptLimitKey] ?? currentUsage[isVideo ? "videoCopies" : "imageCopies"] ?? 0;
  const limitReached = limitValue !== null && usedValue >= limitValue;

  async function handleDownloadCopy() {
    const result = await copyPromptText(prompt.id, prompt.description || prompt.title);
    if (!result?.error) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-[30px]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[calc(100vh-60px)] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
        >
          <X size={18} />
        </button>

        <div className="bg-slate-950 relative overflow-hidden">
          {limitReached ? (
            <div className="relative">
              <div className="absolute inset-0 bg-slate-950/75 z-10" />
              {isVideo ? (
                <video
                  src={media}
                  controls
                  className="w-full max-h-[70vh] object-contain mx-auto blur-2xl grayscale opacity-60"
                />
              ) : (
                <img
                  src={media}
                  alt={prompt.title}
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  className="w-full max-h-[70vh] object-contain mx-auto blur-2xl grayscale opacity-60"
                />
              )}
              <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
                <div className="max-w-md rounded-2xl border border-red-200 bg-white/95 p-5 text-center shadow-xl">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">Plan limit reached</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">Please update your plan to continue.</p>
                  <p className="mt-2 text-sm text-slate-600">You can’t view the full image or prompt details until your daily limit resets or your plan is upgraded.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {isVideo ? (
                <video src={media} controls className="w-full max-h-[70vh] object-contain mx-auto" />
              ) : (
                <img
                  src={media}
                  alt={prompt.title}
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  className="w-full max-h-[70vh] object-contain mx-auto"
                />
              )}
            </>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{prompt.title}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {prompt.category || "General"} · {prompt.type} · {prompt.access}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSave(prompt.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${
                  saved
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
                {saved ? "Saved" : "Save"}
              </button>
              <button
                onClick={() => toggleLike(prompt.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${
                  liked
                    ? "bg-rose-600 text-white"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Heart size={15} fill={liked ? "currentColor" : "none"} />
                {liked ? "Liked" : "Like"}
              </button>
              <button
                onClick={handleDownloadCopy}
                disabled={limitReached}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${
                  limitReached
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                <Download size={15} />
                {copied ? "Copied!" : "Download"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export const PORTRAIT_CARD_CLASS =
  "w-[180px] sm:w-[210px] md:w-[240px] lg:w-[260px] shrink-0";

export const LANDSCAPE_CARD_CLASS =
  "w-[280px] sm:w-[320px] md:w-[360px] shrink-0";

export function LandscapePromptGrid({ prompts, emptyText }) {
  const [selected, setSelected] = useState(null);

  if (!prompts?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
        {emptyText || "No video prompts yet."}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="w-full">
            <LandscapePromptCard prompt={prompt} onOpen={setSelected} />
          </div>
        ))}
      </div>
      <PromptModal prompt={selected} onClose={() => setSelected(null)} />
    </>
  );
}

export function PortraitPromptGrid({ prompts, emptyText }) {
  const [selected, setSelected] = useState(null);

  if (!prompts?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
        {emptyText || "No prompts yet."}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        {prompts.map((prompt) => (
          <div key={prompt.id} className={PORTRAIT_CARD_CLASS}>
            <TrendingPromptCard prompt={prompt} onOpen={setSelected} />
          </div>
        ))}
      </div>
      <PromptModal prompt={selected} onClose={() => setSelected(null)} />
    </>
  );
}

export function PromptGrid({ prompts, emptyText }) {
  const [selected, setSelected] = useState(null);

  if (!prompts?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
        {emptyText || "No prompts yet."}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} onOpen={setSelected} />
        ))}
      </div>
      <PromptModal prompt={selected} onClose={() => setSelected(null)} />
    </>
  );
}
