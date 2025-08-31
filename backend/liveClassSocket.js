const socketIo = require("socket.io");
const LiveClass = require("./models/LiveClass");
const Course = require("./models/Course");

const setupLiveClassSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Store active classes and participants
  const activeClasses = new Map();
  const userSockets = new Map();

  io.on("connection", (socket) => {
    console.log("User connected to live class:", socket.id);

    socket.on("join-class", async (data) => {
      const { courseId, userId, userName, role } = data;

      socket.join(`class-${courseId}`);
      socket.courseId = courseId;
      socket.userId = userId;
      socket.userName = userName;
      socket.role = role;

      userSockets.set(userId, socket.id);

      // Get or create class session
      if (!activeClasses.has(courseId)) {
        activeClasses.set(courseId, {
          participants: new Map(),
          chatMessages: [],
          polls: [],
          isRecording: false,
          startTime: new Date(),
        });
      }

      const classSession = activeClasses.get(courseId);
      classSession.participants.set(userId, {
        userId,
        userName,
        role,
        socketId: socket.id,
        joinedAt: new Date(),
        handRaised: false,
      });

      // Update participants list
      const participants = Array.from(classSession.participants.values());
      io.to(`class-${courseId}`).emit("participants-updated", participants);

      // Send existing chat messages to new participant
      socket.emit("chat-history", classSession.chatMessages);

      // Mark attendance
      try {
        await LiveClass.findOneAndUpdate(
          { course: courseId, isActive: true },
          {
            $addToSet: {
              attendance: {
                student: userId,
                joinedAt: new Date(),
                present: true,
              },
            },
          }
        );
      } catch (error) {
        console.error("Error marking attendance:", error);
      }

      console.log(`${userName} joined class ${courseId}`);
      socket
        .to(`class-${courseId}`)
        .emit("user-joined", { userId, userName, role });
    });

    socket.on("leave-class", (data) => {
      const { courseId, userId } = data;

      if (activeClasses.has(courseId)) {
        const classSession = activeClasses.get(courseId);
        classSession.participants.delete(userId);

        const participants = Array.from(classSession.participants.values());
        io.to(`class-${courseId}`).emit("participants-updated", participants);

        // Clean up empty classes
        if (classSession.participants.size === 0) {
          activeClasses.delete(courseId);
        }
      }

      socket.leave(`class-${courseId}`);
      userSockets.delete(userId);

      socket.to(`class-${courseId}`).emit("user-left", { userId });
    });

    // WebRTC signaling
    socket.on("offer", (data) => {
      const { offer, to } = data;
      const targetSocket = userSockets.get(to);
      if (targetSocket) {
        io.to(targetSocket).emit("offer", {
          offer,
          from: socket.userId,
        });
      }
    });

    socket.on("answer", (data) => {
      const { answer, to } = data;
      const targetSocket = userSockets.get(to);
      if (targetSocket) {
        io.to(targetSocket).emit("answer", {
          answer,
          from: socket.userId,
        });
      }
    });

    socket.on("ice-candidate", (data) => {
      const { candidate, to } = data;
      const targetSocket = userSockets.get(to);
      if (targetSocket) {
        io.to(targetSocket).emit("ice-candidate", {
          candidate,
          from: socket.userId,
        });
      }
    });

    // Chat messages
    socket.on("chat-message", (data) => {
      const { courseId, message } = data;

      if (activeClasses.has(courseId)) {
        const classSession = activeClasses.get(courseId);
        classSession.chatMessages.push(message);
      }

      io.to(`class-${courseId}`).emit("chat-message", message);
    });

    // Hand raising
    socket.on("raise-hand", (data) => {
      const { courseId, userId, userName, raised } = data;

      if (activeClasses.has(courseId)) {
        const classSession = activeClasses.get(courseId);
        const participant = classSession.participants.get(userId);
        if (participant) {
          participant.handRaised = raised;
        }
      }

      io.to(`class-${courseId}`).emit("hand-raised", {
        userId,
        userName,
        raised,
      });
    });

    // Polls
    socket.on("create-poll", (data) => {
      const { courseId, poll } = data;

      // Only instructors can create polls
      if (socket.role !== "instructor") return;

      if (activeClasses.has(courseId)) {
        const classSession = activeClasses.get(courseId);
        classSession.polls.push(poll);
      }

      io.to(`class-${courseId}`).emit("poll-created", poll);
    });

    socket.on("vote-poll", (data) => {
      const { courseId, pollId, optionIndex, userId } = data;

      if (activeClasses.has(courseId)) {
        const classSession = activeClasses.get(courseId);
        const poll = classSession.polls.find((p) => p.id === pollId);

        if (poll) {
          if (!poll.votes) poll.votes = {};
          poll.votes[userId] = optionIndex;

          io.to(`class-${courseId}`).emit("poll-voted", poll);
        }
      }
    });

    // Recording
    socket.on("recording-started", (data) => {
      const { courseId } = data;

      if (socket.role !== "instructor") return;

      if (activeClasses.has(courseId)) {
        const classSession = activeClasses.get(courseId);
        classSession.isRecording = true;
      }

      io.to(`class-${courseId}`).emit("recording-started");
    });

    socket.on("recording-stopped", (data) => {
      const { courseId } = data;

      if (socket.role !== "instructor") return;

      if (activeClasses.has(courseId)) {
        const classSession = activeClasses.get(courseId);
        classSession.isRecording = false;
      }

      io.to(`class-${courseId}`).emit("recording-stopped");
    });

    // End class
    socket.on("end-class", async (data) => {
      const { courseId } = data;

      if (socket.role !== "instructor") return;

      try {
        // Update class in database
        await LiveClass.findOneAndUpdate(
          { course: courseId, isActive: true },
          {
            isActive: false,
            endTime: new Date(),
          }
        );

        // Notify all participants
        io.to(`class-${courseId}`).emit("class-ended");

        // Clean up
        activeClasses.delete(courseId);
      } catch (error) {
        console.error("Error ending class:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from live class:", socket.id);

      if (socket.courseId && socket.userId) {
        if (activeClasses.has(socket.courseId)) {
          const classSession = activeClasses.get(socket.courseId);
          classSession.participants.delete(socket.userId);

          const participants = Array.from(classSession.participants.values());
          io.to(`class-${socket.courseId}`).emit(
            "participants-updated",
            participants
          );

          if (classSession.participants.size === 0) {
            activeClasses.delete(socket.courseId);
          }
        }

        userSockets.delete(socket.userId);
        socket.to(`class-${socket.courseId}`).emit("user-left", {
          userId: socket.userId,
        });
      }
    });
  });

  return io;
};

module.exports = setupLiveClassSocket;
