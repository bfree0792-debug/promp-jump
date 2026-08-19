import { useEffect, useRef, useState } from "react";
import { Menu, Search, ChevronDown, LogOut, Mail, Shield, User } from "lucide-react";

export default function Topbar({ title, breadcrumb, onMenuClick, user, onLogout, onSearch }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleSubmit(event) {
    event.preventDefault();
    onSearch?.(query.trim());
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 -ml-1.5 rounded-md text-slate-600 hover:bg-slate-100"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{breadcrumb}</p>
      </div>

      <div className="flex-1" />

      <form
        onSubmit={handleSubmit}
        className="hidden md:flex items-center gap-2 w-72 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-400"
      >
        <Search className="w-4 h-4 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts..."
          className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 flex-1 min-w-0"
        />
        <button
          type="submit"
          className="text-[11px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-slate-700"
        >
          Go
        </button>
      </form>

      <div className="relative pl-2 sm:border-l sm:border-slate-200" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
            {user?.fullName?.charAt(0) || "A"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[13px] font-semibold text-slate-800 leading-tight">
              {user?.fullName || "Admin"}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">Super Admin</p>
          </div>
          <ChevronDown
            className={`hidden sm:block w-4 h-4 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-lg z-30 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-sm font-bold text-slate-900">Admin Information</p>
              <p className="text-xs text-slate-500 mt-0.5">Signed-in account details</p>
            </div>

            <div className="px-4 py-3 space-y-3">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400">Full name</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {user?.fullName || "Admin"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400">Email</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {user?.email || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400">Role</p>
                  <p className="text-sm font-semibold text-slate-800 capitalize">
                    {user?.role || "admin"} · Super Admin
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Status:{" "}
                <span className="font-semibold text-emerald-600 capitalize">
                  {user?.status || "active"}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 p-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
