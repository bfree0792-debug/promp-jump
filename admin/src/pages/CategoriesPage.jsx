import { useEffect, useState } from "react";
import { Plus, Trash2, FolderKanban, ImagePlus, Pencil, X } from "lucide-react";
import { api, mediaUrl } from "../lib/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatusMessage({ type: "error", text: error.message || "Failed to load categories." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setName("");
    setDescription("");
    setIconFile(null);
    setIconPreview("");
    setEditingCategory(null);
  }

  function startEditing(category) {
    setEditingCategory(category);
    setName(category.name || "");
    setDescription(category.description || "");
    setIconFile(null);
    setIconPreview(category.iconUrl ? mediaUrl(category.iconUrl) : "");
    setStatusMessage(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    if (iconFile) {
      formData.append("icon", iconFile);
    }

    const optimisticCategory = {
      id: `temp_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      iconUrl: iconPreview || "",
    };

    setSaving(true);

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id || editingCategory._id, formData);
        setStatusMessage({ type: "success", text: "Category updated successfully." });
      } else {
        setCategories((current) => [optimisticCategory, ...current]);
        await api.createCategory(formData);
        setStatusMessage({ type: "success", text: "Category created successfully." });
      }
      resetForm();
      await load();
    } catch (error) {
      if (!editingCategory) {
        setCategories((current) => current.filter((c) => c.id !== optimisticCategory.id));
      }
      setStatusMessage({ type: "error", text: error.message || "Failed to create category." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    const id = typeof category === "object" ? (category.id || category._id) : category;
    const catName = typeof category === "object" ? category.name : "this category";

    if (!window.confirm(`Delete category "${catName}"?`)) return;

    if (!id) {
      setStatusMessage({ type: "error", text: "Category ID is missing." });
      return;
    }

    setDeletingId(id);
    setStatusMessage(null);

    const previousCategories = categories;
    setCategories((current) =>
      current.filter((c) => (c.id || c._id) !== id)
    );

    try {
      await api.deleteCategory(id);
      setStatusMessage({ type: "success", text: `Category "${catName}" deleted successfully.` });
    } catch (error) {
      setCategories(previousCategories);
      console.error("Delete category error:", error);
      setStatusMessage({ type: "error", text: error.message || "Could not delete category." });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {statusMessage && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium border ${
            statusMessage.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-blue-600" />
          <h2 className="text-[15px] font-bold text-slate-800">
            {editingCategory ? "Edit Category" : "Create Category"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Digital Art"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Icon upload</label>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {iconPreview ? (
                    <img src={iconPreview} alt="Icon preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setIconFile(file);
                      setIconPreview(file ? URL.createObjectURL(file) : "");
                    }}
                    className="w-full text-sm text-slate-600"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Upload a square icon image (PNG, JPG, SVG).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          {editingCategory ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {saving ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
        </button>
        {editingCategory && (
          <button
            type="button"
            onClick={resetForm}
            className="ml-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </form>

      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-800">All Categories</h2>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No categories yet.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {categories.map((c) => {
              const catId = c.id || c._id;
              const isDeleting = deletingId === catId;

              return (
                <div key={catId || c.name} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {c.iconUrl ? (
                        <img src={mediaUrl(c.iconUrl)} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <FolderKanban className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {c.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditing(c)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-50"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(c)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                        isDeleting
                          ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                          : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
