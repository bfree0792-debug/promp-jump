import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  CreditCard,
  FileText,
  Sparkles,
  Zap,
} from "lucide-react";
import { api } from "../lib/api";
import { useSettings } from "../lib/settings";

const FREE_FEATURES = [
  "6 image description copies per day",
  "4 video description copies per day",
  "Save up to 6 image prompts",
  "Up to 20 favorites",
  "Unlimited history",
  "Access Free content only",
];

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

function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export default function BillingPage() {
  const { profile } = useSettings();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const subscription = profile?.subscription || "Free";
  const billing = profile?.billing || {};
  const isPaid =
    subscription !== "Free" &&
    billing.status === "active" &&
    Number(billing.planPrice || 0) > 0;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.getPlans();
        setPlans((Array.isArray(data) ? data : []).filter((p) => p.isActive !== false));
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const upgradePlans = useMemo(() => {
    return plans
      .filter((p) => Number(p.monthlyPrice ?? p.yearlyPrice ?? p.price ?? 0) > 0)
      .sort((a, b) => {
        const aPrice = a.monthlyPrice ?? a.yearlyPrice ?? a.price ?? 0;
        const bPrice = b.monthlyPrice ?? b.yearlyPrice ?? b.price ?? 0;
        return Number(aPrice) - Number(bPrice);
      })
      .slice(0, 3);
  }, [plans]);

  const invoices = useMemo(() => {
    const list = Array.isArray(billing.invoices) ? [...billing.invoices] : [];
    return list.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
  }, [billing.invoices]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CreditCard size={20} className="text-indigo-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Billing
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          View your invoices or manage your free plan and upgrades.
        </p>
      </div>

      {isPaid ? (
        <>
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Current bill
                </p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {billing.planName || subscription}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">
                  {billing.billingPeriod || "monthly"} billing · Status{" "}
                  <span className="text-emerald-600 font-medium">{billing.status}</span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatMoney(billing.planPrice)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
                  per {billing.billingPeriod === "lifetime" ? "lifetime" : billing.billingPeriod || "month"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Subscribed on</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {formatDate(billing.subscribedAt)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Next billing</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {billing.billingPeriod === "lifetime"
                    ? "No renewal"
                    : formatDate(billing.nextBillingDate)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Account</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                  {profile?.email || "—"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Link
                to="/subscription"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Change plan
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Billing history
              </h3>
            </div>

            {invoices.length === 0 ? (
              <p className="px-5 sm:px-6 py-8 text-sm text-slate-500">No invoices yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">Invoice</th>
                      <th className="px-5 py-3 font-medium">Plan</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.invoiceId}
                        className="border-t border-slate-100 dark:border-slate-800"
                      >
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                          {invoice.invoiceId}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300 capitalize">
                          {invoice.planName} · {invoice.billingPeriod}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                          {formatDate(invoice.issuedAt)}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                          {formatMoney(invoice.amount)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 capitalize">
                            {invoice.status || "paid"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <Zap size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Current plan
                </p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Free Plan
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  You have not taken a paid subscription yet. You are on the free plan with
                  limited access.
                </p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">$0</p>
            </div>

            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FREE_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                >
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Upgrade to unlock more
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Get premium prompts, higher limits, and priority features by choosing a
                  subscription plan.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Loading plans...</p>
            ) : upgradePlans.length === 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                  Subscription plans will appear here once created in admin.
                </p>
                <Link
                  to="/subscription"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                >
                  View subscription
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {upgradePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 p-4"
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {plan.name}
                    </p>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                      {plan.monthlyPrice != null && (
                        <span className="block">
                          {formatMoney(plan.monthlyPrice)}
                          <span className="text-xs font-medium text-slate-400 ml-1">/ monthly</span>
                        </span>
                      )}
                      {plan.yearlyPrice != null && (
                        <span className="block mt-1">
                          {formatMoney(plan.yearlyPrice)}
                          <span className="text-xs font-medium text-slate-400 ml-1">/ yearly</span>
                        </span>
                      )}
                      {plan.monthlyPrice == null && plan.yearlyPrice == null && (
                        <span>
                          {formatMoney(plan.price)}
                          <span className="text-xs font-medium text-slate-400 capitalize ml-1">
                            / {plan.billingPeriod}
                          </span>
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {(plan.features || [])[0] || "Premium access and more features"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/subscription"
              className="mt-5 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
            >
              Upgrade to a subscription plan
              <ArrowUpRight size={15} />
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
