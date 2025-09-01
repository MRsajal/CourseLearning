const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Course = require("../models/Course");
const StudentProgress = require("../models/StudentProgress");

// Get platform statistics
router.get("/stats/platform", async (req, res) => {
  try {
    // Count total users by role
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalInstructors = await User.countDocuments({ role: "instructor" });
    
    // Count total courses
    const totalCourses = await Course.countDocuments();
    
    // Calculate total hours from all courses
    const courses = await Course.find({}, 'duration');
    const totalHours = courses.reduce((total, course) => {
      // Assuming duration is stored in minutes, convert to hours
      const durationInHours = course.duration ? Math.round(course.duration / 60) : 0;
      return total + durationInHours;
    }, 0);

    // If no courses in database, add some default hours
    const finalTotalHours = totalHours > 0 ? totalHours : 10000;

    // Add predefined course count to total courses (6 predefined courses)
    const predefinedCoursesCount = 6;
    const finalTotalCourses = totalCourses + predefinedCoursesCount;

    res.json({
      totalStudents,
      totalInstructors,
      totalCourses: finalTotalCourses,
      totalHours: finalTotalHours,
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    res.status(500).json({ 
      error: "Failed to fetch platform statistics",
      totalStudents: 2500,
      totalInstructors: 85,
      totalCourses: 150,
      totalHours: 10000,
    });
  }
});

// Get course statistics
router.get("/stats/courses", async (req, res) => {
  try {
    const courseStats = await Course.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          averagePrice: { $avg: "$price" },
          totalEnrolled: { $sum: { $size: "$enrolledStudents" } }
        }
      }
    ]);

    res.json(courseStats);
  } catch (error) {
    console.error("Error fetching course stats:", error);
    res.status(500).json({ error: "Failed to fetch course statistics" });
  }
});

// Get enrollment statistics
router.get("/stats/enrollments", async (req, res) => {
  try {
    const enrollmentStats = await StudentProgress.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$enrolledAt" },
            month: { $month: "$enrolledAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    res.json(enrollmentStats);
  } catch (error) {
    console.error("Error fetching enrollment stats:", error);
    res.status(500).json({ error: "Failed to fetch enrollment statistics" });
  }
});

module.exports = router;
