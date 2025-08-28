const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, array, or boolean
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
});

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
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
  answers: [answerSchema],
  score: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  totalPoints: {
    type: Number,
    required: true,
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
  isPassed: {
    type: Boolean,
    default: false,
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  attemptNumber: {
    type: Number,
    required: true,
  },
});

// Index for efficient querying
quizAttemptSchema.index({ quiz: 1, student: 1, attemptNumber: 1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
