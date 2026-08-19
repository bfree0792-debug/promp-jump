import { NavLink, useNavigate } from "react-router-dom";
import { Hexagon, LogOut } from "lucide-react";
import { navItems } from "../data/navConfig";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-sidebar text-slate-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center">
          <Hexagon className="w-5 h-5 text-white" fill="white" fillOpacity={0.15} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white font-bold text-[15px] leading-tight">PromptJump</p>
          <p className="text-[11px] text-slate-400">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/dashboard"}
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

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-slate-400 hover:bg-sidebar-hover hover:text-slate-100 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
