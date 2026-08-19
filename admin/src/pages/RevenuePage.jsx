import { useEffect, useState } from "react";
import { Wallet, CreditCard, Users, Receipt } from "lucide-react";
import { api } from "../lib/api";

function formatMoney(amount) {
  const value = Number(amount || 0);
  return `$${value.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RevenuePage() {
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [revenue, planData] = await Promise.all([api.getRevenue(), api.getPlans()]);
        setData(revenue);
        setPlans(Array.isArray(planData) ? planData : []);
      } catch (err) {
        setError(err.message || "Could not load revenue.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading revenue...</p>;
  }

  const byPlan = data?.byPlan || {};

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Wallet className="w-5 h-5 text-blue-600" />
        <div>
          <h2 className="text-[15px] font-bold text-slate-800">Revenue</h2>
          <p className="text-xs text-slate-500">
            Track subscription revenue and billing history from user invoices.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Wallet className="w-4 h-4" />
            Total Revenue
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatMoney(data?.totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Users className="w-4 h-4" />
            Paid Subscribers
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {data?.activePaidSubscribers ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Receipt className="w-4 h-4" />
            Invoices
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{data?.invoiceCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <CreditCard className="w-4 h-4" />
            Active Plans
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {plans.filter((p) => p.isActive !== false).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Subscribers by Plan</h3>
          {Object.keys(byPlan).length === 0 ? (
            <p className="text-sm text-slate-500">No paid subscriptions yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(byPlan).map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-slate-700 capitalize">{name}</span>
                  <span className="text-sm font-bold text-blue-600">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Plan Catalog Prices</h3>
          {plans.length === 0 ? (
            <p className="text-sm text-slate-500">No plans created yet.</p>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 gap-3"
                >
                  <span className="text-sm font-medium text-slate-700 capitalize">{plan.name}</span>
                  <span className="text-xs text-slate-500 text-right">
                    {plan.monthlyPrice != null && (
                      <span className="block">Monthly {formatMoney(plan.monthlyPrice)}</span>
                    )}
                    {plan.yearlyPrice != null && (
                      <span className="block">Yearly {formatMoney(plan.yearlyPrice)}</span>
                    )}
                    {plan.monthlyPrice == null && plan.yearlyPrice == null && (
                      <span>{formatMoney(plan.price)}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Billing History</h3>
        </div>
        {(data?.invoices || []).length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">
            No invoices yet. Revenue appears when users subscribe from the user panel.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={`${invoice.invoiceId}-${invoice.userEmail}`} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium text-slate-800">{invoice.invoiceId}</td>
                    <td className="px-5 py-3">
                      <p className="text-slate-800">{invoice.userName}</p>
                      <p className="text-xs text-slate-500">{invoice.userEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 capitalize">
                      {invoice.planName} · {invoice.billingPeriod}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(invoice.issuedAt)}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {formatMoney(invoice.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 capitalize">
                        {invoice.status}
                      </span>
                    </td>
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
