import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { isAuthenticated, redirectToLogin } from "../lib/auth";

export default function ProtectedRoute() {
  const authed = isAuthenticated();

  useEffect(() => {
    if (!authed) {
      redirectToLogin();
    }
  }, [authed]);

  if (!authed) {
    return null;
  }

  return <Outlet />;
}
