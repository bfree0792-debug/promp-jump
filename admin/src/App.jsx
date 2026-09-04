import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import PromptManagement from "./pages/PromptManagement";
import UsersPage from "./pages/UsersPage";
import TrendingPage from "./pages/TrendingPage";
import CategoriesPage from "./pages/CategoriesPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import RevenuePage from "./pages/RevenuePage";
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/prompts" element={<PromptManagement />} />
              <Route path="/trending" element={<TrendingPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/revenue" element={<RevenuePage />} />
              <Route
                path="/settings"
                element={
                  <PlaceholderPage
                    title="Settings"
                    description="Manage platform-wide configuration and preferences."
                  />
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
