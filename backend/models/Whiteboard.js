const mongoose = require("mongoose");

const whiteboardSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageData: {
      type: String, // Base64 encoded image
      required: false,
    },
    paths: {
      type: String, // JSON string of drawing paths
      required: false,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
whiteboardSchema.index({ course: 1 });
whiteboardSchema.index({ instructor: 1 });

module.exports = mongoose.model("Whiteboard", whiteboardSchema);
