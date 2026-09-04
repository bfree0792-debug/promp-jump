const { supabase } = require("../lib/supabase");

function formatAnnouncement(a) {
  if (!a) return null;
  return {
    id: a.id,
    title: a.title,
    message: a.message,
    audience: a.audience || "all",
    status: a.status || "Published",
    createdAt: a.created_at || a.createdAt,
    updatedAt: a.updated_at || a.updatedAt,
    toJSON() {
      return {
        id: this.id,
        title: this.title,
        message: this.message,
        audience: this.audience,
        status: this.status,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
    async save() {
      return await Announcement.findByIdAndUpdate(this.id, {
        title: this.title,
        message: this.message,
        audience: this.audience,
        status: this.status,
      });
    },
  };
}

const Announcement = {
  find(filter = {}) {
    let query = supabase.from("announcements").select("*");
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.audience) query = query.eq("audience", filter.audience);

    let sortColumn = "created_at";
    let ascending = false;

    const runner = {
      sort(sortOptions = {}) {
        if (sortOptions.createdAt === 1 || sortOptions.created_at === 1) {
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
          resolve((data || []).map(formatAnnouncement));
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
      .from("announcements")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? formatAnnouncement(data) : null;
  },

  async create(annData) {
    const payload = {
      title: String(annData.title).trim(),
      message: String(annData.message).trim(),
      audience: annData.audience || "all",
      status: annData.status || "Published",
    };
    const { data, error } = await supabase
      .from("announcements")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return formatAnnouncement(data);
  },

  async findByIdAndUpdate(id, updates) {
    const payload = {};
    if (updates.title !== undefined) payload.title = String(updates.title).trim();
    if (updates.message !== undefined) payload.message = String(updates.message).trim();
    if (updates.audience !== undefined) payload.audience = updates.audience;
    if (updates.status !== undefined) payload.status = updates.status;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("announcements")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? formatAnnouncement(data) : null;
  },

  async findByIdAndDelete(id) {
    const existing = await Announcement.findById(id);
    if (!existing) return null;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) throw error;
    return existing;
  },
};

module.exports = Announcement;

