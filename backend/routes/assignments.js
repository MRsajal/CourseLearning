const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const User = require("../models/User");
const { authenticateToken, requireRole } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/assignments");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create new assignment (Instructor only)
router.post("/create", authenticateToken, requireRole(["instructor"]), async (req, res) => {
  try {
    const { title, description, courseId, dueDate, allowedTypes, instructions, points } = req.body;
    const instructorId = req.user.userId; // Fixed: use userId instead of id

    // Verify instructor owns the course
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ error: "You are not authorized to create assignments for this course" });
    }

    const assignment = new Assignment({
      title,
      description,
      course: courseId,
      instructor: instructorId,
      dueDate: new Date(dueDate),
      allowedTypes: allowedTypes || ["text", "pdf"],
      instructions: instructions || "",
      points: points || 100,
    });

    await assignment.save();
    await assignment.populate("course", "title");
    
    res.status(201).json({
      message: "Assignment created successfully",
      assignment
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// Get assignments for a course (Instructor and enrolled students)
router.get("/course/:courseId", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId; // Fixed: use userId instead of id

    // Check if user is instructor or enrolled student
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const isInstructor = course.instructor.toString() === userId;
    const isEnrolled = course.enrolledStudents.some(student => 
      student.student.toString() === userId
    );

    if (!isInstructor && !isEnrolled) {
      return res.status(403).json({ error: "Access denied" });
    }

    const assignments = await Assignment.find({ course: courseId, isActive: true })
      .populate("instructor", "name")
      .sort({ dueDate: 1 });

    // If student, add submission status to each assignment
    if (!isInstructor) {
      const assignmentsWithStatus = assignments.map(assignment => {
        const submission = assignment.getStudentSubmission(userId);
        return {
          ...assignment.toObject(),
          hasSubmitted: !!submission,
          submission: submission || null,
          isOverdue: assignment.isOverdue
        };
      });
      return res.json(assignmentsWithStatus);
    }

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Get instructor's assignments across all courses
router.get("/instructor", authenticateToken, requireRole(["instructor"]), async (req, res) => {
  try {
    const instructorId = req.user.userId;

    const assignments = await Assignment.find({ instructor: instructorId })
      .populate("course", "title")
      .sort({ createdAt: -1 });

    const assignmentsWithStats = assignments.map(assignment => ({
      ...assignment.toObject(),
      submissionCount: assignment.submissionCount,
      totalStudents: assignment.course ? assignment.course.enrolledStudents.length : 0
    }));

    res.json(assignmentsWithStats);
  } catch (error) {
    console.error("Error fetching instructor assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Submit assignment (Student only)
router.post("/:assignmentId/submit", authenticateToken, requireRole(["student"]), upload.single("file"), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { submissionType, textContent } = req.body;
    const studentId = req.user.userId;

    const assignment = await Assignment.findById(assignmentId).populate("course");
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Check if student is enrolled in the course
    const isEnrolled = assignment.course.enrolledStudents.some(student => 
      student.student.toString() === studentId
    );
    if (!isEnrolled) {
      return res.status(403).json({ error: "You are not enrolled in this course" });
    }

    // Check if assignment allows this submission type
    if (!assignment.allowedTypes.includes(submissionType)) {
      return res.status(400).json({ error: "This submission type is not allowed for this assignment" });
    }

    // Check if student has already submitted
    if (assignment.hasStudentSubmitted(studentId)) {
      return res.status(400).json({ error: "You have already submitted this assignment" });
    }

    const submission = {
      student: studentId,
      submissionType,
      submittedAt: new Date()
    };

    if (submissionType === "text") {
      if (!textContent) {
        return res.status(400).json({ error: "Text content is required for text submissions" });
      }
      submission.textContent = textContent;
    } else if (submissionType === "pdf") {
      if (!req.file) {
        return res.status(400).json({ error: "PDF file is required for PDF submissions" });
      }
      submission.fileUrl = req.file.path;
      submission.fileName = req.file.originalname;
    }

    assignment.submissions.push(submission);
    await assignment.save();

    res.json({
      message: "Assignment submitted successfully",
      submission
    });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size too large. Maximum size is 10MB" });
    }
    res.status(500).json({ error: "Failed to submit assignment" });
  }
});

// Grade assignment submission (Instructor only)
router.put("/:assignmentId/grade/:submissionId", authenticateToken, requireRole(["instructor"]), async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body;
    const instructorId = req.user.userId;

    const assignment = await Assignment.findOne({ 
      _id: assignmentId, 
      instructor: instructorId 
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found or you are not authorized" });
    }

    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    submission.grade = grade;
    submission.feedback = feedback || "";
    submission.isGraded = true;
    submission.gradedAt = new Date();
    submission.gradedBy = instructorId;

    await assignment.save();

    res.json({
      message: "Assignment graded successfully",
      submission
    });
  } catch (error) {
    console.error("Error grading assignment:", error);
    res.status(500).json({ error: "Failed to grade assignment" });
  }
});

// Get assignment details with submissions (Instructor only)
router.get("/:assignmentId/submissions", authenticateToken, requireRole(["instructor"]), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const instructorId = req.user.userId;

    const assignment = await Assignment.findOne({ 
      _id: assignmentId, 
      instructor: instructorId 
    })
    .populate("submissions.student", "name email")
    .populate("course", "title enrolledStudents");

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found or you are not authorized" });
    }

    res.json({
      assignment,
      totalStudents: assignment.course.enrolledStudents.length,
      submissionCount: assignment.submissions.length,
      pendingCount: assignment.course.enrolledStudents.length - assignment.submissions.length
    });
  } catch (error) {
    console.error("Error fetching assignment submissions:", error);
    res.status(500).json({ error: "Failed to fetch assignment submissions" });
  }
});

// Download submitted file (Instructor only)
router.get("/:assignmentId/download/:submissionId", authenticateToken, requireRole(["instructor"]), async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const instructorId = req.user.userId;

    const assignment = await Assignment.findOne({ 
      _id: assignmentId, 
      instructor: instructorId 
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found or you are not authorized" });
    }

    const submission = assignment.submissions.id(submissionId);
    if (!submission || !submission.fileUrl) {
      return res.status(404).json({ error: "File not found" });
    }

    if (!fs.existsSync(submission.fileUrl)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(submission.fileUrl, submission.fileName);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

// Delete assignment (Instructor only)
router.delete("/:assignmentId", authenticateToken, requireRole(["instructor"]), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const instructorId = req.user.userId;

    const assignment = await Assignment.findOne({ 
      _id: assignmentId, 
      instructor: instructorId 
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found or you are not authorized" });
    }

    // Soft delete - just mark as inactive
    assignment.isActive = false;
    await assignment.save();

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

module.exports = router;
