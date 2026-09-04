const { supabase } = require("../lib/supabase");

function normalizePlan(ret) {
  if (!ret) return null;
  const monthlyPrice =
    ret.monthly_price !== undefined
      ? ret.monthly_price === null ? null : Number(ret.monthly_price)
      : ret.monthlyPrice === null ? null : Number(ret.monthlyPrice);

  const yearlyPrice =
    ret.yearly_price !== undefined
      ? ret.yearly_price === null ? null : Number(ret.yearly_price)
      : ret.yearlyPrice === null ? null : Number(ret.yearlyPrice);

  const hasMonthly = monthlyPrice !== null && !Number.isNaN(monthlyPrice);
  const hasYearly = yearlyPrice !== null && !Number.isNaN(yearlyPrice);

  const features = Array.isArray(ret.features)
    ? ret.features
    : typeof ret.features === "string"
    ? JSON.parse(ret.features || "[]")
    : [];
  const limits = ret.limits && typeof ret.limits === "object"
    ? ret.limits
    : typeof ret.limits === "string"
      ? JSON.parse(ret.limits || "{}")
      : {};

  const rawPrice = ret.price !== undefined ? Number(ret.price) : 0;
  const price = hasMonthly ? monthlyPrice : hasYearly ? yearlyPrice : rawPrice;
  const billingPeriod =
    ret.billing_period || ret.billingPeriod || (hasMonthly && hasYearly ? "both" : hasYearly ? "yearly" : "monthly");

  return {
    id: ret.id ? String(ret.id) : "",
    name: ret.name,
    monthlyPrice: hasMonthly ? monthlyPrice : null,
    yearlyPrice: hasYearly ? yearlyPrice : null,
    price,
    billingPeriod,
    features,
    limits,
    isActive: ret.is_active !== undefined ? ret.is_active : ret.isActive !== false,
    createdAt: ret.created_at || ret.createdAt,
    updatedAt: ret.updated_at || ret.updatedAt,
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        monthlyPrice: this.monthlyPrice,
        yearlyPrice: this.yearlyPrice,
        price: this.price,
        billingPeriod: this.billingPeriod,
        features: this.features,
        limits: this.limits,
        isActive: this.isActive,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
    async save() {
      return await SubscriptionPlan.findByIdAndUpdate(this.id, {
        name: this.name,
        monthlyPrice: this.monthlyPrice,
        yearlyPrice: this.yearlyPrice,
        price: this.price,
        billingPeriod: this.billingPeriod,
        features: this.features,
        limits: this.limits,
        isActive: this.isActive,
      });
    },
  };
}

const SubscriptionPlan = {
  normalize: normalizePlan,

  find(filter = {}) {
    let query = supabase.from("subscription_plans").select("*");
    let sortColumn = "created_at";
    let ascending = true;

    const runner = {
      sort(sortOptions = {}) {
        if (sortOptions.createdAt === -1 || sortOptions.created_at === -1) {
          ascending = false;
        } else if (sortOptions.createdAt === 1 || sortOptions.created_at === 1) {
          ascending = true;
        }
        return runner;
      },
      limit(n) {
        this._limit = n;
        return runner;
      },
      async then(resolve, reject) {
        try {
          let finalQuery = query.order(sortColumn, { ascending });
          if (this._limit) finalQuery = finalQuery.limit(this._limit);
          const { data, error } = await finalQuery;
          if (error) throw error;
          resolve((data || []).map(normalizePlan));
        } catch (err) {
          if (reject) reject(err);
          else throw err;
        }
      },
    };

    return runner;
  },

  async findById(id) {
    if (!id) return null;
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? normalizePlan(data) : null;
  },

  async create(planData) {
    const payload = {
      name: String(planData.name).trim(),
      monthly_price: planData.monthlyPrice,
      yearly_price: planData.yearlyPrice,
      price: planData.price ?? 0,
      billing_period: planData.billingPeriod || "both",
      features: planData.features || [],
      limits: planData.limits || {},
      is_active: planData.isActive !== false,
    };
    const { data, error } = await supabase
      .from("subscription_plans")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return normalizePlan(data);
  },

  async findByIdAndUpdate(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = String(updates.name).trim();
    if (updates.monthlyPrice !== undefined) payload.monthly_price = updates.monthlyPrice;
    if (updates.yearlyPrice !== undefined) payload.yearly_price = updates.yearlyPrice;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.billingPeriod !== undefined) payload.billing_period = updates.billingPeriod;
    if (updates.features !== undefined) payload.features = updates.features;
    if (updates.limits !== undefined) payload.limits = updates.limits;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("subscription_plans")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? normalizePlan(data) : null;
  },

  async findByIdAndDelete(id) {
    const existing = await SubscriptionPlan.findById(id);
    if (!existing) return null;
    const { error } = await supabase
      .from("subscription_plans")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return existing;
  },

  async countDocuments() {
    const { count, error } = await supabase
      .from("subscription_plans")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
  },

  async insertMany(plans) {
    const payload = plans.map((p) => ({
      name: p.name,
      monthly_price: p.monthlyPrice,
      yearly_price: p.yearlyPrice,
      price: p.price ?? 0,
      billing_period: p.billingPeriod || "both",
      features: p.features || [],
      limits: p.limits || {},
      is_active: p.isActive !== false,
    }));
    const { data, error } = await supabase
      .from("subscription_plans")
      .insert(payload)
      .select();
    if (error) throw error;
    return (data || []).map(normalizePlan);
  },
};

module.exports = SubscriptionPlan;
