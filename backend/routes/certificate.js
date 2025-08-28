const express = require("express");
const Certificate = require("../models/Certificate");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get certificate by ID
router.get("/:certificateId", authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId)
      .populate("student", "name email")
      .populate("course", "title description")
      .populate("quiz", "title");

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Check if user has access to this certificate
    const hasAccess =
      certificate.student._id.toString() === req.user.userId ||
      req.user.role === "admin";

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      certificate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get certificate PDF (placeholder for now)
router.get("/:certificateId/pdf", authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId)
      .populate("student", "name email")
      .populate("course", "title description")
      .populate("quiz", "title");

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Check if user has access to this certificate
    const hasAccess =
      certificate.student._id.toString() === req.user.userId ||
      req.user.role === "admin";

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // For now, return certificate data as JSON
    // In a real implementation, you would generate a PDF here
    res.json({
      message: "PDF generation not implemented yet",
      certificate: {
        id: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        instructorName: certificate.instructorName,
        completionDate: certificate.completionDate,
        finalScore: certificate.finalScore,
        verificationCode: certificate.verificationCode,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating certificate PDF:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Verify certificate by verification code
router.get("/verify/:verificationCode", async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await Certificate.findOne({
      verificationCode,
      isValid: true,
    })
      .populate("student", "name")
      .populate("course", "title")
      .populate("quiz", "title");

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found or invalid" });
    }

    res.json({
      valid: true,
      certificate: {
        id: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        instructorName: certificate.instructorName,
        completionDate: certificate.completionDate,
        finalScore: certificate.finalScore,
        verificationCode: certificate.verificationCode,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
