import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, Crown, Copy } from "lucide-react";
import { api, mediaUrl } from "../lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([api.getUsers(), api.getUserStats()]);
      setUsers(Array.isArray(list) ? list : []);
      setStats(s);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <UserCheck className="w-4 h-4 text-green-600" /> Active Users
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.active ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <UserX className="w-4 h-4 text-red-500" /> Inactive Users
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.inactive ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Users className="w-4 h-4 text-blue-600" /> Free Subs
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.subscriptions?.Free ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Crown className="w-4 h-4 text-orange-500" /> Pro Subs
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.subscriptions?.Pro ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-800">Most Copied Prompts / Descriptions</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {(stats?.mostCopied || []).length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No copy data yet.</p>
          ) : (
            stats.mostCopied.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                <img
                  src={mediaUrl(p.thumbnail || p.mediaUrl)}
                  alt={p.title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                  <p className="text-xs text-slate-500 truncate">{p.description || "No description"}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
                  <Copy className="w-3.5 h-3.5" />
                  {p.copies ?? 0}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-800">All Users</h2>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading...</p>
        ) : users.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Subscription</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-800">{u.fullName}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          u.status === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.status || "active"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">{u.subscription || "Free"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
