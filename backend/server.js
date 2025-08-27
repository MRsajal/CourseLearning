const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

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

// Use routes
app.use("/api", authRoutes);
app.use("/api", courseRoutes);
app.use("/api", materialRoutes);
app.use("/api", progressRoutes);

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
