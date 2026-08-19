const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Prompt = require("../models/Prompt");
const {
  getPlanLimits,
  ensureDailyUsage,
  canAccessPrompt,
  getUsageSummary,
} = require("../lib/planLimits");

const router = express.Router();

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function accessDeniedMessage(subscription, access) {
  return `${access} content requires a ${access} plan or higher. You are on ${subscription}. Upgrade to unlock this content.`;
}

router.get("/:userId/library", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const [saved, liked] = await Promise.all([
      Prompt.find({ _id: { $in: user.savedPrompts || [] } }).sort({ createdAt: -1 }),
      Prompt.find({ _id: { $in: user.likedPrompts || [] } }).sort({ createdAt: -1 }),
    ]);

    res.json({
      user: user.toSafeJSON(),
      saved: saved.map((p) => p.toJSON()),
      liked: liked.map((p) => p.toJSON()),
      usage: getUsageSummary(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch library." });
  }
});

router.get("/:userId/usage", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(getUsageSummary(user));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch usage." });
  }
});

router.post("/:userId/save/:promptId", async (req, res) => {
  try {
    const { userId, promptId } = req.params;
    if (!isValidId(userId) || !isValidId(promptId)) {
      return res.status(400).json({ message: "Invalid id." });
    }

    const [user, prompt] = await Promise.all([
      User.findById(userId),
      Prompt.findById(promptId),
    ]);

    if (!user) return res.status(404).json({ message: "User not found." });
    if (!prompt) return res.status(404).json({ message: "Prompt not found." });

    const alreadySaved = user.savedPrompts.some((id) => id.toString() === promptId);
    if (alreadySaved) {
      user.savedPrompts = user.savedPrompts.filter((id) => id.toString() !== promptId);
      await user.save();
      return res.json({
        saved: false,
        user: user.toSafeJSON(),
        usage: getUsageSummary(user),
      });
    }

    if (!canAccessPrompt(user, prompt)) {
      return res.status(403).json({
        message: accessDeniedMessage(user.subscription, prompt.access),
      });
    }

    const limits = getPlanLimits(user.subscription);

    if (limits.savesImagesOnly && prompt.type !== "Image") {
      return res.status(403).json({
        message: "Free plan can only save image prompts. Upgrade to save videos.",
      });
    }

    if (limits.maxSaves !== null && user.savedPrompts.length >= limits.maxSaves) {
      return res.status(403).json({
        message: `Free plan limit reached: max ${limits.maxSaves} saved images. Upgrade for more saves.`,
      });
    }

    user.savedPrompts.push(prompt._id);
    await user.save();
    res.json({
      saved: true,
      user: user.toSafeJSON(),
      usage: getUsageSummary(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Could not update saved prompts." });
  }
});

router.post("/:userId/like/:promptId", async (req, res) => {
  try {
    const { userId, promptId } = req.params;
    if (!isValidId(userId) || !isValidId(promptId)) {
      return res.status(400).json({ message: "Invalid id." });
    }

    const [user, prompt] = await Promise.all([
      User.findById(userId),
      Prompt.findById(promptId),
    ]);

    if (!user) return res.status(404).json({ message: "User not found." });
    if (!prompt) return res.status(404).json({ message: "Prompt not found." });

    const alreadyLiked = user.likedPrompts.some((id) => id.toString() === promptId);
    if (alreadyLiked) {
      user.likedPrompts = user.likedPrompts.filter((id) => id.toString() !== promptId);
      prompt.likes = Math.max(0, (prompt.likes || 0) - 1);
      await Promise.all([user.save(), prompt.save()]);
      return res.json({
        liked: false,
        likes: prompt.likes,
        user: user.toSafeJSON(),
        prompt: prompt.toJSON(),
        usage: getUsageSummary(user),
      });
    }

    if (!canAccessPrompt(user, prompt)) {
      return res.status(403).json({
        message: accessDeniedMessage(user.subscription, prompt.access),
      });
    }

    const limits = getPlanLimits(user.subscription);
    if (limits.maxFavorites !== null && user.likedPrompts.length >= limits.maxFavorites) {
      return res.status(403).json({
        message: `Free plan limit reached: max ${limits.maxFavorites} favorites. Upgrade for unlimited favorites.`,
      });
    }

    user.likedPrompts.push(prompt._id);
    prompt.likes = (prompt.likes || 0) + 1;

    await Promise.all([user.save(), prompt.save()]);
    res.json({
      liked: true,
      likes: prompt.likes,
      user: user.toSafeJSON(),
      prompt: prompt.toJSON(),
      usage: getUsageSummary(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Could not update like." });
  }
});

router.post("/:userId/copy/:promptId", async (req, res) => {
  try {
    const { userId, promptId } = req.params;
    if (!isValidId(userId) || !isValidId(promptId)) {
      return res.status(400).json({ message: "Invalid id." });
    }

    const [user, prompt] = await Promise.all([
      User.findById(userId),
      Prompt.findById(promptId),
    ]);

    if (!user) return res.status(404).json({ message: "User not found." });
    if (!prompt) return res.status(404).json({ message: "Prompt not found." });

    if (!canAccessPrompt(user, prompt)) {
      return res.status(403).json({
        message: accessDeniedMessage(user.subscription, prompt.access),
      });
    }

    const limits = getPlanLimits(user.subscription);
    const usage = ensureDailyUsage(user);
    const isVideo = prompt.type === "Video";

    if (isVideo) {
      if (
        limits.dailyVideoCopies !== null &&
        usage.videoCopies >= limits.dailyVideoCopies
      ) {
        return res.status(403).json({
          message: `Daily free limit reached: ${limits.dailyVideoCopies} video description copies. Try again tomorrow or upgrade.`,
        });
      }
      usage.videoCopies = (usage.videoCopies || 0) + 1;
    } else {
      if (
        limits.dailyImageCopies !== null &&
        usage.imageCopies >= limits.dailyImageCopies
      ) {
        return res.status(403).json({
          message: `Daily free limit reached: ${limits.dailyImageCopies} image description copies. Try again tomorrow or upgrade.`,
        });
      }
      usage.imageCopies = (usage.imageCopies || 0) + 1;
    }

    user.dailyUsage = usage;
    prompt.copies = (prompt.copies || 0) + 1;
    prompt.downloads = (prompt.downloads || 0) + 1;

    await Promise.all([user.save(), prompt.save()]);

    res.json({
      text: prompt.description || prompt.title || "",
      copies: prompt.copies,
      downloads: prompt.downloads,
      prompt: prompt.toJSON(),
      user: user.toSafeJSON(),
      usage: getUsageSummary(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Could not copy prompt." });
  }
});

module.exports = router;
