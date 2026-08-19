const mongoose = require("mongoose");
const { toRelativeUploadUrl } = require("../utils/media");

const promptSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    type: { type: String, enum: ["Image", "Video"], required: true },
    mediaUrl: { type: String, required: true },
    thumbnail: { type: String, required: true },
    category: { type: String, default: "General", trim: true },
    tags: { type: [String], default: [] },
    access: {
      type: String,
      enum: ["Free", "Pro", "Team", "Unassigned"],
      default: "Unassigned",
    },
    status: {
      type: String,
      enum: ["Published", "Draft", "Archived"],
      default: "Published",
    },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    copies: { type: Number, default: 0 },
    isTrending: { type: Boolean, default: false },
  },
  { timestamps: true }
);

promptSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.mediaUrl = toRelativeUploadUrl(ret.mediaUrl);
    ret.thumbnail = toRelativeUploadUrl(ret.thumbnail);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Prompt", promptSchema);
