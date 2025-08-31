const express = require("express");
const Course = require("../models/Course");
const User = require("../models/User");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { thumbnailUpload } = require("../middleware/upload");
const { staticCourses } = require("../data/staticCourses");

const router = express.Router();

// Get all published courses (public) - combines database + static courses
router.get("/courses", async (req, res) => {
  try {
    const { category, level, search } = req.query;
    let filter = { isPublished: true };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (level && level !== "all") {
      filter.level = level;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Get database courses
    const dbCourses = await Course.find(filter)
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });

    // Format database courses
    const formattedDbCourses = dbCourses.map(course => {
      const courseObj = course.toObject();
      if (!courseObj.instructorName && courseObj.instructor) {
        courseObj.instructorName = courseObj.instructor.name;
      }
      // Convert enrolledStudents array to count for frontend consistency
      if (Array.isArray(courseObj.enrolledStudents)) {
        courseObj.enrolledStudents = courseObj.enrolledStudents.length;
      }
      return courseObj;
    });

    // Filter static courses based on query parameters
    let filteredStaticCourses = [...staticCourses];
    
    if (category && category !== "all") {
      filteredStaticCourses = filteredStaticCourses.filter(course => course.category === category);
    }
    
    if (level && level !== "all") {
      filteredStaticCourses = filteredStaticCourses.filter(course => course.level === level);
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredStaticCourses = filteredStaticCourses.filter(course => 
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.instructorName.toLowerCase().includes(searchTerm)
      );
    }

    // Combine both sources - database courses first, then static courses
    const allCourses = [...formattedDbCourses, ...filteredStaticCourses];

    res.json({
      courses: allCourses,
      count: allCourses.length,
      dbCount: formattedDbCourses.length,
      staticCount: filteredStaticCourses.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get single course
router.get("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email")
      .populate("enrolledStudents.student", "name email");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      course,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Create course (instructors only)
router.post(
  "/courses",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  thumbnailUpload.single("thumbnail"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        level,
        duration,
        price,
        maxStudents,
      } = req.body;

      const instructorData = await User.findById(req.user.userId);

      const course = new Course({
        title,
        description,
        instructor: req.user.userId,
        instructorName: instructorData.name,
        category,
        level,
        duration,
        price: parseFloat(price),
        maxStudents: parseInt(maxStudents) || 100,
        thumbnail: req.file ? `/uploads/thumbnails/${req.file.filename}` : "",
      });

      await course.save();

      const populatedCourse = await Course.findById(course._id).populate(
        "instructor",
        "name email"
      );

      res.status(201).json({
        course: populatedCourse,
        message: "Course created successfully",
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

// Get instructor's courses
router.get(
  "/instructor/courses",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    try {
      const courses = await Course.find({ instructor: req.user.userId })
        .populate("enrolledStudents.student", "name email")
        .sort({ createdAt: -1 });

      res.json({
        courses,
        count: courses.length,
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

// Update course
router.put(
  "/courses/:id",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  thumbnailUpload.single("thumbnail"),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if user owns the course or is admin
      if (
        course.instructor.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = { ...req.body };
      if (req.file) {
        updateData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).populate("instructor", "name email");

      res.json({
        course: updatedCourse,
        message: "Course updated successfully",
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

// Publish/Unpublish course
router.patch(
  "/courses/:id/publish",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (
        course.instructor.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      course.isPublished = !course.isPublished;
      await course.save();

      res.json({
        message: `Course ${
          course.isPublished ? "published" : "unpublished"
        } successfully`,
        course,
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

// Enroll in course (students only)
router.post(
  "/courses/:id/enroll",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (!course.isPublished) {
        return res.status(400).json({ message: "Course is not published" });
      }

      // Check if already enrolled
      const alreadyEnrolled = course.enrolledStudents.some(
        (enrollment) => enrollment.student.toString() === req.user.userId
      );

      if (alreadyEnrolled) {
        return res
          .status(400)
          .json({ message: "Already enrolled in this course" });
      }

      // Check if course is full
      if (course.enrolledStudents.length >= course.maxStudents) {
        return res.status(400).json({ message: "Course is full" });
      }

      course.enrolledStudents.push({
        student: req.user.userId,
        enrolledAt: new Date(),
      });

      await course.save();

      res.json({
        message: "Successfully enrolled in course",
        course,
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

// Get student's enrolled courses
router.get(
  "/student/courses",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const courses = await Course.find({
        "enrolledStudents.student": req.user.userId,
      }).populate("instructor", "name email");

      // Get progress for each course
      const coursesWithProgress = await Promise.all(
        courses.map(async (course) => {
          const courseObj = course.toObject();
          
          // Ensure instructorName is available
          if (!courseObj.instructorName && courseObj.instructor) {
            courseObj.instructorName = courseObj.instructor.name;
          }

          // Get student progress for this course
          const StudentProgress = require("../models/StudentProgress");
          const CourseMaterial = require("../models/CourseMaterial");
          
          let progress = await StudentProgress.findOne({
            student: req.user.userId,
            course: course._id,
          });

          if (!progress) {
            // Create progress record if it doesn't exist
            progress = new StudentProgress({
              student: req.user.userId,
              course: course._id,
            });
            await progress.save();
          }

          // Get total materials count for this course
          const totalMaterials = await CourseMaterial.countDocuments({
            course: course._id,
            isActive: true,
          });

          // Update progress calculation
          await progress.updateProgress();
          await progress.save();

          // Add progress information to course object
          courseObj.progressPercentage = progress.progressPercentage || 0;
          courseObj.totalTimeSpent = progress.totalTimeSpent || 0;
          courseObj.completedMaterials = progress.completedMaterials.length;
          courseObj.totalMaterials = totalMaterials;
          courseObj.lastAccessedAt = progress.lastAccessedAt;

          return courseObj;
        })
      );

      res.json({
        courses: coursesWithProgress,
        count: coursesWithProgress.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching student courses:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Delete course
router.delete(
  "/courses/:id",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (
        course.instructor.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      await Course.findByIdAndDelete(req.params.id);
      res.json({
        message: "Course deleted successfully",
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
