const { supabase } = require("../lib/supabase");
const { toRelativeUploadUrl } = require("../utils/media");

function formatPrompt(p) {
  if (!p) return null;
  const prompt = {
    _id: p.id,
    id: p.id,
    title: p.title,
    description: p.description || "",
    type: p.type || "Image",
    mediaUrl: toRelativeUploadUrl(p.media_url || p.mediaUrl || ""),
    thumbnail: toRelativeUploadUrl(p.thumbnail || p.thumbnail_url || p.media_url || p.mediaUrl || ""),
    category: p.category || "General",
    tags: Array.isArray(p.tags) ? p.tags : [],
    access: p.access || "Free",
    status: p.status || "Published",
    views: Number(p.views || 0),
    downloads: Number(p.downloads || 0),
    likes: Number(p.likes || 0),
    copies: Number(p.copies || 0),
    isTrending: Boolean(p.is_trending ?? p.isTrending),
    createdAt: p.created_at || p.createdAt,
    updatedAt: p.updated_at || p.updatedAt,
    toJSON() {
      return {
        id: this.id,
        title: this.title,
        description: this.description,
        type: this.type,
        mediaUrl: this.mediaUrl,
        thumbnail: this.thumbnail,
        category: this.category,
        tags: this.tags,
        access: this.access,
        status: this.status,
        views: this.views,
        downloads: this.downloads,
        likes: this.likes,
        copies: this.copies,
        isTrending: this.isTrending,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
    async save() {
      return await Prompt.findByIdAndUpdate(this.id, {
        title: this.title,
        description: this.description,
        type: this.type,
        mediaUrl: this.mediaUrl,
        thumbnail: this.thumbnail,
        category: this.category,
        tags: this.tags,
        access: this.access,
        status: this.status,
        views: this.views,
        downloads: this.downloads,
        likes: this.likes,
        copies: this.copies,
        isTrending: this.isTrending,
      });
    },
  };
  return prompt;
}

const Prompt = {
  find(filter = {}) {
    let query = supabase.from("prompts").select("*");

    if (filter.access) {
      if (typeof filter.access === "object" && filter.access.$ne) {
        query = query.neq("access", filter.access.$ne);
      } else {
        query = query.eq("access", filter.access);
      }
    }
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.isTrending !== undefined) query = query.eq("is_trending", Boolean(filter.isTrending));
    if (filter._id && filter._id.$in) {
      const ids = (filter._id.$in || []).filter(Boolean).map(String);
      if (ids.length === 0) {
        return {
          sort() {
            return {
              limit() {
                return Promise.resolve([]);
              },
              then(resolve) {
                resolve([]);
              },
            };
          },
          limit() {
            return Promise.resolve([]);
          },
          then(resolve) {
            resolve([]);
          },
        };
      }
      query = query.in("id", ids);
    }

    const runner = {
      sort(sortOptions = {}) {
        let sortedQuery = query;
        if (sortOptions.createdAt === -1) {
          sortedQuery = sortedQuery.order("created_at", { ascending: false });
        } else if (sortOptions.copies === -1) {
          sortedQuery = sortedQuery.order("copies", { ascending: false });
        } else if (sortOptions.isTrending === -1) {
          sortedQuery = sortedQuery
            .order("is_trending", { ascending: false })
            .order("likes", { ascending: false })
            .order("copies", { ascending: false });
        }

        return {
          async limit(n) {
            const { data, error } = await sortedQuery.limit(n);
            if (error) throw error;
            return (data || []).map(formatPrompt);
          },
          async then(resolve, reject) {
            try {
              const { data, error } = await sortedQuery;
              if (error) throw error;
              resolve((data || []).map(formatPrompt));
            } catch (err) {
              if (reject) reject(err);
              else throw err;
            }
          },
        };
      },
      async limit(n) {
        const { data, error } = await query.limit(n);
        if (error) throw error;
        return (data || []).map(formatPrompt);
      },
      async then(resolve, reject) {
        try {
          const { data, error } = await query;
          if (error) throw error;
          resolve((data || []).map(formatPrompt));
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
      .from("prompts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? formatPrompt(data) : null;
  },

  async create(promptData) {
    const payload = {
      title: promptData.title,
      description: promptData.description || "",
      type: promptData.type || "Image",
      media_url: promptData.mediaUrl,
      thumbnail: promptData.thumbnail || promptData.mediaUrl,
      category: promptData.category || "General",
      tags: promptData.tags || [],
      access: promptData.access || "Free",
      status: promptData.status || "Published",
      views: promptData.views || 0,
      downloads: promptData.downloads || 0,
      likes: promptData.likes || 0,
      copies: promptData.copies || 0,
      is_trending: Boolean(promptData.isTrending),
    };
    const { data, error } = await supabase
      .from("prompts")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return formatPrompt(data);
  },

  async findByIdAndUpdate(id, updates = {}) {
    const payload = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.mediaUrl !== undefined) payload.media_url = updates.mediaUrl;
    if (updates.thumbnail !== undefined) payload.thumbnail = updates.thumbnail;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.access !== undefined) payload.access = updates.access;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.views !== undefined) payload.views = updates.views;
    if (updates.downloads !== undefined) payload.downloads = updates.downloads;
    if (updates.likes !== undefined) payload.likes = updates.likes;
    if (updates.copies !== undefined) payload.copies = updates.copies;
    if (updates.isTrending !== undefined) payload.is_trending = Boolean(updates.isTrending);
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("prompts")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? formatPrompt(data) : null;
  },

  async findByIdAndDelete(id) {
    const existing = await Prompt.findById(id);
    if (!existing) return null;
    const { data, error } = await supabase
      .from("prompts")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? formatPrompt(data) : null;
  },

  async countDocuments(filter = {}) {
    let query = supabase.from("prompts").select("*", { count: "exact", head: true });
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.access) query = query.eq("access", filter.access);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },
};

module.exports = Prompt;
