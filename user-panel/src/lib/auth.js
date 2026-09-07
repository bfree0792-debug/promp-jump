const TOKEN_KEY = "promptgenieToken";
const USER_KEY = "promptgenieUser";
const LOGIN_URL = "https://promp-jump-fron.vercel.app/login.html";
const USER_PANEL_URL = "";

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

export function updateStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAuthenticated() {
  return Boolean(getStoredToken() && getStoredUser());
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function redirectToLogin() {
  window.location.href = LOGIN_URL;
}

export function importAuthFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const userRaw = params.get("user");

  if (!token || !userRaw) {
    return false;
  }

  try {
    const user = JSON.parse(decodeURIComponent(userRaw));
    saveAuthSession(token, user);
    window.history.replaceState({}, "", window.location.pathname);
    return true;
  } catch {
    return false;
  }
}

export function buildUserPanelRedirectUrl(token, user) {
  const params = new URLSearchParams({
    token,
    user: JSON.stringify(user),
  });
  return `${USER_PANEL_URL}/?${params.toString()}`;
}
