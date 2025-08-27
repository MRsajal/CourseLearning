const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve uploaded files

// MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/mern_auth",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Import Models
const User = require("./User");
const Course = require("./Course");
const CourseMaterial = require("./CourseMaterial");

// Create upload directories if they don't exist
const uploadDirs = [
  "uploads/thumbnails",
  "uploads/materials/pdfs",
  "uploads/materials/videos",
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for thumbnails
const thumbnailStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/thumbnails/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    );
  },
});

const thumbnailUpload = multer({
  storage: thumbnailStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Multer configuration for course materials
const materialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "uploads/materials/";

    if (file.mimetype.includes("pdf")) {
      uploadPath += "pdfs/";
    } else if (file.mimetype.includes("video")) {
      uploadPath += "videos/";
    } else {
      uploadPath += "documents/";
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Keep original filename with timestamp prefix
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, timestamp + "-" + cleanName);
  },
});

const materialUpload = multer({
  storage: materialStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = {
      "application/pdf": "pdf",
      "video/mp4": "video",
      "video/mpeg": "video",
      "video/quicktime": "video",
      "video/x-msvideo": "video",
      "video/x-ms-wmv": "video",
      "application/msword": "document",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "document",
      "text/plain": "document",
    };

    if (allowedTypes[file.mimetype]) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "File type not allowed. Only PDF, video files, and documents are permitted."
        )
      );
    }
  },
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret",
    (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = user;
      next();
    }
  );
};

// Role-based middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

// Existing auth routes (login, register, profile)
// Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// EXISTING COURSE ROUTES (keep all your existing course routes here)
// ... (all your existing course routes)

// COURSE MATERIALS ROUTES

// Get materials for a specific course
app.get(
  "/api/courses/:courseId/materials",
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

      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Upload course material
app.post(
  "/api/courses/:courseId/materials",
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

      res.status(201).json(populatedMaterial);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Update course material
app.put(
  "/api/materials/:materialId",
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

      res.json(updatedMaterial);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Delete course material
app.delete(
  "/api/materials/:materialId",
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

      res.json({ message: "Material deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Serve course material files (with access control)
app.get(
  "/api/materials/:materialId/download",
  authenticateToken,
  async (req, res) => {
    try {
      const { materialId } = req.params;

      const material = await CourseMaterial.findById(materialId).populate(
        "course"
      );
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Check if user has access to this material
      const course = material.course;
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

      // Check if file exists
      if (!fs.existsSync(material.filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Set appropriate headers
      res.setHeader("Content-Type", material.mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${material.fileName}"`
      );

      // Stream the file
      const fileStream = fs.createReadStream(material.filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// EXISTING COURSE ROUTES - Add these back from your previous code
app.get("/api/courses", async (req, res) => {
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

    const courses = await Course.find(filter)
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create course (instructors only)
app.post(
  "/api/courses",
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

      res.status(201).json(populatedCourse);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Enroll in course (students only)
app.post(
  "/api/courses/:id/enroll",
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

      res.json({ message: "Successfully enrolled in course", course });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Get student's enrolled courses
app.get(
  "/api/student/courses",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const courses = await Course.find({
        "enrolledStudents.student": req.user.userId,
      }).populate("instructor", "name email");

      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Get instructor's courses
app.get(
  "/api/instructor/courses",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    try {
      const courses = await Course.find({ instructor: req.user.userId })
        .populate("enrolledStudents.student", "name email")
        .sort({ createdAt: -1 });

      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
