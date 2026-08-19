import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { isAuthenticated, redirectToLogin } from "../lib/auth";

export default function ProtectedRoute() {
  useEffect(() => {
    if (!isAuthenticated()) {
      redirectToLogin();
    }
  }, []);

  if (!isAuthenticated()) {
    return null;
  }

  return <Outlet />;
}
