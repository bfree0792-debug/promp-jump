import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FilterBar from "../components/FilterBar";
import PromptTable from "../components/PromptTable";
import { api, mediaUrl } from "../lib/api";

function matchesSearch(prompt, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    prompt.title,
    prompt.description,
    prompt.category,
    prompt.type,
    prompt.access,
    prompt.status,
    ...(Array.isArray(prompt.tags) ? prompt.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

const emptyForm = {
  title: "",
  description: "",
  category: "General",
  access: "Free",
  status: "Published",
};

export default function PromptManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prompts, setPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");

  const [showAdd, setShowAdd] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchPrompts() {
    try {
      setLoading(true);
      setError("");
      const [data, cats] = await Promise.all([api.getPrompts(), api.getCategories()]);
      setPrompts(Array.isArray(data) ? data : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      setError(e?.message || "Could not load prompts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setCategoryFilter(searchParams.get("category") || "all");
  }, [searchParams]);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || prompts.length === 0) return;

    const prompt = prompts.find((item) => (item.id || item._id) === editId);
    if (!prompt) return;

    openEdit(prompt);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("edit");
    setSearchParams(nextParams, { replace: true });
  }, [prompts, searchParams, setSearchParams]);

  const filteredPrompts = useMemo(
    () =>
      prompts.filter((prompt) => {
        if (!matchesSearch(prompt, search)) return false;
        if (categoryFilter && categoryFilter !== "all") {
          return (prompt.category || "General") === categoryFilter;
        }
        return true;
      }),
    [prompts, search, categoryFilter]
  );

  function syncParams(nextSearch, nextCategory) {
    const params = {};
    if (nextSearch.trim()) params.q = nextSearch.trim();
    if (nextCategory && nextCategory !== "all") params.category = nextCategory;
    setSearchParams(params);
  }

  function handleSearchChange(value) {
    setSearch(value);
    syncParams(value, categoryFilter);
  }

  function handleCategoryChange(value) {
    setCategoryFilter(value);
    syncParams(search, value);
  }

  function resetForm() {
    setForm(emptyForm);
    setMediaFile(null);
    setMediaPreview("");
    setEditingPrompt(null);
  }

  function openCreate() {
    resetForm();
    setShowAdd(true);
  }

  function openEdit(prompt) {
    setEditingPrompt(prompt);
    setForm({
      title: prompt.title || "",
      description: prompt.description || "",
      category: prompt.category || "General",
      access:
        prompt.access === "Premium" || prompt.access === "Pro"
          ? "Pro"
          : prompt.access || "Unassigned",
      status: prompt.status || "Published",
    });
    setMediaFile(null);
    setMediaPreview(mediaUrl(prompt.mediaUrl || prompt.thumbnail || ""));
    setShowAdd(true);
  }

  async function handleDelete(promptId) {
    if (!promptId) {
      setError("The prompt ID is missing, so it cannot be deleted.");
      return;
    }

    setError("");
    const previousPrompts = prompts;
    setPrompts((currentPrompts) =>
      currentPrompts.filter((currentPrompt) => currentPrompt.id !== promptId)
    );

    try {
      await api.deletePrompt(promptId);
    } catch (e) {
      setPrompts(previousPrompts);
      setError(e?.message || "Failed to delete prompt.");
    }
  }

  async function handleAction(action, prompt) {
    try {
      if (action === "edit") {
        openEdit(prompt);
        return;
      }

      if (action === "delete") {
        await handleDelete(prompt.id);
        return;
      }

      if (action === "trending") {
        const previousPrompts = prompts;
        setPrompts((currentPrompts) =>
          currentPrompts.map((p) =>
            p.id === prompt.id ? { ...p, isTrending: !p.isTrending } : p
          )
        );
        try {
          await api.setPromptTrending(prompt.id, !prompt.isTrending);
        } catch (e) {
          setPrompts(previousPrompts);
          window.alert(e?.message || "Action failed.");
        }
        return;
      }

      if (action === "archive") {
        const nextStatus = prompt.status === "Archived" ? "Published" : "Archived";
        const previousPrompts = prompts;
        setPrompts((currentPrompts) =>
          currentPrompts.map((p) =>
            p.id === prompt.id ? { ...p, status: nextStatus } : p
          )
        );
        try {
          await api.setPromptStatus(prompt.id, nextStatus);
        } catch (e) {
          setPrompts(previousPrompts);
          window.alert(e?.message || "Action failed.");
        }
        return;
      }

      if (action === "toggle") {
        const current = prompt.access === "Premium" ? "Pro" : prompt.access;
        const nextAccess = current === "Pro" ? "Free" : "Pro";
        const previousPrompts = prompts;
        setPrompts((currentPrompts) =>
          currentPrompts.map((p) =>
            p.id === prompt.id ? { ...p, access: nextAccess } : p
          )
        );
        try {
          await api.setPromptAccess(prompt.id, nextAccess);
        } catch (e) {
          setPrompts(previousPrompts);
          window.alert(e?.message || "Action failed.");
        }
      }
    } catch (e) {
      window.alert(e?.message || "Action failed.");
    }
  }

  async function handleSave() {
    if (!editingPrompt && !mediaFile) {
      window.alert("Please select an image/video file.");
      return;
    }

    setSaving(true);
    try {
      let optimisticPrompt = null;
      if (editingPrompt) {
        optimisticPrompt = { ...editingPrompt };
        if (mediaFile) {
          optimisticPrompt.title = form.title || mediaFile.name;
          optimisticPrompt.description = form.description;
          optimisticPrompt.category = form.category;
          optimisticPrompt.access = form.access;
          optimisticPrompt.status = form.status;
        } else {
          optimisticPrompt.title = form.title;
          optimisticPrompt.description = form.description;
          optimisticPrompt.category = form.category;
          optimisticPrompt.access = form.access;
          optimisticPrompt.status = form.status;
        }
      } else {
        optimisticPrompt = {
          id: `temp_${Date.now()}`,
          title: form.title || mediaFile?.name || "New prompt",
          description: form.description,
          category: form.category,
          access: form.access,
          status: form.status,
          type: mediaFile?.type?.startsWith("video/") ? "Video" : "Image",
          thumbnail: mediaPreview || "",
          mediaUrl: mediaPreview || "",
          views: 0,
          downloads: 0,
          likes: 0,
          copies: 0,
          tags: [],
          createdAt: new Date().toISOString(),
        };
      }

      setPrompts((currentPrompts) => {
        if (editingPrompt) {
          return currentPrompts.map((p) =>
            p.id === editingPrompt.id ? { ...p, ...optimisticPrompt } : p
          );
        }
        return [optimisticPrompt, ...currentPrompts];
      });

      if (editingPrompt) {
        if (mediaFile) {
          const formData = new FormData();
          formData.append("media", mediaFile);
          formData.append("title", form.title || mediaFile.name);
          formData.append("description", form.description);
          formData.append("category", form.category);
          formData.append("access", form.access);
          formData.append("status", form.status);
          await api.updatePrompt(editingPrompt.id, formData);
        } else {
          await api.updatePrompt(editingPrompt.id, {
            title: form.title,
            description: form.description,
            category: form.category,
            access: form.access,
            status: form.status,
          });
        }
      } else {
        const formData = new FormData();
        formData.append("media", mediaFile);
        formData.append("title", form.title || mediaFile.name);
        formData.append("description", form.description);
        formData.append("category", form.category);
        formData.append("access", form.access);
        formData.append("status", form.status);
        await api.createPrompt(formData);
      }

      setShowAdd(false);
      resetForm();
      await fetchPrompts();
    } catch (e) {
      await fetchPrompts();
      window.alert(e?.message || "Failed to save prompt.");
    } finally {
      setSaving(false);
    }
  }

  const isVideo =
    mediaFile?.type?.startsWith("video/") ||
    (!mediaFile &&
      (String(mediaPreview).includes(".mp4") ||
        String(mediaPreview).includes(".webm") ||
        String(mediaPreview).includes("video")));

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <FilterBar
        onAddNew={openCreate}
        search={search}
        onSearchChange={handleSearchChange}
        categories={categories}
        category={categoryFilter}
        onCategoryChange={handleCategoryChange}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 text-slate-500">
          Loading prompts...
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6 text-slate-500">
          {search.trim() ? `No prompts found for “${search.trim()}”.` : "No prompts yet."}
        </div>
      ) : (
        <PromptTable
          prompts={filteredPrompts.map((p) => ({
            ...p,
            tags: p.tags || [],
            views: String(p.views ?? 0),
            downloads: String(p.downloads ?? 0),
            likes: String(p.likes ?? 0),
            access: p.access === "Pro" ? "Premium" : p.access,
          }))}
          onAction={handleAction}
        />
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pt-8 pb-[30px]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowAdd(false);
              resetForm();
            }}
          />

          <div className="relative w-full max-w-3xl my-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-[calc(100vh-60px)] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingPrompt ? "Edit Prompt" : "Add New Prompt"}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {editingPrompt
                    ? "Update title, description, access, or media."
                    : "Upload an image or video and add a description."}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAdd(false);
                  resetForm();
                }}
                className="w-10 h-10 rounded-xl hover:bg-slate-50 text-slate-500 flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Cyberpunk City at Night"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="General">General</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Write a short description for this prompt..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Media {editingPrompt ? "(optional replace)" : "(Image / Video)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setMediaFile(f || null);
                      if (f) setMediaPreview(URL.createObjectURL(f));
                      else if (editingPrompt) {
                        setMediaPreview(
                          mediaUrl(editingPrompt.mediaUrl || editingPrompt.thumbnail || "")
                        );
                      } else {
                        setMediaPreview("");
                      }
                    }}
                    className="w-full text-sm text-slate-600"
                  />

                  {mediaPreview && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 p-3">
                      {isVideo ? (
                        <video src={mediaPreview} controls className="w-full max-h-72 rounded-lg" />
                      ) : (
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          className="w-full max-h-72 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Access Tier</label>
                  <select
                    value={form.access}
                    onChange={(e) => setForm((prev) => ({ ...prev, access: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                    <option value="Team">Team</option>
                    <option value="Unassigned">Unassigned (not shown to users)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingPrompt
                      ? "Save Changes"
                      : "Upload & Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
