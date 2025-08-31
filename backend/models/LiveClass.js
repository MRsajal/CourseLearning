const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  joinedAt: {
    type: Date,
    required: true,
  },
  leftAt: {
    type: Date,
  },
  present: {
    type: Boolean,
    default: true,
  },
  duration: {
    type: Number, // in minutes
    default: 0,
  },
});

const recordingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, // in seconds
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
});

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      type: String,
      required: true,
    },
  ],
  votes: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      selectedOption: {
        type: Number,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
});

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["chat", "system", "announcement"],
    default: "chat",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const liveClassSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    actualStartTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
      min: 15,
      max: 480, // 8 hours max
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        required: function () {
          return this.parent().isRecurring;
        },
      },
      interval: {
        type: Number,
        default: 1,
        min: 1,
      },
      daysOfWeek: [
        {
          type: Number,
          min: 0,
          max: 6, // 0 = Sunday, 6 = Saturday
        },
      ],
      endDate: Date,
    },
    maxParticipants: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000,
    },
    currentParticipants: {
      type: Number,
      default: 0,
    },
    attendance: [attendanceSchema],
    recordings: [recordingSchema],
    chatLog: [chatMessageSchema],
    polls: [pollSchema],
    breakoutRooms: [
      {
        name: {
          type: String,
          required: true,
        },
        participants: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        isActive: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    whiteboardData: {
      type: String, // JSON string of whiteboard state
      default: null,
    },
    settings: {
      allowChat: {
        type: Boolean,
        default: true,
      },
      allowScreenShare: {
        type: Boolean,
        default: true,
      },
      allowRecording: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
      muteParticipantsOnEntry: {
        type: Boolean,
        default: true,
      },
      allowParticipantVideo: {
        type: Boolean,
        default: false,
      },
      allowParticipantAudio: {
        type: Boolean,
        default: false,
      },
      enableWaitingRoom: {
        type: Boolean,
        default: false,
      },
      recordingQuality: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
      language: {
        type: String,
        default: "en",
      },
    },
    analytics: {
      totalJoins: {
        type: Number,
        default: 0,
      },
      averageDuration: {
        type: Number,
        default: 0,
      },
      chatMessages: {
        type: Number,
        default: 0,
      },
      pollsCreated: {
        type: Number,
        default: 0,
      },
      recordingViews: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended", "cancelled"],
      default: "scheduled",
    },
    cancelReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
liveClassSchema.index({ course: 1, scheduledTime: -1 });
liveClassSchema.index({ instructor: 1, scheduledTime: -1 });
liveClassSchema.index({ isActive: 1, scheduledTime: -1 });
liveClassSchema.index({ status: 1, scheduledTime: -1 });
liveClassSchema.index({ "attendance.student": 1 });

// Virtual for actual duration
liveClassSchema.virtual("actualDuration").get(function () {
  if (this.actualStartTime && this.endTime) {
    return Math.round((this.endTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  return 0;
});

// Virtual for attendance rate
liveClassSchema.virtual("attendanceRate").get(function () {
  if (this.attendance.length === 0) return 0;
  const presentCount = this.attendance.filter((att) => att.present).length;
  return Math.round((presentCount / this.attendance.length) * 100);
});

// Pre-save middleware to update status
liveClassSchema.pre("save", function (next) {
  const now = new Date();

  if (this.isActive) {
    this.status = "live";
  } else if (this.endTime && this.endTime < now) {
    this.status = "ended";
  } else if (this.scheduledTime > now) {
    this.status = "scheduled";
  }

  next();
});

// Methods
liveClassSchema.methods.markAttendance = function (
  studentId,
  joinTime = new Date()
) {
  const existingAttendance = this.attendance.find(
    (att) => att.student.toString() === studentId.toString()
  );

  if (!existingAttendance) {
    this.attendance.push({
      student: studentId,
      joinedAt: joinTime,
      present: true,
    });
    this.analytics.totalJoins += 1;
  }

  return this.save();
};

liveClassSchema.methods.addChatMessage = function (
  userId,
  userName,
  message,
  type = "chat"
) {
  this.chatLog.push({
    user: userId,
    userName: userName,
    message: message,
    type: type,
    timestamp: new Date(),
  });

  if (type === "chat") {
    this.analytics.chatMessages += 1;
  }

  return this.save();
};

liveClassSchema.methods.createPoll = function (
  question,
  options,
  expiresIn = null
) {
  const poll = {
    question: question,
    options: options,
    votes: [],
    isActive: true,
    createdAt: new Date(),
  };

  if (expiresIn) {
    poll.expiresAt = new Date(Date.now() + expiresIn * 60000); // expiresIn in minutes
  }

  this.polls.push(poll);
  this.analytics.pollsCreated += 1;

  return this.save();
};

liveClassSchema.methods.votePoll = function (
  pollId,
  studentId,
  selectedOption
) {
  const poll = this.polls.id(pollId);
  if (!poll || !poll.isActive) {
    throw new Error("Poll not found or inactive");
  }

  // Check if already voted
  const existingVote = poll.votes.find(
    (vote) => vote.student.toString() === studentId.toString()
  );

  if (existingVote) {
    existingVote.selectedOption = selectedOption;
    existingVote.timestamp = new Date();
  } else {
    poll.votes.push({
      student: studentId,
      selectedOption: selectedOption,
      timestamp: new Date(),
    });
  }

  return this.save();
};

liveClassSchema.methods.getPollResults = function (pollId) {
  const poll = this.polls.id(pollId);
  if (!poll) return null;

  const results = poll.options.map((option, index) => ({
    option: option,
    votes: poll.votes.filter((vote) => vote.selectedOption === index).length,
  }));

  return {
    question: poll.question,
    totalVotes: poll.votes.length,
    results: results,
  };
};

liveClassSchema.methods.endClass = function () {
  this.isActive = false;
  this.endTime = new Date();
  this.status = "ended";

  // Calculate average duration
  const totalDuration = this.attendance.reduce((sum, att) => {
    if (att.leftAt) {
      return sum + (att.leftAt - att.joinedAt) / (1000 * 60);
    } else if (this.endTime) {
      return sum + (this.endTime - att.joinedAt) / (1000 * 60);
    }
    return sum;
  }, 0);

  if (this.attendance.length > 0) {
    this.analytics.averageDuration = Math.round(
      totalDuration / this.attendance.length
    );
  }

  return this.save();
};

// Static methods
liveClassSchema.statics.getUpcomingClasses = function (
  instructorId,
  limit = 10
) {
  return this.find({
    instructor: instructorId,
    scheduledTime: { $gte: new Date() },
    status: "scheduled",
  })
    .populate("course", "title")
    .sort({ scheduledTime: 1 })
    .limit(limit);
};

liveClassSchema.statics.getActiveClasses = function () {
  return this.find({
    isActive: true,
    status: "live",
  })
    .populate("course", "title")
    .populate("instructor", "name email");
};

liveClassSchema.statics.getClassHistory = function (courseId, limit = 20) {
  return this.find({
    course: courseId,
    status: "ended",
  })
    .populate("instructor", "name")
    .sort({ scheduledTime: -1 })
    .limit(limit);
};

module.exports = mongoose.model("LiveClass", liveClassSchema);
