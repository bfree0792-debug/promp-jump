const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "promptjumpAdminToken";
const USER_KEY = "promptjumpAdminUser";
const LOCKOUT_KEY = "promptjump_admin_login_locked_until";
const ATTEMPTS_KEY = "promptjump_admin_login_failed_attempts";
const CHALLENGE_KEY = "promptjump_admin_challenge_required";

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
  clearAdminLockout();
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAdminLockoutUntil() {
  const value = localStorage.getItem(LOCKOUT_KEY);
  if (!value) return null;
  const timestamp = Number(value);
  if (isNaN(timestamp) || timestamp <= Date.now()) {
    localStorage.removeItem(LOCKOUT_KEY);
    return null;
  }
  return timestamp;
}

export function setAdminLockoutUntil(timestamp) {
  localStorage.setItem(LOCKOUT_KEY, String(timestamp));
}

export function clearAdminLockout() {
  localStorage.removeItem(LOCKOUT_KEY);
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(CHALLENGE_KEY);
}

export function getAdminChallengeRequired() {
  return localStorage.getItem(CHALLENGE_KEY) === "true";
}

export function setAdminChallengeRequired(required) {
  if (required) {
    localStorage.setItem(CHALLENGE_KEY, "true");
  } else {
    localStorage.removeItem(CHALLENGE_KEY);
  }
}

export function getAdminFailedAttempts() {
  const value = localStorage.getItem(ATTEMPTS_KEY);
  if (!value) return 0;
  const count = Number(value);
  return isNaN(count) ? 0 : count;
}

export function setAdminFailedAttempts(count) {
  localStorage.setItem(ATTEMPTS_KEY, String(count));
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
    const error = new Error(result.message || "Login failed. Please try again.");
    error.status = response.status;
    const retryAfterHeader = response.headers.get("Retry-After");
    error.retryAfterSeconds =
      result.retryAfterSeconds ||
      (retryAfterHeader ? Number(retryAfterHeader) : null);
    error.remaining = response.headers.get("RateLimit-Remaining")
      ? Number(response.headers.get("RateLimit-Remaining"))
      : null;
    throw error;
  }

  return result;
}
