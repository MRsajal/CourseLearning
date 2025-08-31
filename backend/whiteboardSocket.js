const socketIo = require("socket.io");

const setupWhiteboardSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Store active whiteboard sessions
  const whiteboardSessions = new Map();

  io.on("connection", (socket) => {
    console.log("User connected to whiteboard:", socket.id);

    socket.on("join-whiteboard", (data) => {
      const { courseId, userId, role } = data;

      socket.join(`whiteboard-${courseId}`);
      socket.courseId = courseId;
      socket.userId = userId;
      socket.role = role;

      // Get or create session
      if (!whiteboardSessions.has(courseId)) {
        whiteboardSessions.set(courseId, {
          participants: new Map(),
          drawingData: [],
        });
      }

      const session = whiteboardSessions.get(courseId);
      session.participants.set(socket.id, {
        userId,
        role,
        socketId: socket.id,
      });

      // Send current participants list
      const participants = Array.from(session.participants.values());
      io.to(`whiteboard-${courseId}`).emit(
        "participants-updated",
        participants
      );

      // Send existing drawing data to new participant
      if (session.drawingData.length > 0) {
        socket.emit("whiteboard-load", session.drawingData);
      }
    });

    socket.on("whiteboard-draw", (data) => {
      const { courseId } = data;

      // Only instructors can draw
      if (socket.role !== "instructor") {
        return;
      }

      // Store drawing data
      if (whiteboardSessions.has(courseId)) {
        const session = whiteboardSessions.get(courseId);
        session.drawingData.push(data);
      }

      // Broadcast to all participants except sender
      socket.to(`whiteboard-${courseId}`).emit("whiteboard-draw", data);
    });

    socket.on("whiteboard-clear", (data) => {
      const { courseId } = data;

      // Only instructors can clear
      if (socket.role !== "instructor") {
        return;
      }

      // Clear stored data
      if (whiteboardSessions.has(courseId)) {
        const session = whiteboardSessions.get(courseId);
        session.drawingData = [];
      }

      // Broadcast clear to all participants
      io.to(`whiteboard-${courseId}`).emit("whiteboard-clear");
    });

    socket.on("whiteboard-cursor", (data) => {
      const { courseId, position } = data;

      // Broadcast cursor position to other participants
      socket.to(`whiteboard-${courseId}`).emit("whiteboard-cursor", {
        userId: socket.userId,
        position,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from whiteboard:", socket.id);

      if (socket.courseId && whiteboardSessions.has(socket.courseId)) {
        const session = whiteboardSessions.get(socket.courseId);
        session.participants.delete(socket.id);

        // Update participants list
        const participants = Array.from(session.participants.values());
        io.to(`whiteboard-${socket.courseId}`).emit(
          "participants-updated",
          participants
        );

        // Clean up empty sessions
        if (session.participants.size === 0) {
          whiteboardSessions.delete(socket.courseId);
        }
      }
    });
  });

  return io;
};

module.exports = setupWhiteboardSocket;
