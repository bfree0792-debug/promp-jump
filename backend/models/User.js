const crypto = require("crypto");
const { supabase } = require("../lib/supabase");

function parseJSON(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

class UserModel {
  constructor(data = {}) {
    this._id = data.id || data._id || null;
    this.id = this._id ? String(this._id) : null;
    this.fullName = data.fullName || data.full_name || "";
    this.email = (data.email || "").toLowerCase().trim();
    this.username = data.username || "";
    this.passwordHash = data.passwordHash || data.password_hash || "";
    this.passwordSalt = data.passwordSalt || data.password_salt || "";
    this.role = data.role || "user";
    this.status = data.status || "active";
    this.subscription = data.subscription || "Free";
    this.avatarUrl = data.avatarUrl || data.avatar_url || "";
    this.preferences = parseJSON(data.preferences || data.preference, {
      showTrendingOnDashboard: true,
      enablePromptSuggestions: true,
    });
    this.emailNotifications = parseJSON(data.emailNotifications || data.email_notifications, {
      productUpdates: true,
      weeklyNewsletter: false,
      promptOffers: true,
    });
    this.appearance = parseJSON(data.appearance, {
      theme: "light",
    });
    this.billing = parseJSON(data.billing, {
      planId: "",
      planName: "Free",
      planPrice: 0,
      billingPeriod: "none",
      status: "free",
      subscribedAt: null,
      nextBillingDate: null,
      invoices: [],
    });
    this.dailyUsage = parseJSON(data.dailyUsage || data.daily_usage, {
      date: "",
      imageCopies: 0,
      videoCopies: 0,
    });
    this.savedPrompts = (data.savedPrompts || []).map((id) => String(id));
    this.likedPrompts = (data.likedPrompts || []).map((id) => String(id));
    this.resetToken = data.resetToken || data.reset_token || null;
    this.resetTokenExpiry = data.resetTokenExpiry || data.reset_token_expiry || null;
    this.adminSessionToken = data.adminSessionToken || data.admin_session_token || null;
    this.adminSessionExpiresAt = data.adminSessionExpiresAt || data.admin_session_expires_at || null;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
  }

  setPassword(password) {
    this.passwordSalt = crypto.randomBytes(16).toString("hex");
    this.passwordHash = crypto
      .pbkdf2Sync(password, this.passwordSalt, 100000, 64, "sha512")
      .toString("hex");
  }

  isValidPassword(password) {
    if (!password || typeof password !== "string") return false;
    if (!this.passwordHash || !this.passwordSalt) return false;
    try {
      const hash = crypto
        .pbkdf2Sync(password, this.passwordSalt, 100000, 64, "sha512")
        .toString("hex");
      return crypto.timingSafeEqual(
        Buffer.from(this.passwordHash, "hex"),
        Buffer.from(hash, "hex")
      );
    } catch {
      return false;
    }
  }

  async save() {
    const payload = {
      full_name: this.fullName,
      email: this.email,
      username: this.username || null,
      password_hash: this.passwordHash,
      password_salt: this.passwordSalt,
      role: this.role,
      status: this.status,
      subscription: this.subscription,
      avatar_url: this.avatarUrl || "",
      preferences: this.preferences,
      email_notifications: this.emailNotifications,
      appearance: this.appearance,
      billing: this.billing,
      daily_usage: this.dailyUsage,
      reset_token: this.resetToken,
      reset_token_expiry: this.resetTokenExpiry,
      admin_session_token: this.adminSessionToken,
      admin_session_expires_at: this.adminSessionExpiresAt,
      updated_at: new Date().toISOString(),
    };

    if (this.id) {
      // Update existing user
      const { data, error } = await supabase
        .from("users")
        .update(payload)
        .eq("id", this.id)
        .select()
        .single();
      if (error) throw error;

      // Sync saved prompts in join table
      await supabase.from("user_saved_prompts").delete().eq("user_id", this.id);
      if (this.savedPrompts.length > 0) {
        const rows = this.savedPrompts.map((promptId) => ({
          user_id: this.id,
          prompt_id: promptId,
        }));
        await supabase.from("user_saved_prompts").insert(rows);
      }

      // Sync liked prompts in join table
      await supabase.from("user_liked_prompts").delete().eq("user_id", this.id);
      if (this.likedPrompts.length > 0) {
        const rows = this.likedPrompts.map((promptId) => ({
          user_id: this.id,
          prompt_id: promptId,
        }));
        await supabase.from("user_liked_prompts").insert(rows);
      }

      return this;
    } else {
      // Insert new user
      const { data, error } = await supabase
        .from("users")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      this._id = data.id;
      this.id = String(data.id);
      return this;
    }
  }

  toSafeJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      username: this.username || "",
      avatarUrl: this.avatarUrl || "",
      role: this.role,
      status: this.status,
      subscription: this.subscription,
      savedPrompts: (this.savedPrompts || []).map(String),
      likedPrompts: (this.likedPrompts || []).map(String),
      preferences: {
        showTrendingOnDashboard: this.preferences?.showTrendingOnDashboard ?? true,
        enablePromptSuggestions: this.preferences?.enablePromptSuggestions ?? true,
      },
      emailNotifications: {
        productUpdates: this.emailNotifications?.productUpdates ?? true,
        weeklyNewsletter: this.emailNotifications?.weeklyNewsletter ?? false,
        promptOffers: this.emailNotifications?.promptOffers ?? true,
      },
      appearance: {
        theme: this.appearance?.theme || "light",
      },
      billing: {
        planId: this.billing?.planId || "",
        planName: this.billing?.planName || "Free",
        planPrice: this.billing?.planPrice ?? 0,
        billingPeriod: this.billing?.billingPeriod || "none",
        status: this.billing?.status || "free",
        subscribedAt: this.billing?.subscribedAt || null,
        nextBillingDate: this.billing?.nextBillingDate || null,
        invoices: (this.billing?.invoices || []).map((invoice) => ({
          invoiceId: invoice.invoiceId,
          planName: invoice.planName,
          amount: invoice.amount,
          billingPeriod: invoice.billingPeriod,
          status: invoice.status || "paid",
          issuedAt: invoice.issuedAt,
        })),
      },
    };
  }
}

UserModel.dummyPasswordVerify = function () {
  try {
    const dummySalt = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
    const dummyHash =
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b8550123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const hash = crypto
      .pbkdf2Sync("dummy_password_timing_pad", dummySalt, 100000, 64, "sha512")
      .toString("hex");
    crypto.timingSafeEqual(
      Buffer.from(dummyHash, "hex"),
      Buffer.from(hash, "hex")
    );
  } catch {
    // ignore
  }
  return false;
};

async function populateUserRelations(user) {
  if (!user || !user.id) return user;
  const [{ data: saved }, { data: liked }] = await Promise.all([
    supabase.from("user_saved_prompts").select("prompt_id").eq("user_id", user.id),
    supabase.from("user_liked_prompts").select("prompt_id").eq("user_id", user.id),
  ]);
  user.savedPrompts = (saved || []).map((r) => String(r.prompt_id));
  user.likedPrompts = (liked || []).map((r) => String(r.prompt_id));
  return user;
}

const User = function (data) {
  return new UserModel(data);
};

User.findById = async function (id) {
  if (!id) return null;
  const cleanId = String(id).trim();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", cleanId)
    .maybeSingle();
  if (error) {
    console.error("User.findById error:", error.message);
    return null;
  }
  if (!data) return null;
  const user = new UserModel(data);
  return await populateUserRelations(user);
};

User.findOne = async function (filter = {}) {
  let query = supabase.from("users").select("*");

  if (filter.email) {
    query = query.eq("email", String(filter.email).toLowerCase().trim());
  }
  if (filter.username) {
    query = query.eq("username", String(filter.username).trim());
  }
  if (filter.resetToken) {
    query = query.eq("reset_token", String(filter.resetToken).trim());
  }
  if (filter.resetTokenExpiry && filter.resetTokenExpiry.$gt) {
    query = query.gt("reset_token_expiry", new Date().toISOString());
  }
  if (filter.adminSessionToken) {
    query = query.eq("admin_session_token", String(filter.adminSessionToken).trim());
  }
  if (filter._id && filter._id.$ne) {
    query = query.neq("id", String(filter._id.$ne).trim());
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("User.findOne error:", error.message);
    return null;
  }
  if (!data) return null;
  const user = new UserModel(data);
  return await populateUserRelations(user);
};

User.findByIdAndUpdate = async function (id, updates = {}) {
  const user = await User.findById(id);
  if (!user) return null;

  if (updates.fullName !== undefined) user.fullName = String(updates.fullName).trim();
  if (updates.username !== undefined) user.username = String(updates.username).trim();
  if (updates.status !== undefined) user.status = updates.status;
  if (updates.subscription !== undefined) user.subscription = updates.subscription;
  if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
  if (updates.preferences !== undefined) user.preferences = updates.preferences;
  if (updates.emailNotifications !== undefined) user.emailNotifications = updates.emailNotifications;
  if (updates.appearance !== undefined) user.appearance = updates.appearance;
  if (updates.billing !== undefined) user.billing = updates.billing;
  if (updates.dailyUsage !== undefined) user.dailyUsage = updates.dailyUsage;
  if (updates.savedPrompts !== undefined) user.savedPrompts = updates.savedPrompts;
  if (updates.likedPrompts !== undefined) user.likedPrompts = updates.likedPrompts;
  if (updates.resetToken !== undefined) user.resetToken = updates.resetToken;
  if (updates.resetTokenExpiry !== undefined) user.resetTokenExpiry = updates.resetTokenExpiry;
  if (updates.adminSessionToken !== undefined) user.adminSessionToken = updates.adminSessionToken;
  if (updates.adminSessionExpiresAt !== undefined) user.adminSessionExpiresAt = updates.adminSessionExpiresAt;

  await user.save();
  return user;
};

User.find = function (filter = {}) {
  let query = supabase.from("users").select("*");
  if (filter.role) query = query.eq("role", filter.role);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.subscription) query = query.eq("subscription", filter.subscription);

  let sortColumn = "created_at";
  let ascending = false;

  const runner = {
    sort(sortOptions = {}) {
      if (sortOptions.createdAt === 1 || sortOptions.created_at === 1) {
        sortColumn = "created_at";
        ascending = true;
      } else if (sortOptions.fullName === 1 || sortOptions.full_name === 1) {
        sortColumn = "full_name";
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
        const users = (data || []).map((row) => new UserModel(row));
        resolve(users);
      } catch (err) {
        if (reject) reject(err);
        else throw err;
      }
    },
  };

  return runner;
};

User.countDocuments = async function (filter = {}) {
  let query = supabase.from("users").select("*", { count: "exact", head: true });
  if (filter.role) query = query.eq("role", filter.role);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.subscription) query = query.eq("subscription", filter.subscription);

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
};

module.exports = User;
