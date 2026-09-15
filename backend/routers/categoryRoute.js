const express = require("express");
const multer = require("multer");
const Category = require("../models/Category");
const { adminRateLimiter } = require("../middlewares/rateLimiter");
const { requireAdminSession } = require("../middlewares/adminSession");
const { uploadToSupabase, deleteFromSupabase } = require("../utils/supabaseStorage");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for category icons."));
    }
  },
});

router.get("/", async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories.map((c) => c.toJSON()));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch categories." });
  }
});

router.post("/", requireAdminSession, adminRateLimiter, upload.single("icon"), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required." });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Category already exists." });
    }

    let iconUrl = "";
    if (req.file) {
      iconUrl = await uploadToSupabase(req.file, "categories");
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || "",
      iconUrl,
    });

    res.status(201).json(category.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message || "Could not create category." });
  }
});

router.patch("/:id", requireAdminSession, adminRateLimiter, upload.single("icon"), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required." });
    }

    const current = await Category.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: "Category not found." });
    }

    const updates = {
      name: name.trim(),
      description: description || "",
    };
    if (req.file) {
      updates.icon_url = await uploadToSupabase(req.file, "categories");
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updates);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    if (req.file && current.iconUrl && current.iconUrl !== updates.icon_url) {
      deleteFromSupabase(current.iconUrl).catch(() => {});
    }

    res.json(category.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message || "Could not update category." });
  }
});

router.delete("/:id", requireAdminSession, adminRateLimiter, async (req, res) => {
  try {
    const categoryId = req.params.id;
    if (!categoryId || !String(categoryId).trim()) {
      return res.status(400).json({ message: "Category ID is required." });
    }

    const deleted = await Category.findByIdAndDelete(categoryId);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found." });
    }

    if (deleted.iconUrl) {
      deleteFromSupabase(deleted.iconUrl).catch(() => {});
    }

    res.json({ message: "Category deleted successfully.", category: deleted });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: error.message || "Could not delete category." });
  }
});

module.exports = router;
