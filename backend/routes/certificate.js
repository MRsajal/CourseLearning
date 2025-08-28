const express = require("express");
const Certificate = require("../models/Certificate");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Generate Certificate HTML function
function generateCertificateHTML(certificate) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const completionDate = new Date(
    certificate.completionDate
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Generate praise text based on score
  let praiseText = "";
  if (certificate.finalScore >= 95) {
    praiseText =
      "Outstanding performance! Your exceptional dedication and mastery of the subject matter demonstrate true excellence.";
  } else if (certificate.finalScore >= 85) {
    praiseText =
      "Excellent work! Your strong performance reflects your commitment to learning and understanding.";
  } else if (certificate.finalScore >= 75) {
    praiseText =
      "Great job! Your solid performance shows your determination and effective learning approach.";
  } else {
    praiseText =
      "Well done! Your successful completion demonstrates your perseverance and commitment to learning.";
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Completion - ${certificate.courseName}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        
        body {
            font-family: 'Georgia', serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            width: 297mm;
            height: 210mm;
            position: relative;
            overflow: hidden;
        }
        
        .certificate-container {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .certificate {
            width: 270mm;
            height: 185mm;
            background: white;
            border: 8px solid #89A8B2;
            border-radius: 20px;
            position: relative;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 30mm;
            box-sizing: border-box;
        }
        
        .certificate::before {
            content: '';
            position: absolute;
            top: 15px;
            left: 15px;
            right: 15px;
            bottom: 15px;
            border: 3px solid #B3C8CF;
            border-radius: 15px;
            pointer-events: none;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .logo {
            font-size: 60px;
            color: #89A8B2;
            margin-bottom: 10px;
        }
        
        .title {
            font-size: 48px;
            color: #89A8B2;
            margin: 0;
            letter-spacing: 3px;
            text-transform: uppercase;
            font-weight: bold;
        }
        
        .subtitle {
            font-size: 24px;
            color: #666;
            margin: 10px 0;
            font-style: italic;
        }
        
        .body {
            text-align: center;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin: 20px 0;
        }
        
        .intro-text {
            font-size: 20px;
            color: #666;
            margin-bottom: 15px;
        }
        
        .student-name {
            font-size: 42px;
            color: #89A8B2;
            margin: 15px 0;
            font-weight: bold;
            text-decoration: underline;
            text-decoration-color: #B3C8CF;
            text-underline-offset: 10px;
        }
        
        .course-text {
            font-size: 20px;
            color: #666;
            margin: 15px 0;
        }
        
        .course-name {
            font-size: 32px;
            color: #B3C8CF;
            margin: 15px 0;
            font-weight: bold;
            font-style: italic;
        }
        
        .score-section {
            background: linear-gradient(135deg, #89A8B2, #B3C8CF);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            margin: 20px auto;
            display: inline-block;
            font-size: 24px;
            font-weight: bold;
            box-shadow: 0 5px 15px rgba(137, 168, 178, 0.3);
        }
        
        .praise-text {
            font-size: 18px;
            color: #555;
            margin: 20px auto;
            max-width: 600px;
            line-height: 1.6;
            font-style: italic;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 5px solid #89A8B2;
        }
        
        .footer {
            display: flex;
            justify-content: space-between;
            align-items: end;
            margin-top: 30px;
        }
        
        .signature-section {
            text-align: center;
        }
        
        .signature-line {
            width: 200px;
            height: 3px;
            background: #89A8B2;
            margin-bottom: 10px;
        }
        
        .signature-text {
            font-size: 16px;
            color: #666;
            margin: 5px 0;
        }
        
        .instructor-name {
            font-size: 18px;
            color: #89A8B2;
            font-weight: bold;
        }
        
        .details-section {
            text-align: right;
            font-size: 14px;
            color: #666;
        }
        
        .details-section div {
            margin: 3px 0;
        }
        
        .certificate-id {
            font-weight: bold;
            color: #89A8B2;
        }
        
        .completion-date {
            text-align: center;
            margin-top: 20px;
        }
        
        .date-text {
            font-size: 18px;
            color: #666;
        }
        
        .date-value {
            font-size: 20px;
            color: #89A8B2;
            font-weight: bold;
        }
        
        .decorative-elements {
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            pointer-events: none;
            z-index: 0;
        }
        
        .corner-decoration {
            position: absolute;
            width: 60px;
            height: 60px;
            border: 3px solid #E5E1DA;
        }
        
        .corner-decoration.top-left {
            top: 0;
            left: 0;
            border-right: none;
            border-bottom: none;
        }
        
        .corner-decoration.top-right {
            top: 0;
            right: 0;
            border-left: none;
            border-bottom: none;
        }
        
        .corner-decoration.bottom-left {
            bottom: 0;
            left: 0;
            border-right: none;
            border-top: none;
        }
        
        .corner-decoration.bottom-right {
            bottom: 0;
            right: 0;
            border-left: none;
            border-top: none;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #89A8B2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            z-index: 1000;
        }
        
        .print-button:hover {
            background: #7a96a0;
        }
        
        @media print {
            .print-button {
                display: none;
            }
            
            body {
                background: white;
            }
            
            .certificate {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">📄 Print Certificate</button>
    
    <div class="certificate-container">
        <div class="certificate">
            <div class="decorative-elements">
                <div class="corner-decoration top-left"></div>
                <div class="corner-decoration top-right"></div>
                <div class="corner-decoration bottom-left"></div>
                <div class="corner-decoration bottom-right"></div>
            </div>
            
            <div class="header">
                <div class="logo">🎓</div>
                <h1 class="title">Certificate of Completion</h1>
                <p class="subtitle">Academic Achievement Award</p>
            </div>
            
            <div class="body">
                <p class="intro-text">This is to proudly certify that</p>
                
                <h2 class="student-name">${certificate.studentName}</h2>
                
                <p class="course-text">has successfully completed the course</p>
                
                <h3 class="course-name">"${certificate.courseName}"</h3>
                
                <div class="score-section">
                    Final Quiz Score: ${certificate.finalScore}%
                </div>
                
                <div class="praise-text">
                    ${praiseText}
                </div>
                
                <div class="completion-date">
                    <span class="date-text">Completed on </span>
                    <span class="date-value">${completionDate}</span>
                </div>
            </div>
            
            <div class="footer">
                <div class="signature-section">
                    <div class="signature-line"></div>
                    <p class="signature-text">Instructor Signature</p>
                    <p class="instructor-name">${certificate.instructorName}</p>
                </div>
                
                <div class="details-section">
                    <div class="certificate-id">Certificate ID: ${certificate.certificateId}</div>
                    <div>Verification Code: ${certificate.verificationCode}</div>
                    <div>Issue Date: ${currentDate}</div>
                    <div>Learning Management System</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-print when page loads (optional)
        // window.onload = function() { window.print(); };
    </script>
</body>
</html>`;
}

// Get certificate by ID
router.get("/:certificateId", authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId: certificateId })
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

// Custom middleware to handle token from query parameter for PDF downloads
const authenticateTokenFromQuery = (req, res, next) => {
  const token = req.query.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || "fallback_secret"; // Same as auth middleware
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ message: "Invalid token." });
  }
};

// Get certificate PDF
router.get("/:certificateId/pdf", authenticateTokenFromQuery, async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId: certificateId })
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

    // Generate certificate HTML
    const certificateHTML = generateCertificateHTML(certificate);

    // Set headers for HTML display
    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Certificate-${certificate.certificateId}.html"`
    );

    res.send(certificateHTML);
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
