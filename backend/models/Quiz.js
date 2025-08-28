const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["multiple-choice", "true-false", "short-answer"],
    required: true,
  },
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ], // For multiple choice questions
  correctAnswer: {
    type: String, // For true-false or short-answer questions
    required: function () {
      return this.type === "true-false" || this.type === "short-answer";
    },
  },
  points: {
    type: Number,
    default: 1,
    min: 1,
  },
  explanation: {
    type: String,
    default: "",
  },
});

const quizSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  instructions: {
    type: String,
    default: "Answer all questions to the best of your ability.",
  },
  questions: [questionSchema],
  timeLimit: {
    type: Number, // in minutes
    default: 60,
  },
  passingScore: {
    type: Number, // percentage (0-100)
    default: 70,
    min: 0,
    max: 100,
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFinalQuiz: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
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

// Pre-save middleware to update timestamp
quizSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate total points
quizSchema.methods.getTotalPoints = function () {
  return this.questions.reduce((total, question) => total + question.points, 0);
};

module.exports = mongoose.model("Quiz", quizSchema);
