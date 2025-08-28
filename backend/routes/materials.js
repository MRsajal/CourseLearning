const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const CourseMaterial = require("../models/CourseMaterial");
const Course = require("../models/Course");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { materialUpload } = require("../middleware/upload");

const router = express.Router();

// Get materials for a specific course
router.get(
  "/courses/:courseId/materials",
  authenticateToken,
  async (req, res) => {
    try {
      const { courseId } = req.params;

      // Check if user has access to this course
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Check if user is instructor of this course, admin, or enrolled student
      const hasAccess =
        course.instructor.toString() === req.user.userId ||
        req.user.role === "admin" ||
        (req.user.role === "student" &&
          course.enrolledStudents.some(
            (enrollment) => enrollment.student.toString() === req.user.userId
          ));

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const materials = await CourseMaterial.find({
        course: courseId,
        isActive: true,
      })
        .populate("uploadedBy", "name")
        .sort({ order: 1, uploadedAt: 1 });

      res.json({
        materials,
        count: materials.length,
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

// Upload course material
router.post(
  "/courses/:courseId/materials",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  materialUpload.single("file"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, description, order } = req.body;

      // Check if course exists and user owns it
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (
        course.instructor.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Determine file type
      let fileType = "document";
      if (req.file.mimetype.includes("pdf")) {
        fileType = "pdf";
      } else if (req.file.mimetype.includes("video")) {
        fileType = "video";
      }

      const material = new CourseMaterial({
        course: courseId,
        title,
        description: description || "",
        type: fileType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.userId,
        order: parseInt(order) || 0,
      });

      await material.save();

      const populatedMaterial = await CourseMaterial.findById(
        material._id
      ).populate("uploadedBy", "name");

      res.status(201).json({
        material: populatedMaterial,
        message: "Material uploaded successfully",
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

// Update course material
router.put(
  "/materials/:materialId",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    try {
      const { materialId } = req.params;
      const { title, description, order } = req.body;

      const material = await CourseMaterial.findById(materialId).populate(
        "course"
      );
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Check if user owns the course
      if (
        material.course.instructor.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      material.title = title || material.title;
      material.description =
        description !== undefined ? description : material.description;
      material.order = order !== undefined ? parseInt(order) : material.order;

      await material.save();

      const updatedMaterial = await CourseMaterial.findById(
        material._id
      ).populate("uploadedBy", "name");

      res.json({
        material: updatedMaterial,
        message: "Material updated successfully",
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

// Delete course material
router.delete(
  "/materials/:materialId",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    try {
      const { materialId } = req.params;

      const material = await CourseMaterial.findById(materialId).populate(
        "course"
      );
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Check if user owns the course
      if (
        material.course.instructor.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Delete the file from filesystem
      if (fs.existsSync(material.filePath)) {
        fs.unlinkSync(material.filePath);
      }

      await CourseMaterial.findByIdAndDelete(materialId);

      res.json({
        message: "Material deleted successfully",
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

// Serve course material files (with access control)
router.get(
  "/materials/:materialId/download",
  async (req, res) => {
    try {
      const { materialId } = req.params;
      
      // Get token from either Authorization header or query parameter
      let token = null;
      const authHeader = req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else if (req.query.token) {
        token = req.query.token;
      }

      if (!token) {
        return res.status(401).json({ message: "Access token required" });
      }

      // Verify token manually since we're not using the middleware
      let user;
      try {
        user = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
      }

      const material = await CourseMaterial.findById(materialId).populate(
        "course"
      );
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Check if user has access to this material
      const course = material.course;
      const hasAccess =
        course.instructor.toString() === user.userId ||
        user.role === "admin" ||
        (user.role === "student" &&
          course.enrolledStudents.some(
            (enrollment) => enrollment.student.toString() === user.userId
          ));

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if file exists
      if (!fs.existsSync(material.filePath)) {
        console.error("File not found at path:", material.filePath);
        return res.status(404).json({ message: "File not found" });
      }

      console.log("Serving file:", material.fileName, "Type:", material.type, "MIME:", material.mimeType);

      // Set appropriate headers for PDF viewing
      if (material.type === "pdf" || material.mimeType === "application/pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${material.fileName}"`
        );
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.setHeader("Accept-Ranges", "bytes");
      } else if (material.type === "video") {
        res.setHeader("Content-Type", material.mimeType);
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${material.fileName}"`
        );
        res.setHeader("Accept-Ranges", "bytes");
      } else {
        // For other document types, offer as download
        res.setHeader("Content-Type", material.mimeType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${material.fileName}"`
        );
      }

      // Get file stats for proper content-length header
      const stat = fs.statSync(material.filePath);
      res.setHeader("Content-Length", stat.size);

      // Stream the file with error handling
      const fileStream = fs.createReadStream(material.filePath);
      
      fileStream.on("error", (err) => {
        console.error("Error streaming file:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error reading file" });
        }
      });

      fileStream.pipe(res);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

module.exports = router;
