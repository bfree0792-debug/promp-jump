import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { LibraryProvider } from "./lib/library";
import { SettingsProvider } from "./lib/settings";
import UserLayout from "./layouts/UserLayout";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import BrowsePage from "./pages/BrowsePage";
import TrendingPage from "./pages/TrendingPage";
import HistoryPage from "./pages/HistoryPage";
import CategoriesPage from "./pages/CategoriesPage";
import SavedPage from "./pages/SavedPage";
import FavoritesPage from "./pages/FavoritesPage";
import SettingsPage from "./pages/SettingsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import BillingPage from "./pages/BillingPage";
import UsagePage from "./pages/UsagePage";
import SearchPage from "./pages/SearchPage";

export default function App() {
  return (
    <SettingsProvider>
      <LibraryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<UserLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route path="/browse" element={<BrowsePage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/saved" element={<SavedPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/usage" element={<UsagePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </LibraryProvider>
    </SettingsProvider>
  );
}
