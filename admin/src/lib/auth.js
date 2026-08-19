const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "promptjumpAdminToken";
const USER_KEY = "promptjumpAdminUser";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function adminLogin(email, password) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Cannot reach the API. Make sure the backend is running on port 4000."
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Login failed. Please try again.");
  }

  return result;
}
