const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload directories if they don't exist
const uploadDirs = [
  "uploads/thumbnails",
  "uploads/materials/pdfs",
  "uploads/materials/videos",
  "uploads/materials/documents",
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

module.exports = {
  thumbnailUpload,
  materialUpload,
};
