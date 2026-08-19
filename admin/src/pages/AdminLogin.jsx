import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Hexagon, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-[44%] bg-sidebar text-white flex-col justify-between p-10 xl:p-14">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center">
              <Hexagon className="w-6 h-6 text-white" fill="white" fillOpacity={0.15} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">PromptJump</p>
              <p className="text-sm text-slate-400">Admin Panel</p>
            </div>
          </div>

          <div className="mt-16 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/20 px-3 py-1 text-xs font-medium text-blue-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure admin access
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight">
              Manage your platform with confidence
            </h1>
            <p className="mt-4 text-slate-400 text-[15px] leading-relaxed">
              Sign in to manage prompts, users, subscriptions, analytics, and all
              platform settings from one central dashboard.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            "The admin panel gives us full control over content, users, and revenue
            — everything we need in one place."
          </p>
          <p className="mt-4 text-sm font-semibold text-white">Platform Admin Team</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" fill="white" fillOpacity={0.15} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">PromptJump Admin</p>
              <p className="text-xs text-slate-500">Sign in to continue</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
            <h2 className="text-2xl font-bold text-slate-900">Admin Login</h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your admin credentials to access the dashboard.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@promptjump.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Remember me
                </label>
                <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign in to Admin Panel"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Authorized personnel only. All access is monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
