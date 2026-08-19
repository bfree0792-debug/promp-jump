import { useEffect, useState } from "react";
import { Plus, Trash2, FolderKanban, ImagePlus } from "lucide-react";
import { api, mediaUrl } from "../lib/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      window.alert(error.message);
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
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      if (iconFile) {
        formData.append("icon", iconFile);
      }

      await api.createCategory(formData);
      resetForm();
      await load();
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.deleteCategory(id);
      await load();
    } catch (error) {
      window.alert(error.message);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-blue-600" />
          <h2 className="text-[15px] font-bold text-slate-800">Create Category</h2>
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Category
        </button>
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
            {categories.map((c) => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between gap-3">
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
                <button
                  onClick={() => handleDelete(c.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
