import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { openBackendUrl } from "../../utils/api";
import "../CSS/QuizManager.css";

const QuizManager = ({ courseId, user, onQuizCreated }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState({});
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    instructions: "Answer all questions to the best of your ability.",
    timeLimit: 60,
    passingScore: 70,
    maxAttempts: 3,
    isFinalQuiz: false,
    questions: [],
  });

  const fetchQuizzes = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/courses/${courseId}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(response.data.quizzes || []);

      // For students, fetch quiz attempts
      if (user?.role === "student") {
        const attempts = {};
        for (const quiz of response.data.quizzes || []) {
          try {
            const attemptResponse = await axios.get(
              `/api/quizzes/${quiz._id}/results`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            attempts[quiz._id] = attemptResponse.data.results || [];
          } catch (error) {
            console.error(
              `Error fetching attempts for quiz ${quiz._id}:`,
              error
            );
            attempts[quiz._id] = [];
          }
        }
        setQuizAttempts(attempts);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setMessage("Failed to load quizzes");
    }
  }, [courseId, user?.role]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const startQuiz = async (quizId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/quizzes/${quizId}/take`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Set the quiz as selected for taking
      setSelectedQuiz({
        ...response.data.quiz,
        currentQuestionIndex: 0,
        answers: {},
        attemptNumber: response.data.attemptNumber,
        remainingAttempts: response.data.remainingAttempts,
      });
    } catch (error) {
      console.error("Error starting quiz:", error);
      setMessage(error.response?.data?.message || "Failed to start quiz");
    }
  };

  const submitAnswer = (questionIndex, answer) => {
    setSelectedQuiz((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [prev.questions[questionIndex]._id]: answer,
      },
    }));
  };

  const submitQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      const answers = Object.entries(selectedQuiz.answers).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
        })
      );

      const response = await axios.post(
        `/api/quizzes/${selectedQuiz._id}/submit`,
        {
          answers,
          timeSpent: 0, // You might want to track actual time spent
          startedAt: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { attempt, certificate, message: resultMessage } = response.data;
      
      // Show result with certificate option if available
      if (certificate) {
        setMessage(`🎉 ${resultMessage} Certificate available for download!`);
      } else if (attempt.isPassed) {
        setMessage(`✅ Congratulations! You passed with ${attempt.percentage}%!`);
      } else {
        setMessage(`Quiz completed. Score: ${attempt.percentage}%. ${resultMessage}`);
      }
      
      setSelectedQuiz(null);
      fetchQuizzes(); // Refresh to get updated attempt data
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setMessage(error.response?.data?.message || "Failed to submit quiz");
    }
  };

  const getBestScore = (quizId) => {
    const attempts = quizAttempts[quizId] || [];
    if (attempts.length === 0) return null;
    return Math.max(...attempts.map((attempt) => attempt.score));
  };

  const getAttemptCount = (quizId) => {
    const attempts = quizAttempts[quizId] || [];
    return attempts.length;
  };

  const canTakeQuiz = (quiz) => {
    const attemptCount = getAttemptCount(quiz._id);
    return attemptCount < quiz.maxAttempts;
  };

  const downloadCertificate = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      
      // First, check if user has a certificate for this course
      const response = await axios.get(`/api/courses/${courseId}/certificate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.certificate) {
        // Try to download using axios with proper headers
        const certificateId = response.data.certificate.certificateId;
        
        try {
          const pdfResponse = await axios.get(`/api/certificate/${certificateId}/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob' // Important for handling binary data
          });
          
          // Create blob URL and download
          const blob = new Blob([pdfResponse.data], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Certificate-${certificateId}.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          setMessage("✅ Certificate downloaded successfully!");
        } catch (pdfError) {
          // Fallback: open in new window with token as query param
          console.log("Fallback to query param method");
          openBackendUrl(`/api/certificate/${certificateId}/pdf`, { token });
        }
      } else {
        setMessage("No certificate available. Complete the final quiz to earn a certificate.");
      }
    } catch (error) {
      console.error("Error downloading certificate:", error);
      setMessage(error.response?.data?.message || "Failed to download certificate");
    }
  };

  const viewCertificate = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      
      // Check if user has a certificate for this course
      const response = await axios.get(`/api/courses/${courseId}/certificate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.certificate) {
        // Navigate to certificate view page (this is a frontend route)
        const certificateId = response.data.certificate.certificateId;
        window.open(`/certificate/${certificateId}`, '_blank');
      } else {
        setMessage("No certificate available. Complete the final quiz to earn a certificate.");
      }
    } catch (error) {
      console.error("Error viewing certificate:", error);
      setMessage(error.response?.data?.message || "Certificate not found");
    }
  };

  const deleteQuiz = async (quizId, quizTitle) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the quiz "${quizTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      // Try server-side auto-deactivate if attempts exist
      const res = await axios.delete(
        `/api/quizzes/${quizId}?deactivateIfAttempts=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(res.data?.message || "Quiz deleted successfully");
      fetchQuizzes();
    } catch (error) {
      const msg = error.response?.data?.message;
      // Fallback: offer manual deactivate when server doesn't support the query param
      if (
        error.response?.status === 400 &&
        msg?.includes("existing attempts")
      ) {
        const confirmDeactivate = window.confirm(
          "This quiz has existing attempts and cannot be deleted. Deactivate it instead so students can no longer take it?"
        );
        if (confirmDeactivate) {
          try {
            await axios.patch(
              `/api/quizzes/${quizId}/status`,
              { isActive: false },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            setMessage("Quiz deactivated");
            fetchQuizzes();
            return;
          } catch (e2) {
            console.error("Error deactivating quiz:", e2);
            setMessage(
              e2.response?.data?.message || "Failed to deactivate quiz"
            );
            return;
          }
        }
      }
      console.error("Error deleting quiz:", error);
      setMessage(msg || "Failed to delete quiz");
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      question: "",
      type: "multiple-choice",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      correctAnswer: "",
      points: 1,
      explanation: "",
    };
    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (index, field, value) => {
    setQuizForm((prev) => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], [field]: value };
      return { ...prev, questions };
    });
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    setQuizForm((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[questionIndex].options];

      if (field === "isCorrect" && value) {
        // Uncheck other options
        options.forEach((opt, idx) => {
          opt.isCorrect = idx === optionIndex;
        });
      } else {
        options[optionIndex] = { ...options[optionIndex], [field]: value };
      }

      questions[questionIndex] = { ...questions[questionIndex], options };
      return { ...prev, questions };
    });
  };

  const addOption = (questionIndex) => {
    setQuizForm((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex].options.push({ text: "", isCorrect: false });
      return { ...prev, questions };
    });
  };

  const removeOption = (questionIndex, optionIndex) => {
    setQuizForm((prev) => {
      const questions = [...prev.questions];
      questions[questionIndex].options.splice(optionIndex, 1);
      return { ...prev, questions };
    });
  };

  const removeQuestion = (index) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/courses/${courseId}/quiz`, quizForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("Quiz created successfully!");
      setShowCreateForm(false);
      setQuizForm({
        title: "",
        description: "",
        instructions: "Answer all questions to the best of your ability.",
        timeLimit: 60,
        passingScore: 70,
        maxAttempts: 3,
        isFinalQuiz: false,
        questions: [],
      });
      fetchQuizzes();
      if (onQuizCreated) onQuizCreated();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  const isInstructor =
    user && (user.role === "instructor" || user.role === "admin");

  // If student is taking a quiz, show the quiz interface
  if (selectedQuiz && user?.role === "student") {
    return (
      <div className="quiz-taking">
        <div className="quiz-header">
          <h2>{selectedQuiz.title}</h2>
          <div className="quiz-meta">
            <span>Time Limit: {selectedQuiz.timeLimit} minutes</span>
            <span>Passing Score: {selectedQuiz.passingScore}%</span>
          </div>
        </div>

        <div className="quiz-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${
                  ((selectedQuiz.currentQuestionIndex + 1) /
                    selectedQuiz.questions.length) *
                  100
                }%`,
              }}
            ></div>
          </div>
          <span>
            Question {selectedQuiz.currentQuestionIndex + 1} of{" "}
            {selectedQuiz.questions.length}
          </span>
        </div>

        <div className="question-container">
          {selectedQuiz.questions.map((question, index) => (
            <div
              key={index}
              className={`question ${
                index === selectedQuiz.currentQuestionIndex
                  ? "active"
                  : "hidden"
              }`}
            >
              <h3>{question.question}</h3>

              {question.type === "multiple-choice" && (
                <div className="options">
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="option-label">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option.text}
                        checked={
                          selectedQuiz.answers[question._id] === option.text
                        }
                        onChange={(e) => submitAnswer(index, e.target.value)}
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === "true-false" && (
                <div className="options">
                  <label className="option-label">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value="true"
                      checked={selectedQuiz.answers[question._id] === "true"}
                      onChange={(e) => submitAnswer(index, e.target.value)}
                    />
                    <span>True</span>
                  </label>
                  <label className="option-label">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value="false"
                      checked={selectedQuiz.answers[question._id] === "false"}
                      onChange={(e) => submitAnswer(index, e.target.value)}
                    />
                    <span>False</span>
                  </label>
                </div>
              )}

              {question.type === "short-answer" && (
                <textarea
                  className="short-answer"
                  value={selectedQuiz.answers[question._id] || ""}
                  onChange={(e) => submitAnswer(index, e.target.value)}
                  placeholder="Enter your answer here..."
                />
              )}
            </div>
          ))}
        </div>

        <div className="quiz-navigation">
          <button
            onClick={() =>
              setSelectedQuiz((prev) => ({
                ...prev,
                currentQuestionIndex: Math.max(
                  0,
                  prev.currentQuestionIndex - 1
                ),
              }))
            }
            disabled={selectedQuiz.currentQuestionIndex === 0}
            className="btn-nav"
          >
            Previous
          </button>

          {selectedQuiz.currentQuestionIndex <
          selectedQuiz.questions.length - 1 ? (
            <button
              onClick={() =>
                setSelectedQuiz((prev) => ({
                  ...prev,
                  currentQuestionIndex: Math.min(
                    prev.questions.length - 1,
                    prev.currentQuestionIndex + 1
                  ),
                }))
              }
              className="btn-nav btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              className="btn-submit"
              disabled={
                Object.keys(selectedQuiz.answers).length <
                selectedQuiz.questions.length
              }
            >
              Submit Quiz
            </button>
          )}
        </div>

        <button onClick={() => setSelectedQuiz(null)} className="btn-cancel">
          Cancel Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-manager">
      <div className="quiz-header">
        <h3>Course Quizzes</h3>
        {isInstructor && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary"
          >
            {showCreateForm ? "Cancel" : "Create Quiz"}
          </button>
        )}
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

      {showCreateForm && isInstructor && (
        <div className="create-quiz-form">
          <h4>Create New Quiz</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Quiz Title *</label>
                <input
                  type="text"
                  id="title"
                  value={quizForm.title}
                  onChange={(e) =>
                    setQuizForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="timeLimit">Time Limit (minutes)</label>
                <input
                  type="number"
                  id="timeLimit"
                  value={quizForm.timeLimit}
                  onChange={(e) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      timeLimit: parseInt(e.target.value),
                    }))
                  }
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={quizForm.description}
                onChange={(e) =>
                  setQuizForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="passingScore">Passing Score (%)</label>
                <input
                  type="number"
                  id="passingScore"
                  value={quizForm.passingScore}
                  onChange={(e) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      passingScore: parseInt(e.target.value),
                    }))
                  }
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxAttempts">Max Attempts</label>
                <input
                  type="number"
                  id="maxAttempts"
                  value={quizForm.maxAttempts}
                  onChange={(e) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      maxAttempts: parseInt(e.target.value),
                    }))
                  }
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={quizForm.isFinalQuiz}
                  onChange={(e) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      isFinalQuiz: e.target.checked,
                    }))
                  }
                />
                <span className="checkbox-label">
                  This is the final quiz (generates certificates)
                </span>
              </label>
            </div>

            <div className="quiz-questions">
              <div className="questions-header">
                <h4>Questions</h4>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="btn-secondary"
                >
                  Add Question
                </button>
              </div>

              {quizForm.questions.map((question, qIndex) => (
                <div key={qIndex} className="question-item">
                  <div className="question-header">
                    <h5>Question {qIndex + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="btn-delete-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Question Text</label>
                    <textarea
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(qIndex, "question", e.target.value)
                      }
                      rows="2"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Question Type</label>
                      <select
                        value={question.type}
                        onChange={(e) =>
                          updateQuestion(qIndex, "type", e.target.value)
                        }
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Points</label>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) =>
                          updateQuestion(
                            qIndex,
                            "points",
                            parseInt(e.target.value)
                          )
                        }
                        min="1"
                      />
                    </div>
                  </div>

                  {question.type === "multiple-choice" && (
                    <div className="options-section">
                      <div className="options-header">
                        <span>Options</span>
                        <button
                          type="button"
                          onClick={() => addOption(qIndex)}
                          className="btn-sm btn-secondary"
                        >
                          Add Option
                        </button>
                      </div>

                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="option-item">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={option.isCorrect}
                            onChange={(e) =>
                              updateOption(
                                qIndex,
                                oIndex,
                                "isCorrect",
                                e.target.checked
                              )
                            }
                          />
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) =>
                              updateOption(
                                qIndex,
                                oIndex,
                                "text",
                                e.target.value
                              )
                            }
                            placeholder="Option text"
                            required
                          />
                          {question.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="btn-delete-sm"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === "true-false" && (
                    <div className="form-group">
                      <label>Correct Answer</label>
                      <select
                        value={question.correctAnswer}
                        onChange={(e) =>
                          updateQuestion(
                            qIndex,
                            "correctAnswer",
                            e.target.value
                          )
                        }
                        required
                      >
                        <option value="">Select correct answer</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </div>
                  )}

                  {question.type === "short-answer" && (
                    <div className="form-group">
                      <label>Correct Answer</label>
                      <input
                        type="text"
                        value={question.correctAnswer}
                        onChange={(e) =>
                          updateQuestion(
                            qIndex,
                            "correctAnswer",
                            e.target.value
                          )
                        }
                        placeholder="Expected answer"
                        required
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Explanation (optional)</label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) =>
                        updateQuestion(qIndex, "explanation", e.target.value)
                      }
                      rows="2"
                      placeholder="Explanation for the correct answer"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading || quizForm.questions.length === 0}
                className="btn-primary"
              >
                {loading ? "Creating Quiz..." : "Create Quiz"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="quizzes-list">
        {quizzes.length === 0 ? (
          <div className="no-quizzes">
            <p>No quizzes available for this course yet.</p>
            {isInstructor && <p>Create your first quiz to get started!</p>}
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz._id} className="quiz-item">
              <div className="quiz-info">
                <h4>
                  {quiz.title}
                  {quiz.isFinalQuiz && (
                    <span className="final-quiz-badge">🏆 Final Quiz</span>
                  )}
                </h4>
                {quiz.description && <p>{quiz.description}</p>}
                <div className="quiz-meta">
                  <span>Questions: {quiz.questions.length}</span>
                  <span>Time Limit: {quiz.timeLimit} min</span>
                  <span>Passing Score: {quiz.passingScore}%</span>
                  <span>Max Attempts: {quiz.maxAttempts}</span>
                </div>

                {user?.role === "student" && (
                  <div className="quiz-stats">
                    <div className="stat">
                      <span>Attempts Used:</span>
                      <strong>
                        {getAttemptCount(quiz._id)} / {quiz.maxAttempts}
                      </strong>
                    </div>
                    {getBestScore(quiz._id) !== null && (
                      <div className="stat">
                        <span>Best Score:</span>
                        <strong 
                          className={getBestScore(quiz._id) >= quiz.passingScore ? "passed-score" : "failed-score"}
                        >
                          {getBestScore(quiz._id)}%
                        </strong>
                      </div>
                    )}
                    {/* Certificate options for final quizzes */}
                    {quiz.isFinalQuiz && getBestScore(quiz._id) >= quiz.passingScore && (
                      <div className="certificate-section">
                        <div className="certificate-status">
                          <span className="certificate-badge">🏆 Certificate Earned!</span>
                          <p className="certificate-text">
                            Congratulations! You've passed the final quiz with {getBestScore(quiz._id)}%.
                          </p>
                        </div>
                        <div className="certificate-actions">
                          <button
                            onClick={() => downloadCertificate(courseId)}
                            className="btn-certificate btn-download"
                            title="Download Certificate as PDF"
                          >
                            📄 Download Certificate
                          </button>
                          <button
                            onClick={() => viewCertificate(courseId)}
                            className="btn-certificate btn-view"
                            title="View Certificate Online"
                          >
                            👁️ View Certificate
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Encouragement for final quiz not yet passed */}
                    {quiz.isFinalQuiz && (getBestScore(quiz._id) === null || getBestScore(quiz._id) < quiz.passingScore) && (
                      <div className="certificate-section">
                        <div className="certificate-encourage">
                          <span className="certificate-badge">🎯 Certificate Available</span>
                          <p className="certificate-text">
                            Pass this final quiz with {quiz.passingScore}% or higher to earn your certificate!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="quiz-actions">
                {user?.role === "student" && (
                  <>
                    {canTakeQuiz(quiz) ? (
                      <button
                        onClick={() => startQuiz(quiz._id)}
                        className="btn-primary"
                      >
                        {getAttemptCount(quiz._id) === 0
                          ? "Start Quiz"
                          : "Retake Quiz"}
                      </button>
                    ) : (
                      <button className="btn-disabled" disabled>
                        No Attempts Remaining
                      </button>
                    )}
                  </>
                )}
                {isInstructor && (
                  <>
                    {/* <button className="btn-secondary">View Results</button>
                    <button className="btn-edit">Edit</button> */}
                    <button
                      onClick={() => deleteQuiz(quiz._id, quiz.title)}
                      className="btn-delete"
                      title="Delete Quiz"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuizManager;
