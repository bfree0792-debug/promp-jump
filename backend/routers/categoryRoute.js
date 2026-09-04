const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Category = require("../models/Category");
const { adminRateLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads/categories");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
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

router.post("/", adminRateLimiter, upload.single("icon"), async (req, res) => {
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
      iconUrl = `/uploads/categories/${req.file.filename}`;
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

router.delete("/:id", adminRateLimiter, async (req, res) => {
  try {
    const categoryId = req.params.id;
    if (!categoryId || !String(categoryId).trim()) {
      return res.status(400).json({ message: "Category ID is required." });
    }

    const deleted = await Category.findByIdAndDelete(categoryId);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found." });
    }

    try {
      if (deleted.iconUrl) {
        const filename = path.basename(String(deleted.iconUrl));
        const localPath = path.join(uploadDir, filename);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      }
    } catch {
      // ignore cleanup errors
    }

    res.json({ message: "Category deleted successfully.", category: deleted });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: error.message || "Could not delete category." });
  }
});

module.exports = router;
