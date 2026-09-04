const express = require("express");
const Announcement = require("../models/Announcement");
const { adminRateLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.audience) filter.audience = req.query.audience;

    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
    res.json(announcements.map((a) => a.toJSON()));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch announcements." });
  }
});

router.post("/", adminRateLimiter, async (req, res) => {
  try {
    const { title, message, audience, status } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required." });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    const announcement = await Announcement.create({
      title: String(title).trim(),
      message: String(message).trim(),
      audience: ["all", "Free", "Pro", "Team"].includes(audience) ? audience : "all",
      status: status === "Draft" ? "Draft" : "Published",
    });

    res.status(201).json(announcement.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not create announcement." });
  }
});

router.patch("/:id", adminRateLimiter, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    const { title, message, audience, status } = req.body;

    if (title !== undefined) {
      const trimmed = String(title).trim();
      if (!trimmed) return res.status(400).json({ message: "Title cannot be empty." });
      announcement.title = trimmed;
    }
    if (message !== undefined) {
      const trimmed = String(message).trim();
      if (!trimmed) return res.status(400).json({ message: "Message cannot be empty." });
      announcement.message = trimmed;
    }
    if (audience !== undefined && ["all", "Free", "Pro", "Team"].includes(audience)) {
      announcement.audience = audience;
    }
    if (status !== undefined && ["Draft", "Published"].includes(status)) {
      announcement.status = status;
    }

    await announcement.save();
    res.json(announcement.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Could not update announcement." });
  }
});

router.delete("/:id", adminRateLimiter, async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Announcement not found." });
    }
    res.json({ message: "Announcement deleted." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete announcement." });
  }
});

module.exports = router;
