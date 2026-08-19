import { useState } from "react";
import { Outlet, useLocation, NavLink, useNavigate } from "react-router-dom";
import { X, Hexagon, LogOut } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { navItems } from "../data/navConfig";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const active = navItems.find((item) =>
    item.path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(item.path)
  );
  const title = active?.label ?? "Dashboard";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-sidebar text-slate-300 flex flex-col">
            <div className="flex items-center justify-between px-5 py-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center">
                  <Hexagon className="w-5 h-5 text-white" fill="white" fillOpacity={0.15} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-white font-bold text-[15px] leading-tight">PromptJump</p>
                  <p className="text-[11px] text-slate-400">Admin Panel</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-sidebar-hover hover:text-slate-100"
                    }`
                  }
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="px-3 pb-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-slate-400 hover:bg-sidebar-hover hover:text-slate-100"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title={title}
          breadcrumb={`Home > ${title}`}
          onMenuClick={() => setMobileOpen(true)}
          user={user}
          onLogout={handleLogout}
          onSearch={(q) => {
            if (q) navigate(`/prompts?q=${encodeURIComponent(q)}`);
            else navigate("/prompts");
          }}
        />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
