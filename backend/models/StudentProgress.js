const mongoose = require("mongoose");

const studentProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  completedMaterials: [
    {
      material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseMaterial",
      },
      completedAt: {
        type: Date,
        default: Date.now,
      },
      timeSpent: {
        type: Number,
        default: 0,
      },
    },
  ],
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0,
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
});

studentProgressSchema.index({ student: 1, course: 1 }, { unique: true });

studentProgressSchema.methods.updateProgress = async function () {
  const CourseMaterial = mongoose.model("CourseMaterial");
  const totalMaterials = await CourseMaterial.countDocuments({
    course: this.course,
    isActive: true,
  });
  if (totalMaterials === 0) {
    this.progressPercentage = 0;
  } else {
    this.progressPercentage = Math.round(
      (this.completedMaterials.length / totalMaterials) * 100
    );
  }
  return this.progressPercentage;
};

module.exports = mongoose.model("StudentProgress", studentProgressSchema);
