const express = require("express");
const multer = require("multer");
const Prompt = require("../models/Prompt");
const { toRelativeUploadUrl } = require("../utils/media");
const { adminRateLimiter } = require("../middlewares/rateLimiter");
const { requireAdminSession } = require("../middlewares/adminSession");
const { uploadToSupabase, deleteFromSupabase } = require("../utils/supabaseStorage");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
});

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

router.post("/", requireAdminSession, adminRateLimiter, upload.single("media"), async (req, res) => {
  try {
    const { title, description, category, access, status } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Media file is required." });
    }

    const type = mediaTypeFromMime(req.file.mimetype);
    const mediaUrl = await uploadToSupabase(req.file, "prompts");

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
    console.error("Error creating prompt:", error);
    res.status(500).json({ message: error.message || "Could not create prompt." });
  }
});

router.patch("/:id/access", requireAdminSession, adminRateLimiter, async (req, res) => {
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

router.patch("/:id", requireAdminSession, adminRateLimiter, upload.single("media"), async (req, res) => {
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
      const oldMediaUrl = prompt.mediaUrl;
      const mediaUrl = await uploadToSupabase(req.file, "prompts");
      prompt.type = type;
      prompt.mediaUrl = mediaUrl;
      prompt.thumbnail = mediaUrl;

      // Clean up previous image if it was hosted on Supabase
      if (oldMediaUrl && oldMediaUrl !== mediaUrl) {
        deleteFromSupabase(oldMediaUrl).catch(() => {});
      }
    }

    await prompt.save();
    res.json(prompt.toJSON());
  } catch (error) {
    console.error("Error updating prompt:", error);
    res.status(500).json({ message: error.message || "Could not update prompt." });
  }
});

router.delete("/:id", requireAdminSession, adminRateLimiter, async (req, res) => {
  try {
    const deleted = await Prompt.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Prompt not found." });
    }

    if (deleted.mediaUrl) {
      deleteFromSupabase(deleted.mediaUrl).catch(() => {});
    }

    res.json({ message: "Prompt deleted." });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    res.status(500).json({ message: "Could not delete prompt." });
  }
});

module.exports = router;
