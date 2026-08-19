import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { getStoredUser, saveAuthSession, getStoredToken } from "./auth";
import { api } from "./api";

const LibraryContext = createContext(null);

function historyKey(userId) {
  return `promptHistory_${userId || "guest"}`;
}

function readHistory(userId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(historyKey(userId)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(userId, ids) {
  // History is unlimited for all plans
  localStorage.setItem(historyKey(userId), JSON.stringify(ids));
}

export function LibraryProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [savedIds, setSavedIds] = useState(() => getStoredUser()?.savedPrompts || []);
  const [likedIds, setLikedIds] = useState(() => getStoredUser()?.likedPrompts || []);
  const [usage, setUsage] = useState(() => getStoredUser()?.usage || null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function loadLibrary() {
      const current = getStoredUser();
      if (!current?.id) return;

      try {
        const data = await api.getLibrary(current.id);
        setUser(data.user);
        setSavedIds(data.user.savedPrompts || []);
        setLikedIds(data.user.likedPrompts || []);
        setUsage(data.usage || data.user.usage || null);
        saveAuthSession(getStoredToken(), data.user);
      } catch {
        // keep local state
      }
    }

    loadLibrary();
  }, []);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2800);
  }

  function applyUserResult(resultUser, nextUsage) {
    if (!resultUser) return;
    setUser(resultUser);
    setSavedIds(resultUser.savedPrompts || []);
    setLikedIds(resultUser.likedPrompts || []);
    if (nextUsage || resultUser.usage) {
      setUsage(nextUsage || resultUser.usage);
    }
    saveAuthSession(getStoredToken(), resultUser);
  }

  const recordHistory = useCallback((promptId) => {
    if (!promptId) return;
    const current = getStoredUser();
    const ids = readHistory(current?.id);
    const next = [promptId, ...ids.filter((id) => id !== promptId)];
    writeHistory(current?.id, next);
  }, []);

  async function toggleSave(promptId) {
    if (!user?.id) return;
    try {
      const result = await api.toggleSave(user.id, promptId);
      applyUserResult(result.user, result.usage);
      showToast(result.saved ? "Saved to library" : "Removed from saved");
      return result;
    } catch (error) {
      showToast(error.message || "Could not save prompt.");
      throw error;
    }
  }

  async function toggleLike(promptId) {
    if (!user?.id) return;
    try {
      const result = await api.toggleLike(user.id, promptId);
      applyUserResult(result.user, result.usage);
      showToast(result.liked ? "Added to favorites" : "Removed from favorites");
      return result;
    } catch (error) {
      showToast(error.message || "Could not update favorite.");
      throw error;
    }
  }

  async function copyPromptText(promptId, fallbackText = "") {
    if (!user?.id) return;
    try {
      const result = await api.copyPrompt(user.id, promptId);
      if (result.user) applyUserResult(result.user, result.usage);
      const text = result.text || fallbackText || "";
      await navigator.clipboard.writeText(text);
      recordHistory(promptId);
      showToast("Prompt text copied");
      return result;
    } catch (error) {
      showToast(error.message || "Could not copy prompt.");
      throw error;
    }
  }

  const getHistoryIds = useCallback(() => readHistory(user?.id), [user?.id]);

  const value = useMemo(
    () => ({
      user,
      usage,
      savedIds,
      likedIds,
      isSaved: (id) => savedIds.includes(id),
      isLiked: (id) => likedIds.includes(id),
      toggleSave,
      toggleLike,
      copyPromptText,
      recordHistory,
      getHistoryIds,
      toast,
    }),
    [user, usage, savedIds, likedIds, toast, recordHistory, getHistoryIds]
  );

  return (
    <LibraryContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] max-w-[90vw] bg-slate-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg text-center">
          {toast}
        </div>
      )}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
