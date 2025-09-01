const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
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
  dueDate: {
    type: Date,
    required: true,
  },
  allowedTypes: [{
    type: String,
    enum: ["text", "pdf"],
    required: true,
  }],
  maxFileSize: {
    type: Number,
    default: 10 * 1024 * 1024, // 10MB in bytes
  },
  instructions: {
    type: String,
    default: "",
  },
  points: {
    type: Number,
    default: 100,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submissionType: {
      type: String,
      enum: ["text", "pdf"],
      required: true,
    },
    textContent: {
      type: String,
      // Required only if submissionType is "text"
    },
    fileUrl: {
      type: String,
      // Required only if submissionType is "pdf"
    },
    fileName: {
      type: String,
      // Original file name for pdf submissions
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    grade: {
      type: Number,
      min: 0,
    },
    feedback: {
      type: String,
      default: "",
    },
    isGraded: {
      type: Boolean,
      default: false,
    },
    gradedAt: {
      type: Date,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  }],
}, {
  timestamps: true,
});

// Index for better query performance
assignmentSchema.index({ course: 1, dueDate: 1 });
assignmentSchema.index({ instructor: 1 });
assignmentSchema.index({ "submissions.student": 1 });

// Virtual to get submission count
assignmentSchema.virtual("submissionCount").get(function() {
  return this.submissions.length;
});

// Method to check if a student has submitted
assignmentSchema.methods.hasStudentSubmitted = function(studentId) {
  return this.submissions.some(sub => sub.student.toString() === studentId.toString());
};

// Method to get student's submission
assignmentSchema.methods.getStudentSubmission = function(studentId) {
  return this.submissions.find(sub => sub.student.toString() === studentId.toString());
};

// Method to check if assignment is overdue
assignmentSchema.virtual("isOverdue").get(function() {
  return new Date() > this.dueDate;
});

module.exports = mongoose.model("Assignment", assignmentSchema);
