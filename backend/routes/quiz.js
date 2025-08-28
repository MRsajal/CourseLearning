const express = require("express");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Certificate = require("../models/Certificate");
const Course = require("../models/Course");
const StudentProgress = require("../models/StudentProgress");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Create quiz (instructors only)
router.post(
  "/courses/:courseId/quiz",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const {
        title,
        description,
        instructions,
        questions,
        timeLimit,
        passingScore,
        maxAttempts,
        isFinalQuiz,
      } = req.body;

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

      // If this is a final quiz, make sure there's no existing final quiz
      if (isFinalQuiz) {
        const existingFinalQuiz = await Quiz.findOne({
          course: courseId,
          isFinalQuiz: true,
          isActive: true,
        });
        if (existingFinalQuiz) {
          return res
            .status(400)
            .json({ message: "A final quiz already exists for this course" });
        }
      }

      const quiz = new Quiz({
        course: courseId,
        title,
        description,
        instructions,
        questions,
        timeLimit: parseInt(timeLimit) || 60,
        passingScore: parseInt(passingScore) || 70,
        maxAttempts: parseInt(maxAttempts) || 3,
        isFinalQuiz: !!isFinalQuiz,
        createdBy: req.user.userId,
      });

      await quiz.save();

      const populatedQuiz = await Quiz.findById(quiz._id)
        .populate("course", "title")
        .populate("createdBy", "name");

      res.status(201).json({
        quiz: populatedQuiz,
        message: "Quiz created successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Get course quizzes
router.get(
  "/courses/:courseId/quizzes",
  authenticateToken,
  async (req, res) => {
    try {
      const { courseId } = req.params;

      // Check course access
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

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

      let quizzes;
      if (req.user.role === "student") {
        // Students only see active quizzes without correct answers
        quizzes = await Quiz.find({ course: courseId, isActive: true })
          .select("-questions.correctAnswer -questions.options.isCorrect")
          .sort({ isFinalQuiz: 1, createdAt: 1 });
      } else {
        // Instructors see all quizzes with full details
        quizzes = await Quiz.find({ course: courseId }).sort({
          isFinalQuiz: 1,
          createdAt: 1,
        });
      }

      res.json({
        quizzes,
        count: quizzes.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

router.get(
  "/certificate/:certificateId/pdf",
  authenticateToken,
  async (req, res) => {
    try {
      const { certificateId } = req.params;

      const certificate = await Certificate.findOne({
        certificateId: certificateId,
        isValid: true,
      })
        .populate("course", "title")
        .populate("quiz", "title")
        .populate("student", "name");

      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      // Check if user has access to this certificate
      if (
        certificate.student._id.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate PDF certificate HTML
      const certificateHTML = generateCertificateHTML(certificate);

      // Set headers for PDF download
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
  }
);

// Get quiz for taking (students)
router.get(
  "/quizzes/:id/take",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const quiz = await Quiz.findById(id).populate("course");
      if (!quiz || !quiz.isActive) {
        return res.status(404).json({ message: "Quiz not found or inactive" });
      }

      // Check if student is enrolled
      const isEnrolled = quiz.course.enrolledStudents.some(
        (enrollment) => enrollment.student.toString() === req.user.userId
      );

      if (!isEnrolled) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this course" });
      }

      // Check previous attempts
      const attemptCount = await QuizAttempt.countDocuments({
        quiz: id,
        student: req.user.userId,
      });

      if (attemptCount >= quiz.maxAttempts) {
        return res.status(400).json({ message: "Maximum attempts reached" });
      }

      // Return quiz without correct answers
      const quizForStudent = {
        ...quiz.toObject(),
        questions: quiz.questions.map((q) => ({
          _id: q._id,
          question: q.question,
          type: q.type,
          options: q.options
            ? q.options.map((opt) => ({ text: opt.text }))
            : undefined,
          points: q.points,
        })),
      };

      res.json({
        quiz: quizForStudent,
        attemptNumber: attemptCount + 1,
        remainingAttempts: quiz.maxAttempts - attemptCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error getting quiz for taking:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Submit quiz attempt
router.post(
  "/quizzes/:id/submit",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { answers, timeSpent, startedAt } = req.body;

      const quiz = await Quiz.findById(id).populate("course");
      if (!quiz || !quiz.isActive) {
        return res.status(404).json({ message: "Quiz not found or inactive" });
      }

      // Check enrollment
      const isEnrolled = quiz.course.enrolledStudents.some(
        (enrollment) => enrollment.student.toString() === req.user.userId
      );

      if (!isEnrolled) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this course" });
      }

      // Check attempts
      const attemptCount = await QuizAttempt.countDocuments({
        quiz: id,
        student: req.user.userId,
      });

      if (attemptCount >= quiz.maxAttempts) {
        return res.status(400).json({ message: "Maximum attempts reached" });
      }

      // Grade the quiz (existing grading logic)
      let pointsEarned = 0;
      const gradedAnswers = [];

      for (const answer of answers) {
        const question = quiz.questions.id(answer.questionId);
        if (!question) continue;

        let isCorrect = false;
        let points = 0;

        if (question.type === "multiple-choice") {
          const selectedOption = question.options.find(
            (opt) => opt.text === answer.answer
          );
          isCorrect = selectedOption && selectedOption.isCorrect;
        } else if (question.type === "true-false") {
          isCorrect =
            answer.answer.toString().toLowerCase() ===
            question.correctAnswer.toLowerCase();
        } else if (question.type === "short-answer") {
          isCorrect =
            answer.answer.toLowerCase().trim() ===
            question.correctAnswer.toLowerCase().trim();
        }

        if (isCorrect) {
          points = question.points;
          pointsEarned += points;
        }

        gradedAnswers.push({
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect,
          pointsEarned: points,
        });
      }

      const totalPoints = quiz.getTotalPoints();
      const percentage =
        totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;
      const isPassed = percentage >= quiz.passingScore;

      // Create quiz attempt
      const quizAttempt = new QuizAttempt({
        quiz: id,
        student: req.user.userId,
        course: quiz.course._id,
        answers: gradedAnswers,
        score: percentage,
        percentage,
        totalPoints,
        pointsEarned,
        isPassed,
        timeSpent: timeSpent || 0,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        completedAt: new Date(),
        attemptNumber: attemptCount + 1,
      });

      await quizAttempt.save();

      // ONLY generate certificate if this is a final quiz AND student passed
      let certificate = null;
      if (quiz.isFinalQuiz && isPassed) {
        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
          student: req.user.userId,
          course: quiz.course._id,
        });

        if (!existingCertificate) {
          const User = require("../models/User");
          const student = await User.findById(req.user.userId);

          // Get instructor name
          let instructorName = quiz.course.instructorName;
          if (!instructorName) {
            const instructor = await User.findById(quiz.course.instructor);
            instructorName = instructor ? instructor.name : "Unknown Instructor";
          }

          certificate = new Certificate({
            student: req.user.userId,
            course: quiz.course._id,
            quiz: id,
            quizAttempt: quizAttempt._id,
            studentName: student.name,
            courseName: quiz.course.title,
            instructorName: instructorName,
            finalScore: percentage,
            courseProgress: 100, // Set to 100% since they completed the final quiz
          });

          await certificate.save();
        } else {
          certificate = existingCertificate;
        }
      }

      res.json({
        attempt: quizAttempt,
        certificate: certificate,
        message: isPassed
          ? quiz.isFinalQuiz
            ? "Congratulations! You passed the final quiz and earned a certificate!"
            : "Congratulations! You passed the quiz!"
          : "Quiz completed. You can try again if attempts remain.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);
// Get quiz results
router.get("/quizzes/:id/results", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id).populate("course");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    let results;

    if (req.user.role === "student") {
      // Students can only see their own results
      results = await QuizAttempt.find({
        quiz: id,
        student: req.user.userId,
      }).sort({ attemptNumber: -1 });
    } else {
      // Instructors can see all results
      const hasAccess =
        quiz.course.instructor.toString() === req.user.userId ||
        req.user.role === "admin";

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      results = await QuizAttempt.find({ quiz: id })
        .populate("student", "name email")
        .sort({ completedAt: -1 });
    }

    res.json({
      results,
      quiz: {
        title: quiz.title,
        passingScore: quiz.passingScore,
        totalPoints: quiz.getTotalPoints(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get student's certificate
router.get(
  "/courses/:courseId/certificate",
  authenticateToken,
  requireRole(["student"]),
  async (req, res) => {
    try {
      const { courseId } = req.params;

      const certificate = await Certificate.findOne({
        student: req.user.userId,
        course: courseId,
        isValid: true,
      })
        .populate("course", "title")
        .populate("quiz", "title");

      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
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
  }
);

// Delete quiz (instructors only)
router.delete(
  "/quizzes/:id",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find the quiz and verify ownership
      const quiz = await Quiz.findById(id).populate("course");
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Check if user owns the course or is admin
      if (
        quiz.course.instructor.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if there are any quiz attempts
      const attemptCount = await QuizAttempt.countDocuments({ quiz: id });
      if (attemptCount > 0) {
        // If client opted-in, deactivate instead of erroring
        if (req.query.deactivateIfAttempts === "true") {
          quiz.isActive = false;
          await quiz.save();
          return res.json({
            message:
              "Quiz has attempts; it was deactivated instead of deleted.",
            timestamp: new Date().toISOString(),
          });
        }

        return res.status(400).json({
          message:
            "Cannot delete quiz with existing attempts. Consider deactivating it instead.",
        });
      }

      // Delete the quiz
      await Quiz.findByIdAndDelete(id);

      res.json({
        message: "Quiz deleted successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Toggle quiz active status (instructors only)
router.patch(
  "/quizzes/:id/status",
  authenticateToken,
  requireRole(["instructor", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }

      const quiz = await Quiz.findById(id).populate("course");
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      if (
        quiz.course.instructor.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      quiz.isActive = isActive;
      await quiz.save();

      res.json({
        message: `Quiz ${isActive ? "activated" : "deactivated"} successfully`,
        quiz: { id: quiz._id, isActive: quiz.isActive },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating quiz status:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

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

module.exports = router;
