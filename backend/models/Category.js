const { supabase } = require("../lib/supabase");
const { toRelativeUploadUrl } = require("../utils/media");

function formatCategory(cat) {
  if (!cat) return null;
  const id = cat.id || cat._id || "";
  return {
    id,
    _id: id,
    name: cat.name,
    description: cat.description || "",
    iconUrl: toRelativeUploadUrl(cat.icon_url || cat.iconUrl || ""),
    createdAt: cat.created_at || cat.createdAt,
    updatedAt: cat.updated_at || cat.updatedAt,
    toJSON() {
      return {
        id: this.id,
        _id: this.id,
        name: this.name,
        description: this.description,
        iconUrl: this.iconUrl,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
  };
}

const Category = {
  find(filter = {}) {
    let query = supabase.from("categories").select("*");
    let sortColumn = "name";
    let ascending = true;

    const runner = {
      sort(sortOptions = {}) {
        if (sortOptions.name === -1) {
          ascending = false;
        } else if (sortOptions.createdAt === -1 || sortOptions.created_at === -1) {
          sortColumn = "created_at";
          ascending = false;
        } else if (sortOptions.createdAt === 1 || sortOptions.created_at === 1) {
          sortColumn = "created_at";
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
          resolve((data || []).map(formatCategory));
        } catch (err) {
          if (reject) reject(err);
          else throw err;
        }
      },
    };

    return runner;
  },

  async findOne(filter = {}) {
    let query = supabase.from("categories").select("*");
    if (filter.name) {
      query = query.ilike("name", String(filter.name).trim());
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ? formatCategory(data) : null;
  },

  async findById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    let query = supabase.from("categories").select("*");
    if (isUuid) {
      query = query.eq("id", cleanId);
    } else {
      query = query.ilike("name", cleanId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error("Category findById error:", error.message);
      return null;
    }
    return data ? formatCategory(data) : null;
  },

  async create({ name, description, iconUrl }) {
    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          name: String(name).trim(),
          description: description || "",
          icon_url: iconUrl || "",
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return formatCategory(data);
  },

  async findByIdAndDelete(id) {
    if (!id) return null;
    const existing = await Category.findById(id);
    if (!existing) return null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(existing.id).trim()
    );
    let deleteQuery = supabase.from("categories").delete();
    if (isUuid) {
      deleteQuery = deleteQuery.eq("id", existing.id);
    } else {
      deleteQuery = deleteQuery.eq("name", existing.name);
    }

    const { data, error } = await deleteQuery.select().maybeSingle();
    if (error) {
      console.error("Category delete error:", error.message);
      throw error;
    }
    return data ? formatCategory(data) : null;
  },

  async countDocuments() {
    const { count, error } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
  },

  async insertMany(categories) {
    const payload = categories.map((c) => ({
      name: c.name,
      description: c.description || "",
      icon_url: c.iconUrl || "",
    }));
    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select();
    if (error) throw error;
    return (data || []).map(formatCategory);
  },
};

module.exports = Category;
