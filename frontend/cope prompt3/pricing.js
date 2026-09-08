const API_BASE_URL = "https://promp-jump-54.onrender.com";
const PRICING_CACHE_KEY = "promptjumpPricingPlans";
const PRICING_CACHE_TTL_MS = 5 * 60 * 1000;

function readCachedPlans() {
  try {
    const cached = JSON.parse(localStorage.getItem(PRICING_CACHE_KEY) || "null");
    if (!cached || !Array.isArray(cached.plans) || Date.now() - cached.timestamp > PRICING_CACHE_TTL_MS) {
      return null;
    }
    return cached.plans;
  } catch {
    return null;
  }
}

function writeCachedPlans(plans) {
  try {
    localStorage.setItem(PRICING_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      plans,
    }));
  } catch {
    // Caching is optional; rendering must still work when storage is unavailable.
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPrice(price) {
  if (price === null || price === undefined || price === "") return "—";
  const amount = Number(price);
  if (Number.isNaN(amount)) return "—";
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}

function renderFeatures(features) {
  if (!features || !features.length) {
    return `<p class="text-blk card-points">No features listed</p>`;
  }
  return features
    .map((feature) => `<p class="text-blk card-points">${escapeHtml(feature)}</p>`)
    .join("");
}

function priceForPeriod(plan, isYearly) {
  if (isYearly) {
    if (plan.yearlyPrice !== null && plan.yearlyPrice !== undefined) return plan.yearlyPrice;
    return plan.monthlyPrice;
  }
  if (plan.monthlyPrice !== null && plan.monthlyPrice !== undefined) return plan.monthlyPrice;
  return plan.yearlyPrice;
}

function periodLabel(plan, isYearly) {
  if (isYearly && plan.yearlyPrice != null) return "yearly";
  if (!isYearly && plan.monthlyPrice != null) return "monthly";
  if (plan.yearlyPrice != null) return "yearly";
  return "monthly";
}

function buildPlanCard(plan, index, isYearly) {
  const selectedClass =
    index === 1 ||
    String(plan.name).toLowerCase().includes("pro") ||
    String(plan.name).toLowerCase().includes("premium")
      ? " card-selected"
      : "";
  const name = escapeHtml(plan.name);
  const price = formatPrice(priceForPeriod(plan, isYearly));
  const period = periodLabel(plan, isYearly);

  return `
    <div class="responsive-cell-block wk-desk-4 wk-ipadp-4 wk-tab-6 wk-mobile-12">
      <div class="card${selectedClass}" data-plan-id="${escapeHtml(plan.id)}">
        <p class="text-blk plan-name">${name}</p>
        <h1 class="plan-price">${price}</h1>
        <p class="text-blk plan-period" style="margin-top:-8px;margin-bottom:12px;text-transform:capitalize;opacity:0.7;">
          ${period}
        </p>
        <div class="card-description">
          ${renderFeatures(plan.features)}
        </div>
        <span class="buy-button">
          <a href="signup.html"><button class="btns" type="button">Get Started</button></a>
        </span>
      </div>
    </div>
  `;
}

function bindCardHover(root) {
  root.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      root.querySelectorAll(".card").forEach((c) => c.classList.remove("card-selected"));
      card.classList.add("card-selected");
    });
  });
}

function bindPeriodToggle(plans, container) {
  const toggle = document.querySelector(".pricing_1 input[type='checkbox']");
  const switchBox = document.querySelector(".pricing_1 .swiping-box");

  const hasMonthly = plans.some((p) => p.monthlyPrice !== null && p.monthlyPrice !== undefined);
  const hasYearly = plans.some((p) => p.yearlyPrice !== null && p.yearlyPrice !== undefined);

  const render = (isYearly) => {
    // Prefer plans that have a price for the selected period; still show others with fallback
    const visible = plans.filter((plan) => {
      if (isYearly) return plan.yearlyPrice != null || plan.monthlyPrice != null;
      return plan.monthlyPrice != null || plan.yearlyPrice != null;
    });

    container.innerHTML = visible
      .map((plan, index) => buildPlanCard(plan, index, isYearly))
      .join("");
    bindCardHover(container);
  };

  if (!hasMonthly || !hasYearly) {
    if (switchBox) switchBox.style.display = hasMonthly || hasYearly ? "" : "none";
    if (toggle) toggle.checked = !hasMonthly && hasYearly;
    render(!hasMonthly && hasYearly);
    if (toggle && hasMonthly && hasYearly) {
      // still bind if somehow both appear later
    } else if (toggle && !(hasMonthly && hasYearly)) {
      toggle.disabled = true;
    }
    if (!(hasMonthly && hasYearly)) return;
  }

  if (switchBox) switchBox.style.display = "";
  if (toggle) toggle.disabled = false;

  if (!toggle) {
    render(false);
    return;
  }

  render(toggle.checked);
  toggle.onchange = () => render(toggle.checked);
}

function renderPricingPlans(plans, container, status) {
  const activePlans = (Array.isArray(plans) ? plans : [])
    .filter((p) => p.isActive !== false)
    .sort((a, b) => {
      const aPrice = a.monthlyPrice ?? a.yearlyPrice ?? a.price ?? 0;
      const bPrice = b.monthlyPrice ?? b.yearlyPrice ?? b.price ?? 0;
      return Number(aPrice) - Number(bPrice);
    });

  if (!activePlans.length) {
    container.innerHTML = "";
    if (status) {
      status.textContent = "No subscription plans yet. Check back soon.";
      status.style.display = "block";
    }
    return;
  }

  if (status) status.style.display = "none";
  bindPeriodToggle(activePlans, container);
}

async function loadPricingPlans() {
  const container = document.getElementById("pricingCards");
  const status = document.getElementById("pricingStatus");
  if (!container) return;

  const cachedPlans = readCachedPlans();
  if (cachedPlans) {
    renderPricingPlans(cachedPlans, container, status);
  }

  if (status && !cachedPlans) {
    status.style.display = "block";
    status.textContent = "Loading plans...";
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions`);
    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(data.message || "Could not load plans.");
    }

    const plans = Array.isArray(data) ? data : [];
    writeCachedPlans(plans);
    renderPricingPlans(plans, container, status);
  } catch (error) {
    if (!cachedPlans) container.innerHTML = "";
    if (status) {
      if (!cachedPlans) {
        status.textContent =
          error.message || "Could not load subscription plans. Is the backend running?";
        status.style.display = "block";
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", loadPricingPlans);
