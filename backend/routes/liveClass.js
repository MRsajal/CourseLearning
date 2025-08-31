const express = require("express");
const multer = require("multer");
const path = require("path");
const LiveClass = require("../models/LiveClass");
const Course = require("../models/Course");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Configure multer for recording uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/recordings/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "recording-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/webm", "video/mp4", "video/avi"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only video files are allowed."));
    }
  },
});

// Create live class
router.post(
  "/create",
  authenticateToken,
  requireRole(["instructor"]),
  async (req, res) => {
    try {
      const {
        courseId,
        title,
        description,
        scheduledTime,
        duration,
        isRecurring,
        recurringPattern,
      } = req.body;

      // Verify course ownership
      const course = await Course.findOne({
        _id: courseId,
        instructor: req.user.userId,
      });

      if (!course) {
        return res
          .status(404)
          .json({ message: "Course not found or unauthorized" });
      }

      const liveClass = new LiveClass({
        course: courseId,
        instructor: req.user.userId,
        title,
        description,
        scheduledTime: new Date(scheduledTime),
        duration,
        isRecurring,
        recurringPattern,
        isActive: false,
      });

      await liveClass.save();

      res.status(201).json({
        message: "Live class created successfully",
        liveClass,
      });
    } catch (error) {
      console.error("Error creating live class:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Start live class
router.post(
  "/start/:classId",
  authenticateToken,
  requireRole(["instructor"]),
  async (req, res) => {
    try {
      const { classId } = req.params;

      const liveClass = await LiveClass.findOneAndUpdate(
        {
          _id: classId,
          instructor: req.user.userId,
        },
        {
          isActive: true,
          actualStartTime: new Date(),
        },
        { new: true }
      ).populate("course", "title");

      if (!liveClass) {
        return res
          .status(404)
          .json({ message: "Live class not found or unauthorized" });
      }

      res.json({
        message: "Live class started successfully",
        liveClass,
      });
    } catch (error) {
      console.error("Error starting live class:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// End live class
router.post(
  "/end/:classId",
  authenticateToken,
  requireRole(["instructor"]),
  async (req, res) => {
    try {
      const { classId } = req.params;

      const liveClass = await LiveClass.findOneAndUpdate(
        {
          _id: classId,
          instructor: req.user.userId,
        },
        {
          isActive: false,
          endTime: new Date(),
        },
        { new: true }
      );

      if (!liveClass) {
        return res
          .status(404)
          .json({ message: "Live class not found or unauthorized" });
      }

      res.json({
        message: "Live class ended successfully",
        liveClass,
      });
    } catch (error) {
      console.error("Error ending live class:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get live classes for a course
router.get("/course/:courseId", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const liveClasses = await LiveClass.find({
      course: courseId,
    })
      .populate("instructor", "name email")
      .populate("course", "title")
      .sort({ scheduledTime: -1 });

    res.json({ liveClasses });
  } catch (error) {
    console.error("Error fetching live classes:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get active live class for a course
router.get("/active/:courseId", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const activeLiveClass = await LiveClass.findOne({
      course: courseId,
      isActive: true,
    })
      .populate("instructor", "name email")
      .populate("course", "title");

    res.json({ liveClass: activeLiveClass });
  } catch (error) {
    console.error("Error fetching active live class:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark attendance
router.post("/attendance", authenticateToken, async (req, res) => {
  try {
    const { courseId, timestamp } = req.body;

    const activeLiveClass = await LiveClass.findOne({
      course: courseId,
      isActive: true,
    });

    if (!activeLiveClass) {
      return res.status(404).json({ message: "No active live class found" });
    }

    // Check if already marked
    const existingAttendance = activeLiveClass.attendance.find(
      (att) => att.student.toString() === req.user.userId
    );

    if (existingAttendance) {
      return res.json({ message: "Attendance already marked" });
    }

    activeLiveClass.attendance.push({
      student: req.user.userId,
      joinedAt: new Date(timestamp),
      present: true,
    });

    await activeLiveClass.save();

    res.json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload recording
router.post(
  "/upload-recording",
  authenticateToken,
  requireRole(["instructor"]),
  upload.single("recording"),
  async (req, res) => {
    try {
      const { courseId, title } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No recording file uploaded" });
      }

      // Find the live class
      const liveClass = await LiveClass.findOne({
        course: courseId,
        instructor: req.user.userId,
      }).sort({ createdAt: -1 });

      if (!liveClass) {
        return res.status(404).json({ message: "Live class not found" });
      }

      // Add recording to live class
      liveClass.recordings.push({
        title: title || `Recording - ${new Date().toLocaleDateString()}`,
        filePath: req.file.path,
        fileName: req.file.filename,
        fileSize: req.file.size,
        uploadedAt: new Date(),
      });

      await liveClass.save();

      res.json({
        message: "Recording uploaded successfully",
        recording: liveClass.recordings[liveClass.recordings.length - 1],
      });
    } catch (error) {
      console.error("Error uploading recording:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get recordings for a course
router.get("/recordings/:courseId", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const liveClasses = await LiveClass.find({
      course: courseId,
      "recordings.0": { $exists: true },
    })
      .populate("instructor", "name")
      .select("title recordings scheduledTime instructor");

    const recordings = [];
    liveClasses.forEach((liveClass) => {
      liveClass.recordings.forEach((recording) => {
        recordings.push({
          ...recording.toObject(),
          classTitle: liveClass.title,
          instructorName: liveClass.instructor.name,
          classDate: liveClass.scheduledTime,
        });
      });
    });

    res.json({ recordings });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete live class
router.delete(
  "/:classId",
  authenticateToken,
  requireRole(["instructor"]),
  async (req, res) => {
    try {
      const { classId } = req.params;

      const liveClass = await LiveClass.findOneAndDelete({
        _id: classId,
        instructor: req.user.userId,
      });

      if (!liveClass) {
        return res
          .status(404)
          .json({ message: "Live class not found or unauthorized" });
      }

      res.json({ message: "Live class deleted successfully" });
    } catch (error) {
      console.error("Error deleting live class:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
