import { createContext, useContext, useMemo, useState } from "react";
import {
  adminLogin,
  adminLogout,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  saveAuthSession,
} from "../lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());

  const login = async (email, password) => {
    const result = await adminLogin(email, password);
    saveAuthSession(result.token, result.user);
    setToken(result.token);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    try {
      await adminLogout();
    } catch {
      // Always clear the local session even if the API is unavailable.
    }
    clearAuthSession();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
