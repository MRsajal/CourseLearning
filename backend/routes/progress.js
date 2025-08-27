const express = require("express");
const StudentProgress = require("../models/StudentProgress");
const CourseMaterial = require("../models/CourseMaterial");
const Course = require("../models/Course");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get student progress for a specific course
router.get(
  "/courses/:courseId/progress",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const { courseId } = req.params;

      // Check if student is enrolled in the course
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const isEnrolled = course.enrolledStudents.some(
        (enrollment) => enrollment.student.toString() === req.user.userId
      );

      if (!isEnrolled) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this course" });
      }

      // Get or create progress record
      let progress = await StudentProgress.findOne({
        student: req.user.userId,
        course: courseId,
      }).populate("completedMaterials.material");

      if (!progress) {
        progress = new StudentProgress({
          student: req.user.userId,
          course: courseId,
        });
        await progress.save();
      }

      // Calculate current progress
      await progress.calculateProgress();
      await progress.save();

      res.json({
        progress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Mark material as completed
router.post(
  "/materials/:materialId/complete",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const { materialId } = req.params;
      const { timeSpent = 0 } = req.body; // time spent in minutes

      const material = await CourseMaterial.findById(materialId).populate(
        "course"
      );
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Check if student is enrolled in the course
      const course = material.course;
      const isEnrolled = course.enrolledStudents.some(
        (enrollment) => enrollment.student.toString() === req.user.userId
      );

      if (!isEnrolled) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this course" });
      }

      // Get or create progress record
      let progress = await StudentProgress.findOne({
        student: req.user.userId,
        course: course._id,
      });

      if (!progress) {
        progress = new StudentProgress({
          student: req.user.userId,
          course: course._id,
        });
      }

      // Check if material is already completed
      const existingCompletion = progress.completedMaterials.find(
        (completion) => completion.material.toString() === materialId
      );

      if (!existingCompletion) {
        // Add to completed materials
        progress.completedMaterials.push({
          material: materialId,
          completedAt: new Date(),
          timeSpent: timeSpent,
        });

        progress.totalTimeSpent += timeSpent;
      }

      progress.lastAccessedAt = new Date();

      // Calculate and update progress percentage
      await progress.calculateProgress();
      await progress.save();

      const populatedProgress = await StudentProgress.findById(
        progress._id
      ).populate("completedMaterials.material");

      res.json({
        message: "Material marked as completed",
        progress: populatedProgress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Mark material as incomplete (undo completion)
router.delete(
  "/materials/:materialId/complete",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const { materialId } = req.params;

      const material = await CourseMaterial.findById(materialId).populate(
        "course"
      );
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      const progress = await StudentProgress.findOne({
        student: req.user.userId,
        course: material.course._id,
      });

      if (!progress) {
        return res.status(404).json({ message: "Progress record not found" });
      }

      // Find and remove the completion
      const completionIndex = progress.completedMaterials.findIndex(
        (completion) => completion.material.toString() === materialId
      );

      if (completionIndex !== -1) {
        const completion = progress.completedMaterials[completionIndex];
        progress.totalTimeSpent -= completion.timeSpent || 0;
        progress.completedMaterials.splice(completionIndex, 1);

        progress.lastAccessedAt = new Date();

        // Recalculate progress percentage
        await progress.calculateProgress();
        await progress.save();
      }

      const populatedProgress = await StudentProgress.findById(
        progress._id
      ).populate("completedMaterials.material");

      res.json({
        message: "Material completion removed",
        progress: populatedProgress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Get course materials with completion status for student
router.get(
  "/courses/:courseId/learn",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const { courseId } = req.params;

      // Check if student is enrolled in the course
      const course = await Course.findById(courseId).populate("instructor", "name email");
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Ensure instructorName is available
      const courseObj = course.toObject();
      if (!courseObj.instructorName && courseObj.instructor) {
        courseObj.instructorName = courseObj.instructor.name;
      }

      const isEnrolled = course.enrolledStudents.some(
        (enrollment) => enrollment.student.toString() === req.user.userId
      );

      if (!isEnrolled) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this course" });
      }

      // Get course materials
      const materials = await CourseMaterial.find({
        course: courseId,
        isActive: true,
      })
        .populate("uploadedBy", "name")
        .sort({ order: 1, uploadedAt: 1 });

      // Get student progress
      let progress = await StudentProgress.findOne({
        student: req.user.userId,
        course: courseId,
      }).populate("completedMaterials.material");

      if (!progress) {
        progress = new StudentProgress({
          student: req.user.userId,
          course: courseId,
        });
        await progress.save();
      }

      // Add completion status to materials
      const materialsWithProgress = materials.map((material) => {
        const completion = progress.completedMaterials.find(
          (comp) =>
            comp.material &&
            comp.material._id.toString() === material._id.toString()
        );

        return {
          ...material.toObject(),
          isCompleted: !!completion,
          completedAt: completion ? completion.completedAt : null,
          timeSpent: completion ? completion.timeSpent : 0,
        };
      });

      // Update progress calculation
      await progress.updateProgress();
      await progress.save();

      res.json({
        course: courseObj,
        materials: materialsWithProgress,
        progress: {
          progressPercentage: progress.progressPercentage,
          totalTimeSpent: progress.totalTimeSpent,
          completedMaterials: progress.completedMaterials.length,
          totalMaterials: materials.length,
          lastAccessedAt: progress.lastAccessedAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

module.exports = router;
