import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CreditCard } from "lucide-react";
import { api } from "../lib/api";
import { useSettings } from "../lib/settings";

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "—";
  const amount = Number(price);
  if (Number.isNaN(amount)) return "—";
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}

function priceForPeriod(plan, isYearly) {
  if (isYearly) {
    if (plan.yearlyPrice != null) return plan.yearlyPrice;
    return plan.monthlyPrice;
  }
  if (plan.monthlyPrice != null) return plan.monthlyPrice;
  return plan.yearlyPrice;
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { profile, subscribeToPlan, saving } = useSettings();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isYearly, setIsYearly] = useState(false);
  const [subscribingId, setSubscribingId] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api.getPlans();
        const list = (Array.isArray(data) ? data : [])
          .filter((p) => p.isActive !== false)
          .sort((a, b) => {
            const aPrice = a.monthlyPrice ?? a.yearlyPrice ?? a.price ?? 0;
            const bPrice = b.monthlyPrice ?? b.yearlyPrice ?? b.price ?? 0;
            return Number(aPrice) - Number(bPrice);
          });
        setPlans(list);

        const hasMonthly = list.some((p) => p.monthlyPrice != null);
        const hasYearly = list.some((p) => p.yearlyPrice != null);
        if (!hasMonthly && hasYearly) setIsYearly(true);
      } catch (err) {
        setError(err.message || "Could not load plans.");
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hasMonthly = plans.some((p) => p.monthlyPrice != null);
  const hasYearly = plans.some((p) => p.yearlyPrice != null);

  const visiblePlans = useMemo(() => {
    return plans.filter((plan) => {
      const price = priceForPeriod(plan, isYearly);
      return price !== null && price !== undefined;
    });
  }, [plans, isYearly]);

  const currentPlanName = (
    profile?.billing?.planName ||
    profile?.subscription ||
    "Free"
  ).toLowerCase();

  const handleSubscribe = async (plan) => {
    setError("");
    setMessage("");
    setSubscribingId(plan.id);

    const period = isYearly && plan.yearlyPrice != null ? "yearly" : "monthly";
    const selectedPrice = priceForPeriod(plan, period === "yearly");

    try {
      await subscribeToPlan({
        ...plan,
        price: selectedPrice,
        billingPeriod: period,
      });
      setMessage(`Subscribed to ${plan.name} (${period}). Opening billing...`);
      setTimeout(() => navigate("/billing"), 700);
    } catch (err) {
      setError(err.message || "Could not subscribe to this plan.");
    } finally {
      setSubscribingId("");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CreditCard size={20} className="text-indigo-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Subscription
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Prices come from admin monthly/yearly settings. Your current plan:{" "}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {profile?.billing?.planName || profile?.subscription || "Free"}
          </span>
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </div>
      )}

      {hasMonthly && hasYearly && (
        <div className="flex items-center justify-center gap-3">
          <span
            className={`text-sm font-medium ${
              !isYearly ? "text-slate-900 dark:text-white" : "text-slate-400"
            }`}
          >
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isYearly}
            onClick={() => setIsYearly((prev) => !prev)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              isYearly ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isYearly ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              isYearly ? "text-slate-900 dark:text-white" : "text-slate-400"
            }`}
          >
            Yearly
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading plans...</p>
      ) : visiblePlans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No subscription plans yet. In admin, create a plan and set monthly and/or yearly prices.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visiblePlans.map((plan) => {
            const selectedPrice = priceForPeriod(plan, isYearly);
            const period =
              isYearly && plan.yearlyPrice != null
                ? "yearly"
                : plan.monthlyPrice != null
                  ? "monthly"
                  : "yearly";
            const isCurrent =
              plan.name.toLowerCase() === currentPlanName &&
              (profile?.billing?.billingPeriod || "monthly") === period;
            const isPopular =
              plan.name.toLowerCase().includes("pro") ||
              plan.name.toLowerCase().includes("premium");
            const isBusy = saving && subscribingId === plan.id;

            return (
              <div
                key={`${plan.id}-${period}`}
                className={`relative bg-white dark:bg-slate-900 rounded-xl border p-5 flex flex-col shadow-sm ${
                  isPopular || isCurrent
                    ? "border-indigo-500 ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-semibold text-white uppercase tracking-wide">
                    Popular
                  </span>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                      {period}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(selectedPrice)}
                  </p>
                </div>

                {(plan.monthlyPrice != null || plan.yearlyPrice != null) && (
                  <div className="mt-3 flex gap-2 text-[11px] text-slate-500">
                    {plan.monthlyPrice != null && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        Monthly {formatPrice(plan.monthlyPrice)}
                      </span>
                    )}
                    {plan.yearlyPrice != null && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        Yearly {formatPrice(plan.yearlyPrice)}
                      </span>
                    )}
                  </div>
                )}

                <ul className="mt-4 space-y-2 flex-1">
                  {(plan.features || []).length === 0 ? (
                    <li className="text-sm text-slate-400">No features listed</li>
                  ) : (
                    plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="text-sm text-slate-600 dark:text-slate-300 flex gap-2"
                      >
                        <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))
                  )}
                </ul>

                <button
                  type="button"
                  disabled={isCurrent || isBusy || saving}
                  onClick={() => handleSubscribe(plan)}
                  className={`mt-5 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isCurrent
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
                  }`}
                >
                  {isCurrent ? "Current plan" : isBusy ? "Subscribing..." : "Get Started"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
