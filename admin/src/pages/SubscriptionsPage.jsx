import { useEffect, useState } from "react";
import { Plus, Trash2, CreditCard, Pencil, X, Save } from "lucide-react";
import { api } from "../lib/api";

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

const emptyForm = {
  name: "",
  monthlyPrice: "",
  yearlyPrice: "",
  features: "",
};

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateField(setter, key, value) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.monthlyPrice && !form.yearlyPrice) {
      window.alert("Enter at least a monthly or yearly price.");
      return;
    }

    setSaving(true);
    try {
      await api.createPlan({
        name: form.name,
        monthlyPrice: form.monthlyPrice === "" ? null : Number(form.monthlyPrice),
        yearlyPrice: form.yearlyPrice === "" ? null : Number(form.yearlyPrice),
        features: form.features,
      });
      setForm(emptyForm);
      await load();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(plan) {
    setEditingId(plan.id);
    setEditForm({
      name: plan.name || "",
      monthlyPrice:
        plan.monthlyPrice === null || plan.monthlyPrice === undefined
          ? ""
          : String(plan.monthlyPrice),
      yearlyPrice:
        plan.yearlyPrice === null || plan.yearlyPrice === undefined
          ? ""
          : String(plan.yearlyPrice),
      features: (plan.features || []).join("\n"),
    });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingId) return;
    if (!editForm.monthlyPrice && !editForm.yearlyPrice) {
      window.alert("Enter at least a monthly or yearly price.");
      return;
    }

    setSaving(true);
    try {
      await api.updatePlan(editingId, {
        name: editForm.name,
        monthlyPrice: editForm.monthlyPrice === "" ? null : Number(editForm.monthlyPrice),
        yearlyPrice: editForm.yearlyPrice === "" ? null : Number(editForm.yearlyPrice),
        features: editForm.features,
      });
      setEditingId(null);
      setEditForm(emptyForm);
      await load();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await api.deletePlan(id);
      if (editingId === id) {
        setEditingId(null);
        setEditForm(emptyForm);
      }
      await load();
    } catch (error) {
      window.alert(error.message);
    }
  }

  const inputClass =
    "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 w-full";

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl border border-slate-100 shadow-card p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-[15px] font-bold text-slate-800">Create Subscription Plan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set monthly and yearly prices manually. Both prices appear on the landing page toggle.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={form.name}
            onChange={(e) => updateField(setForm, "name", e.target.value)}
            placeholder="Plan name (e.g. Pro)"
            required
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.monthlyPrice}
            onChange={(e) => updateField(setForm, "monthlyPrice", e.target.value)}
            placeholder="Monthly price (e.g. 10)"
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.yearlyPrice}
            onChange={(e) => updateField(setForm, "yearlyPrice", e.target.value)}
            placeholder="Yearly price (e.g. 100)"
            className={inputClass}
          />
        </div>

        <textarea
          value={form.features}
          onChange={(e) => updateField(setForm, "features", e.target.value)}
          placeholder={"Plan features (one per line)\nUnlimited prompts\nPriority support"}
          rows={4}
          className={inputClass}
        />

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          {saving ? "Saving..." : "Create Plan"}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading plans...</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-slate-500">No plans yet. Create your first plan above.</p>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-slate-100 shadow-card p-5 flex flex-col"
            >
              {editingId === plan.id ? (
                <form onSubmit={handleUpdate} className="space-y-3">
                  <input
                    value={editForm.name}
                    onChange={(e) => updateField(setEditForm, "name", e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Plan name"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                        Monthly price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.monthlyPrice}
                        onChange={(e) =>
                          updateField(setEditForm, "monthlyPrice", e.target.value)
                        }
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                        Yearly price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.yearlyPrice}
                        onChange={(e) =>
                          updateField(setEditForm, "yearlyPrice", e.target.value)
                        }
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <textarea
                    value={editForm.features}
                    onChange={(e) => updateField(setEditForm, "features", e.target.value)}
                    rows={4}
                    className={inputClass}
                    placeholder="Features (one per line)"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditForm(emptyForm);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 capitalize">{plan.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">Manual pricing</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(plan)}
                      className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center"
                      title="Edit prices"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Monthly
                      </p>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        {formatMoney(plan.monthlyPrice)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Yearly
                      </p>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        {formatMoney(plan.yearlyPrice)}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2 flex-1">
                    {(plan.features || []).length === 0 ? (
                      <li className="text-sm text-slate-400">No features listed</li>
                    ) : (
                      plan.features.map((f) => (
                        <li key={f} className="text-sm text-slate-600 flex gap-2">
                          <span className="text-green-500">✓</span>
                          {f}
                        </li>
                      ))
                    )}
                  </ul>

                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="mt-5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Plan
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
