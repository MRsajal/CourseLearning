const express = require("express");
const Whiteboard = require("../models/Whiteboard");
const { authenticateToken, requireRole } = require("../middleware/auth");
const router = express.Router();

// Save whiteboard
router.post(
  "/save",
  authenticateToken,
  requireRole(["instructor"]),
  async (req, res) => {
    try {
      const { courseId, imageData, paths } = req.body;

      const whiteboard = await Whiteboard.findOneAndUpdate(
        { course: courseId },
        {
          course: courseId,
          instructor: req.user.userId,
          imageData,
          paths,
          lastModified: new Date(),
        },
        { upsert: true, new: true }
      );

      res.json({
        message: "Whiteboard saved successfully",
        whiteboard,
      });
    } catch (error) {
      console.error("Error saving whiteboard:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Load whiteboard
router.get("/load/:courseId", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const whiteboard = await Whiteboard.findOne({ course: courseId })
      .populate("course", "title")
      .populate("instructor", "name");

    if (!whiteboard) {
      return res.json({ paths: null, imageData: null });
    }

    res.json({
      paths: whiteboard.paths,
      imageData: whiteboard.imageData,
      lastModified: whiteboard.lastModified,
      instructor: whiteboard.instructor.name,
    });
  } catch (error) {
    console.error("Error loading whiteboard:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get whiteboard history
router.get("/history/:courseId", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const whiteboards = await Whiteboard.find({ course: courseId })
      .sort({ lastModified: -1 })
      .populate("instructor", "name")
      .select("-imageData -paths");

    res.json({ whiteboards });
  } catch (error) {
    console.error("Error fetching whiteboard history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete whiteboard
router.delete(
  "/:courseId",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    try {
      const { courseId } = req.params;

      await Whiteboard.findOneAndDelete({ course: courseId });

      res.json({ message: "Whiteboard deleted successfully" });
    } catch (error) {
      console.error("Error deleting whiteboard:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
