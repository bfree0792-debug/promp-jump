const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      enum: ["all", "Free", "Pro", "Team"],
      default: "all",
    },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Published",
    },
  },
  { timestamps: true }
);

announcementSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Announcement", announcementSchema);
