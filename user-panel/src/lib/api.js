import { getStoredToken, getStoredUser } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  let response;

  const headers = { ...(options.headers || {}) };
  const user = getStoredUser();
  const token = getStoredToken();

  if (user?.id || user?._id) {
    headers["x-user-id"] = user.id || user._id;
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
  getPrompts: () => request("/api/prompts"),
  getCategories: () => request("/api/categories"),
  getTrending: () => request("/api/prompts/trending"),
  getAnnouncements: () => request("/api/announcements"),
  getPlans: () => request("/api/subscriptions"),
  getLibrary: (userId) => request(`/api/library/${userId}/library`),
  getUsage: (userId) => request(`/api/library/${userId}/usage`),
  getUserProfile: (userId) => request(`/api/users/${userId}`),
  updateUserProfile: (userId, payload) =>
    request(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  subscribeToPlan: (userId, plan) =>
    request(`/api/users/${userId}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: plan.id,
        planName: plan.name,
        planPrice: plan.price,
        billingPeriod: plan.billingPeriod,
      }),
    }),
  uploadUserAvatar: async (userId, file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    let response;
    const headers = {};
    if (userId) headers["x-user-id"] = userId;
    const token = getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      response = await fetch(`${API_BASE_URL}/api/users/${userId}/avatar`, {
        method: "POST",
        headers,
        body: formData,
      });
    } catch {
      throw new Error(
        "Cannot reach the API. Make sure the backend is running on port 4000."
      );
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Could not upload avatar.");
    }
    return data;
  },
  toggleSave: (userId, promptId) =>
    request(`/api/library/${userId}/save/${promptId}`, { method: "POST" }),
  toggleLike: (userId, promptId) =>
    request(`/api/library/${userId}/like/${promptId}`, { method: "POST" }),
  copyPrompt: (userId, promptId) =>
    request(`/api/library/${userId}/copy/${promptId}`, { method: "POST" }),
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
