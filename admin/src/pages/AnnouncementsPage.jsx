import { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, Pencil, X, Save } from "lucide-react";
import { api } from "../lib/api";

const emptyForm = {
  title: "",
  message: "",
  audience: "all",
  status: "Published",
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAnnouncements();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load announcements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      message: item.message || "",
      audience: item.audience || "all",
      status: item.status || "Published",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.updateAnnouncement(editingId, form);
      } else {
        await api.createAnnouncement(form);
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err.message || "Could not save announcement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await api.deleteAnnouncement(id);
      if (editingId === id) cancelEdit();
      await load();
    } catch (err) {
      window.alert(err.message || "Could not delete announcement.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-blue-600" />
        <div>
          <h2 className="text-[15px] font-bold text-slate-800">Announcements</h2>
          <p className="text-xs text-slate-500">
            Publish platform-wide announcements and release notes.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">
            {editingId ? "Edit Announcement" : "Create Announcement"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
              Cancel edit
            </button>
          )}
        </div>

        <input
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Announcement title"
          required
          className={inputClass}
        />

        <textarea
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          placeholder="Write the announcement message..."
          required
          rows={4}
          className={inputClass}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={form.audience}
            onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
            className={inputClass}
          >
            <option value="all">Audience: All users</option>
            <option value="Free">Audience: Free</option>
            <option value="Pro">Audience: Pro</option>
            <option value="Team">Audience: Team</option>
          </select>

          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            className={inputClass}
          >
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {saving ? "Saving..." : editingId ? "Save Changes" : "Publish Announcement"}
        </button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading announcements...</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
            No announcements yet. Create your first one above.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-100 shadow-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        item.status === "Published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">
                      {item.audience === "all" ? "All users" : item.audience}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
