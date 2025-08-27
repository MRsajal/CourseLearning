const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  instructorName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Technology",
      "Business",
      "Design",
      "Marketing",
      "Health",
      "Music",
      "Language",
      "Other",
    ],
  },
  level: {
    type: String,
    required: true,
    enum: ["Beginner", "Intermediate", "Advanced"],
  },
  duration: {
    type: String,
    required: true, // e.g., "4 weeks", "2 months"
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  thumbnail: {
    type: String,
    default: "",
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  enrolledStudents: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      enrolledAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  maxStudents: {
    type: Number,
    default: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
courseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Course", courseSchema);
