const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
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
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  quizAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizAttempt",
    required: true,
  },
  certificateId: {
    type: String,
    required: true,
    default: function() {
      const timestamp = Date.now().toString().slice(-8);
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `CERT-${timestamp}-${randomStr}`;
    }
  },
  studentName: {
    type: String,
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  instructorName: {
    type: String,
    required: true,
  },
  completionDate: {
    type: Date,
    default: Date.now,
  },
  finalScore: {
    type: Number,
    required: true,
  },
  courseProgress: {
    type: Number, // percentage
    required: true,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  verificationCode: {
    type: String,
    required: true,
    default: function() {
      return Math.random().toString(36).substring(2, 12).toUpperCase();
    }
  },
});

// Index for efficient querying
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);
