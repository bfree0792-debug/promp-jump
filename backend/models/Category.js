const mongoose = require("mongoose");
const { toRelativeUploadUrl } = require("../utils/media");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    iconUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

categorySchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.iconUrl = toRelativeUploadUrl(ret.iconUrl);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Category", categorySchema);
