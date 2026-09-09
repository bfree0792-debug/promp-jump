const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Prompt = require("../models/Prompt");
const { toRelativeUploadUrl } = require("../utils/media");
const { adminRateLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads/prompts");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

function mediaTypeFromMime(mime = "") {
  if (mime.startsWith("video/")) return "Video";
  return "Image";
}

function normalizeAccess(access) {
  if (access === "Premium") return "Pro";
  if (["Free", "Pro", "Team", "Unassigned"].includes(access)) return access;
  return "Unassigned";
}

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.access) {
      filter.access = normalizeAccess(req.query.access);
    }
    const prompts = await Prompt.find(filter).sort({ createdAt: -1 });
    res.json(prompts.map((p) => p.toJSON()));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch prompts." });
  }
});

router.get("/trending", async (_req, res) => {
  try {
    const prompts = await Prompt.find({
      status: "Published",
      access: { $ne: "Unassigned" },
      isTrending: true,
    })
      .sort({ isTrending: -1, likes: -1, copies: -1 })
      .limit(50);
    res.json(prompts.map((p) => p.toJSON()));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch trending prompts." });
  }
});

router.get("/most-copied", async (_req, res) => {
  try {
    const prompts = await Prompt.find({ status: "Published" })
      .sort({ copies: -1 })
      .limit(20);
    res.json(prompts.map((p) => p.toJSON()));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch most copied prompts." });
  }
});

router.post("/", adminRateLimiter, upload.single("media"), async (req, res) => {
  try {
    const { title, description, category, access, status } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Media file is required." });
    }

    const type = mediaTypeFromMime(req.file.mimetype);
    const mediaUrl = `/uploads/prompts/${req.file.filename}`;

    const prompt = await Prompt.create({
      title: title || req.file.originalname,
      description: description || "",
      type,
      mediaUrl,
      thumbnail: mediaUrl,
      category: category || "General",
      access: normalizeAccess(access || "Free"),
      status: status || "Published",
      tags: ["uploaded"],
      views: 0,
      downloads: 0,
      likes: 0,
      copies: 0,
    });

    res.status(201).json(prompt.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not create prompt." });
  }
});

router.patch("/:id/access", adminRateLimiter, async (req, res) => {
  try {
    const access = normalizeAccess(req.body.access);
    const prompt = await Prompt.findByIdAndUpdate(
      req.params.id,
      { access },
      { new: true }
    );

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found." });
    }

    res.json(prompt.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not update access." });
  }
});

router.patch("/:id", adminRateLimiter, upload.single("media"), async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found." });
    }

    const { title, description, category, access, status, isTrending } = req.body;

    if (title !== undefined) {
      const trimmed = String(title).trim();
      if (!trimmed) {
        return res.status(400).json({ message: "Title cannot be empty." });
      }
      prompt.title = trimmed;
    }

    if (description !== undefined) prompt.description = String(description);
    if (category !== undefined) prompt.category = String(category).trim() || "General";
    if (access !== undefined) prompt.access = normalizeAccess(access);
    if (status !== undefined) {
      if (!["Published", "Draft", "Archived"].includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
      }
      prompt.status = status;
    }
    if (isTrending !== undefined) {
      prompt.isTrending = isTrending === true || isTrending === "true";
    }

    if (req.file) {
      const type = mediaTypeFromMime(req.file.mimetype);
      const mediaUrl = `/uploads/prompts/${req.file.filename}`;
      prompt.type = type;
      prompt.mediaUrl = mediaUrl;
      prompt.thumbnail = mediaUrl;
    }

    await prompt.save();
    res.json(prompt.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not update prompt." });
  }
});

router.delete("/:id", adminRateLimiter, async (req, res) => {
  try {
    const deleted = await Prompt.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Prompt not found." });
    }

    try {
      const filename = path.basename(String(deleted.mediaUrl || ""));
      const localPath = path.join(uploadDir, filename);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    } catch {
      // ignore cleanup errors
    }

    res.json({ message: "Prompt deleted." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete prompt." });
  }
});

module.exports = router;
