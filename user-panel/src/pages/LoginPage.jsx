import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveAuthSession } from "../lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://promp-jump-54.onrender.com";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const tokenClientRef = useRef(null);

  const processGoogleAuth = async (payload) => {
    setError("");
    setGoogleLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Google sign-in failed");
      }
      saveAuthSession(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initGIS = async () => {
      try {
        let clientId = "";
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/google/client-id`);
          if (res.ok) {
            const data = await res.json();
            if (data.clientId) clientId = data.clientId;
          }
        } catch {
          // fetch failed
        }

        if (!clientId) {
          console.warn("Google Client ID is not configured on the backend.");
          return;
        }

        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (res) => {
              if (res?.credential) {
                processGoogleAuth({ credential: res.credential });
              }
            },
            auto_select: false,
          });

          // Render official Google button if element exists
          const gBtnContainer = document.getElementById("google-signin-btn-container");
          if (gBtnContainer) {
            gBtnContainer.innerHTML = "";
            window.google.accounts.id.renderButton(gBtnContainer, {
              theme: "outline",
              size: "large",
              type: "standard",
              shape: "rectangular",
              text: "continue_with",
              logo_alignment: "left",
              width: 384,
            });
          }
        }

        if (window.google?.accounts?.oauth2) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: "email profile openid",
            callback: (tokenRes) => {
              if (tokenRes?.access_token) {
                processGoogleAuth({ token: tokenRes.access_token });
              }
            },
          });
        }
      } catch (e) {
        console.warn("GIS initialization notice:", e);
      }
    };

    if (window.google?.accounts) {
      initGIS();
    } else {
      script.onload = initGIS;
    }
  }, []);

  const triggerGoogleLogin = () => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken();
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError("Google Sign-In is loading. Please try again in a few seconds.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      saveAuthSession(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PromptJump</h1>
          <p className="text-gray-600 mt-2">User Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-500 font-medium">Or continue with</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div id="google-signin-btn-container" className="w-full flex justify-center min-h-[44px]"></div>
          {googleLoading && (
            <p className="text-xs text-indigo-600 mt-2 font-medium">Signing in with Google, please wait...</p>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/forgot-password" className="text-indigo-600 hover:underline text-sm font-medium">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
