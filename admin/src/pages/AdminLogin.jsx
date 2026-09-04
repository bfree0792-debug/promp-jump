import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Clock,
  Eye,
  EyeOff,
  Hexagon,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  KeyRound,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  clearAdminLockout,
  getAdminChallengeRequired,
  getAdminFailedAttempts,
  getAdminLockoutUntil,
  setAdminChallengeRequired,
  setAdminFailedAttempts,
  setAdminLockoutUntil,
} from "../lib/auth";

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 3 * 60 * 1000; // 3 minutes

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Lockout & Security challenge state
  const [lockedUntil, setLockedUntil] = useState(() => getAdminLockoutUntil());
  const [failedAttempts, setFailedAttemptsState] = useState(() =>
    getAdminFailedAttempts()
  );
  const [isChallengeRequired, setIsChallengeRequired] = useState(() =>
    getAdminChallengeRequired()
  );
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [challengeError, setChallengeError] = useState("");
  const [challengeSuccess, setChallengeSuccess] = useState("");

  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    const until = getAdminLockoutUntil();
    return until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0;
  });

  const isBlocked = Boolean(lockedUntil && secondsRemaining > 0);

  // Synchronize countdown timer
  useEffect(() => {
    if (!lockedUntil) {
      setSecondsRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        setLockedUntil(null);
        // After 3 minutes over, challenge remains required before login is shown
        setError("");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleVerifySecurityQuestion = (e) => {
    e.preventDefault();
    setChallengeError("");
    setChallengeSuccess("");

    const normalizedInput = securityAnswer
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

    if (normalizedInput === "naushad_raja_shaikh") {
      setChallengeSuccess("Security answer verified. Login unlocked!");
      setTimeout(() => {
        setAdminChallengeRequired(false);
        setIsChallengeRequired(false);
        clearAdminLockout();
        setFailedAttemptsState(0);
        setLockedUntil(null);
        setSecurityAnswer("");
        setChallengeSuccess("");
        setError("");
      }, 700);
    } else {
      setChallengeError(
        "Incorrect answer. Login option will not be shown until you provide the correct answer."
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isBlocked || isChallengeRequired) return;

    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      // Success: reset lockout and attempts
      clearAdminLockout();
      setFailedAttemptsState(0);
      setLockedUntil(null);
      setIsChallengeRequired(false);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const is429 = err.status === 429;
      const nextAttempts = failedAttempts + 1;

      if (is429 || nextAttempts >= MAX_ATTEMPTS) {
        const durationMs =
          err.retryAfterSeconds && err.retryAfterSeconds > 0
            ? err.retryAfterSeconds * 1000
            : LOCKOUT_DURATION_MS;
        const blockUntilTimestamp = Date.now() + durationMs;

        setAdminLockoutUntil(blockUntilTimestamp);
        setAdminFailedAttempts(MAX_ATTEMPTS);
        setAdminChallengeRequired(true);
        setIsChallengeRequired(true);
        setLockedUntil(blockUntilTimestamp);
        setFailedAttemptsState(MAX_ATTEMPTS);
        setSecondsRemaining(Math.ceil(durationMs / 1000));
        setError(
          err.message ||
            "Too many login attempts. Admin login is blocked for 3 minutes."
        );
      } else {
        setFailedAttemptsState(nextAttempts);
        setAdminFailedAttempts(nextAttempts);
        setError(err.message || "Invalid email or password.");
      }
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
              <Hexagon
                className="w-6 h-6 text-white"
                fill="white"
                fillOpacity={0.15}
                strokeWidth={2.5}
              />
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
            "The admin panel gives us full control over content, users, and
            revenue — everything we need in one place."
          </p>
          <p className="mt-4 text-sm font-semibold text-white">
            Platform Admin Team
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center">
              <Hexagon
                className="w-5 h-5 text-white"
                fill="white"
                fillOpacity={0.15}
                strokeWidth={2.5}
              />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">
                PromptJump Admin
              </p>
              <p className="text-xs text-slate-500">Sign in to continue</p>
            </div>
          </div>

          {isChallengeRequired && !isBlocked ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2 border border-amber-200">
                    <ShieldQuestion className="w-3.5 h-3.5 text-amber-600" />
                    Security Verification Required
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Unlock Admin Login</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your 3-minute lockout period has ended. Answer the security question to unlock the login screen.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                </div>
              </div>

              <form onSubmit={handleVerifySecurityQuestion} className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Security Question
                  </label>
                  <p className="text-sm font-semibold text-slate-800">
                    what is a full form of nrs?
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="securityAnswer"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Your Answer
                  </label>
                  <div className="relative">
                    <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="securityAnswer"
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="Enter full form of nrs..."
                      required
                      autoFocus
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {challengeError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 leading-relaxed">
                    {challengeError}
                  </div>
                )}

                {challengeSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {challengeSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  Verify & Unlock Login
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Admin Login</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Enter your admin credentials to access the dashboard.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
              </div>

              {/* Blocked State Banner */}
              {isBlocked && (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-rose-900">
                        Access Temporarily Blocked
                      </h3>
                      <p className="mt-1 text-xs text-rose-700 leading-relaxed">
                        For security reasons, admin login has been blocked for 3 minutes.
                      </p>

                      <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Time remaining: {formatTime(secondsRemaining)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
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
                      disabled={isBlocked || loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
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
                      disabled={isBlocked || loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={isBlocked || loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-40"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isBlocked || loading}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    disabled={isBlocked || loading}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && !isBlocked && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isBlocked || loading}
                  className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition flex items-center justify-center gap-2 ${
                    isBlocked
                      ? "bg-rose-600/80 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  }`}
                >
                  {isBlocked ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Blocked ({formatTime(secondsRemaining)})</span>
                    </>
                  ) : loading ? (
                    "Signing in..."
                  ) : (
                    "Sign in to Admin Panel"
                  )}
                </button>
              </form>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            PromptJump Admin Portal · Authorized access only
          </p>
        </div>
      </div>
    </div>
  );
}
