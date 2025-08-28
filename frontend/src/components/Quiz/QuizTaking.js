import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import "../CSS/Quiz.css";

const QuizTaking = ({ user }) => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(new Date());
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState("");
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const fetchQuiz = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/quiz/${quizId}/take`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuiz(response.data.quiz);
      setTimeRemaining(response.data.quiz.timeLimit * 60); // Convert to seconds

      // Initialize answers object
      const initialAnswers = {};
      response.data.quiz.questions.forEach((q) => {
        initialAnswers[q._id] = q.type === "multiple-choice" ? "" : "";
      });
      setAnswers(initialAnswers);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error loading quiz");
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    setSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      const token = localStorage.getItem("token");
      const timeSpent = Math.round((new Date() - startTime) / 60000); // in minutes

      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
        })
      );

      const response = await axios.post(
        `/api/quiz/${quizId}/submit`,
        {
          answers: formattedAnswers,
          timeSpent,
          startedAt: startTime.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResults(response.data);
      setShowResults(true);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error submitting quiz");
      setSubmitting(false);
    }
  }, [submitting, startTime, answers, quizId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  useEffect(() => {
    if (quiz && timeRemaining > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, timeRemaining, handleSubmit, showResults]);

  const downloadCertificate = (certificateId) => {
    const token = localStorage.getItem("token");
    window.open(
      `/api/certificate/${certificateId}/pdf?token=${token}`,
      "_blank"
    );
  };

  const viewCertificate = (certificateId) => {
    navigate(`/certificate/${certificateId}`);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter((answer) => answer !== "").length;
  };

  const getUnansweredQuestions = () => {
    const unanswered = [];
    quiz.questions.forEach((q, index) => {
      if (!answers[q._id] || answers[q._id] === "") {
        unanswered.push(index + 1);
      }
    });
    return unanswered;
  };

  const handleConfirmSubmit = () => {
    const unanswered = getUnansweredQuestions();
    if (unanswered.length > 0) {
      setShowConfirmSubmit(true);
    } else {
      handleSubmit();
    }
  };

  const jumpToQuestion = (questionIndex) => {
    setCurrentQuestion(questionIndex);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading quiz...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <div className="error-text">
          Quiz not found or you don't have access.
        </div>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="quiz-results">
        <div className="results-header">
          <h1>Quiz Results</h1>
          <div className="score-display">
            <div className="score-circle">
              <span className="score-number">
                {results.attempt.percentage}%
              </span>
              <span className="score-label">Final Score</span>
            </div>
          </div>
        </div>

        <div className="results-summary">
          <div className="result-card">
            <h3>Performance Summary</h3>
            <div className="summary-stats">
              <div className="stat">
                <strong>Score:</strong> {results.attempt.pointsEarned}/
                {results.attempt.totalPoints} ({results.attempt.percentage}%)
              </div>
              <div className="stat">
                <strong>Status:</strong>
                <span
                  className={`status ${
                    results.attempt.isPassed ? "passed" : "failed"
                  }`}
                >
                  {results.attempt.isPassed ? "PASSED" : "FAILED"}
                </span>
              </div>
              <div className="stat">
                <strong>Time Spent:</strong> {results.attempt.timeSpent} minutes
              </div>
              <div className="stat">
                <strong>Attempt:</strong> {results.attempt.attemptNumber}/
                {quiz.maxAttempts}
              </div>
              {quiz.isFinalQuiz && (
                <div className="stat final-quiz-indicator">
                  <strong>Quiz Type:</strong>
                  <span className="final-quiz-badge">Final Quiz</span>
                </div>
              )}
            </div>
          </div>

          {results.certificate &&
            results.attempt.isPassed &&
            quiz.isFinalQuiz && (
              <div className="certificate-notification">
                <h3>🎉 Congratulations!</h3>
                <p>
                  You have successfully passed the final quiz and earned a
                  certificate!
                </p>
                <p>
                  <strong>Your Score:</strong> {results.attempt.percentage}%
                </p>
                <div className="certificate-actions">
                  <button
                    onClick={() =>
                      downloadCertificate(results.certificate.certificateId)
                    }
                    className="btn-certificate"
                  >
                    📄 Download Certificate
                  </button>
                  <button
                    onClick={() =>
                      viewCertificate(results.certificate.certificateId)
                    }
                    className="btn-certificate-view"
                  >
                    👁️ View Certificate
                  </button>
                </div>
              </div>
            )}

          {quiz.isFinalQuiz && !results.attempt.isPassed && (
            <div className="failed-final-quiz">
              <h3>Final Quiz Not Passed</h3>
              <p>
                You need to score at least {quiz.passingScore}% to earn a
                certificate.
              </p>
              <p>Your score: {results.attempt.percentage}%</p>
              {results.attempt.attemptNumber < quiz.maxAttempts && (
                <p>
                  You have {quiz.maxAttempts - results.attempt.attemptNumber}{" "}
                  attempt(s) remaining.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="results-actions">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Back to Course
          </button>
          {!results.attempt.isPassed &&
            results.attempt.attemptNumber < quiz.maxAttempts && (
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Try Again ({quiz.maxAttempts - results.attempt.attemptNumber}{" "}
                attempts left)
              </button>
            )}
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const unansweredQuestions = getUnansweredQuestions();

  return (
    <div className="quiz-taking">
      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirm Submission</h3>
            <p>You have {unansweredQuestions.length} unanswered question(s):</p>
            <div className="unanswered-list">
              {unansweredQuestions.map((qNum) => (
                <button
                  key={qNum}
                  onClick={() => {
                    jumpToQuestion(qNum - 1);
                    setShowConfirmSubmit(false);
                  }}
                  className="unanswered-question-btn"
                >
                  Question {qNum}
                </button>
              ))}
            </div>
            <p>Are you sure you want to submit your quiz?</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="btn-secondary"
              >
                Review Answers
              </button>
              <button onClick={handleSubmit} className="btn-primary">
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="quiz-header">
        <div className="quiz-info">
          <h1>{quiz.title}</h1>
          <p>{quiz.description}</p>
          {quiz.isFinalQuiz && (
            <div className="final-quiz-notice">
              <span className="final-quiz-badge">Final Quiz</span>
              <span>Complete this quiz to earn your certificate!</span>
            </div>
          )}
        </div>

        <div className="quiz-status">
          <div className="timer">
            <span className="timer-label">Time Remaining:</span>
            <span
              className={`timer-value ${timeRemaining < 300 ? "warning" : ""} ${
                timeRemaining < 60 ? "critical" : ""
              }`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>

          <div className="progress">
            <span>
              {getAnsweredCount()}/{quiz.questions.length} answered
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    (getAnsweredCount() / quiz.questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`message ${
            message.includes("success") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}

      <div className="quiz-content">
        <div className="question-navigation">
          <h3>Questions</h3>
          <div className="question-grid">
            {quiz.questions.map((q, index) => (
              <button
                key={q._id}
                onClick={() => setCurrentQuestion(index)}
                className={`question-nav-btn ${
                  index === currentQuestion ? "active" : ""
                } ${answers[q._id] ? "answered" : ""}`}
                title={`Question ${index + 1} - ${
                  answers[q._id] ? "Answered" : "Not answered"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="quiz-summary">
            <div className="summary-item">
              <span className="summary-label">Total Questions:</span>
              <span className="summary-value">{quiz.questions.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Answered:</span>
              <span className="summary-value">{getAnsweredCount()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Remaining:</span>
              <span className="summary-value">
                {quiz.questions.length - getAnsweredCount()}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Passing Score:</span>
              <span className="summary-value">{quiz.passingScore}%</span>
            </div>
          </div>
        </div>

        <div className="question-panel">
          <div className="question-header">
            <span className="question-number">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <span className="question-points">
              {currentQ.points} point{currentQ.points > 1 ? "s" : ""}
            </span>
          </div>

          <div className="question-content">
            <h3>{currentQ.question}</h3>

            {currentQ.type === "multiple-choice" && (
              <div className="multiple-choice-options">
                {currentQ.options.map((option, index) => (
                  <label key={index} className="option-label">
                    <input
                      type="radio"
                      name={`question-${currentQ._id}`}
                      value={option.text}
                      checked={answers[currentQ._id] === option.text}
                      onChange={(e) =>
                        handleAnswerChange(currentQ._id, e.target.value)
                      }
                    />
                    <span className="option-text">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQ.type === "true-false" && (
              <div className="true-false-options">
                <label className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQ._id}`}
                    value="true"
                    checked={answers[currentQ._id] === "true"}
                    onChange={(e) =>
                      handleAnswerChange(currentQ._id, e.target.value)
                    }
                  />
                  <span className="option-text">True</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQ._id}`}
                    value="false"
                    checked={answers[currentQ._id] === "false"}
                    onChange={(e) =>
                      handleAnswerChange(currentQ._id, e.target.value)
                    }
                  />
                  <span className="option-text">False</span>
                </label>
              </div>
            )}

            {currentQ.type === "short-answer" && (
              <div className="short-answer">
                <textarea
                  value={answers[currentQ._id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentQ._id, e.target.value)
                  }
                  placeholder="Enter your answer here..."
                  rows="4"
                />
                <div className="character-count">
                  {(answers[currentQ._id] || "").length} characters
                </div>
              </div>
            )}
          </div>

          <div className="question-navigation-controls">
            <button
              onClick={() =>
                setCurrentQuestion(Math.max(0, currentQuestion - 1))
              }
              disabled={currentQuestion === 0}
              className="btn-secondary"
            >
              ← Previous
            </button>

            <div className="question-indicator">
              {currentQuestion + 1} / {quiz.questions.length}
            </div>

            <button
              onClick={() =>
                setCurrentQuestion(
                  Math.min(quiz.questions.length - 1, currentQuestion + 1)
                )
              }
              disabled={currentQuestion === quiz.questions.length - 1}
              className="btn-secondary"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <div className="quiz-footer">
        <div className="submission-info">
          <div className="info-section">
            <p>
              <strong>Instructions:</strong> {quiz.instructions}
            </p>
            <p>
              <strong>Passing Score:</strong> {quiz.passingScore}%
            </p>
            <p>
              <strong>Max Attempts:</strong> {quiz.maxAttempts}
            </p>
          </div>

          {unansweredQuestions.length > 0 && (
            <div className="warning-section">
              <p className="warning-text">
                ⚠️ You have {unansweredQuestions.length} unanswered question(s).
                Make sure to answer all questions before submitting.
              </p>
            </div>
          )}
        </div>

        <div className="submit-section">
          <div className="submit-info">
            <span>
              Questions answered: {getAnsweredCount()}/{quiz.questions.length}
            </span>
            {timeRemaining < 300 && (
              <span className="time-warning">
                ⏰ Less than 5 minutes remaining!
              </span>
            )}
          </div>

          <button
            onClick={handleConfirmSubmit}
            disabled={submitting}
            className={`btn-submit ${
              getAnsweredCount() === 0 ? "disabled" : ""
            }`}
          >
            {submitting ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : (
              "Submit Quiz"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizTaking;
