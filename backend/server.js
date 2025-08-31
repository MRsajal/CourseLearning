const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/mern_auth",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Import routes
const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const materialRoutes = require("./routes/materials");
const progressRoutes = require("./routes/progress");
const quizRoutes = require("./routes/quiz");
const certificateRoutes = require("./routes/certificate");
const setupLiveClassSocket = require("./liveClassSocket");

// Use routes
app.use("/api", authRoutes);
app.use("/api", courseRoutes);
app.use("/api", materialRoutes);
app.use("/api", progressRoutes);
app.use("/api", quizRoutes);
app.use("/api/certificate", certificateRoutes);
app.use("/api/live-class", require("./routes/liveClass"));
app.use("/api/whiteboard", require("./routes/whiteboard"));

const io = setupLiveClassSocket(server);
// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Server is running",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
