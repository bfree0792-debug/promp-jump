import { getStoredToken, getStoredUser } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://promp-jump-54.onrender.com";

async function request(path, options = {}) {
  let response;

  const headers = { ...(options.headers || {}) };
  const user = getStoredUser();
  const token = getStoredToken();

  if (user?.id || user?._id) {
    headers["x-admin-id"] = user.id || user._id;
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot reach the API. Make sure the backend is running on port 4000."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export const api = {
  getPrompts: (access) =>
    request(access ? `/api/prompts?access=${encodeURIComponent(access)}` : "/api/prompts"),
  createPrompt: (formData) =>
    request("/api/prompts", { method: "POST", body: formData }),
  updatePrompt: (id, payload) => {
    if (payload instanceof FormData) {
      return request(`/api/prompts/${id}`, { method: "PATCH", body: payload });
    }
    return request(`/api/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  deletePrompt: (id) => request(`/api/prompts/${id}`, { method: "DELETE" }),
  setPromptAccess: (id, access) =>
    request(`/api/prompts/${id}/access`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access }),
    }),
  setPromptStatus: (id, status) =>
    request(`/api/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
  setPromptTrending: (id, isTrending) =>
    request(`/api/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTrending }),
    }),
  getTrending: () => request("/api/prompts/trending"),
  getMostCopied: () => request("/api/prompts/most-copied"),
  getUsers: () => request("/api/users"),
  getUserStats: () => request("/api/users/stats"),
  getRevenue: () => request("/api/users/revenue"),
  getCategories: () => request("/api/categories"),
  getAnnouncements: () => request("/api/announcements"),
  createAnnouncement: (payload) =>
    request("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateAnnouncement: (id, payload) =>
    request(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteAnnouncement: (id) => request(`/api/announcements/${id}`, { method: "DELETE" }),
  createCategory: (payload) => {
    if (payload instanceof FormData) {
      return request("/api/categories", { method: "POST", body: payload });
    }
    return request("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),
  getPlans: () => request("/api/subscriptions"),
  createPlan: (payload) =>
    request("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updatePlan: (id, payload) =>
    request(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deletePlan: (id) => request(`/api/subscriptions/${id}`, { method: "DELETE" }),
};

export function mediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("blob:")) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const parsed = new URL(path);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${API_BASE_URL}${parsed.pathname}`;
      }
    } catch {
      return path;
    }
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith("/uploads/")) {
    return `${API_BASE_URL}${normalized}`;
  }
  return path;
}