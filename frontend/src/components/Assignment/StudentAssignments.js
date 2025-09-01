import React, { useState, useEffect } from "react";
import assignmentService from "../../services/assignmentService";
import "./StudentAssignments.css";

const StudentAssignments = ({ user }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    submissionType: "text",
    textContent: "",
    file: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllAssignments();
  }, []);

  const fetchAllAssignments = async () => {
    try {
      setLoading(true);
      // Get user's enrolled courses first
      const token = localStorage.getItem("token");
      const coursesResponse = await fetch("/api/student/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!coursesResponse.ok) {
        console.error("Failed to fetch enrolled courses");
        return;
      }

      const coursesData = await coursesResponse.json();
      const enrolledCourses = coursesData.courses || coursesData;

      // Fetch assignments for each enrolled course
      const allAssignments = [];
      for (const course of enrolledCourses) {
        try {
          const courseAssignments = await assignmentService.getCourseAssignments(course._id);
          const assignmentsWithCourse = courseAssignments.map(assignment => ({
            ...assignment,
            courseName: course.title,
            courseId: course._id
          }));
          allAssignments.push(...assignmentsWithCourse);
        } catch (error) {
          console.error(`Error fetching assignments for course ${course.title}:`, error);
        }
      }

      setAssignments(allAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    switch (filter) {
      case "pending":
        return !assignment.hasSubmitted && !assignment.isOverdue;
      case "submitted":
        return assignment.hasSubmitted && !assignment.submission?.isGraded;
      case "graded":
        return assignment.hasSubmitted && assignment.submission?.isGraded;
      case "overdue":
        return assignment.isOverdue && !assignment.hasSubmitted;
      default:
        return true;
    }
  });

  const handleSubmissionTypeChange = (type) => {
    setSubmissionData(prev => ({
      ...prev,
      submissionType: type,
      textContent: "",
      file: null
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }
    if (file && file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }
    setSubmissionData(prev => ({
      ...prev,
      file
    }));
  };

  const handleTextChange = (e) => {
    setSubmissionData(prev => ({
      ...prev,
      textContent: e.target.value
    }));
  };

  const openSubmissionModal = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionData({
      submissionType: assignment.allowedTypes.includes("text") ? "text" : "pdf",
      textContent: "",
      file: null,
    });
    setShowSubmissionModal(true);
  };

  const closeSubmissionModal = () => {
    setShowSubmissionModal(false);
    setSelectedAssignment(null);
    setSubmissionData({
      submissionType: "text",
      textContent: "",
      file: null,
    });
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    
    if (submissionData.submissionType === "text" && !submissionData.textContent.trim()) {
      alert("Please enter text content for your submission");
      return;
    }
    
    if (submissionData.submissionType === "pdf" && !submissionData.file) {
      alert("Please select a PDF file to upload");
      return;
    }

    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(selectedAssignment._id, submissionData);
      alert("Assignment submitted successfully!");
      closeSubmissionModal();
      fetchAllAssignments(); // Refresh assignments
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Failed to submit assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAssignmentStatus = (assignment) => {
    if (assignment.hasSubmitted) {
      if (assignment.submission?.isGraded) {
        return { status: "graded", text: "Graded", className: "graded" };
      }
      return { status: "submitted", text: "Submitted", className: "submitted" };
    }
    if (assignment.isOverdue) {
      return { status: "overdue", text: "Overdue", className: "overdue" };
    }
    return { status: "pending", text: "Pending", className: "pending" };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
  };

  if (loading) {
    return <div className="loading">Loading assignments...</div>;
  }

  return (
    <div className="student-assignments">
      <div className="assignments-header">
        <h3>My Assignments</h3>
        <div className="assignments-filter">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({assignments.length})
          </button>
          <button
            className={`filter-btn ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending ({assignments.filter(a => !a.hasSubmitted && !a.isOverdue).length})
          </button>
          <button
            className={`filter-btn ${filter === "submitted" ? "active" : ""}`}
            onClick={() => setFilter("submitted")}
          >
            Submitted ({assignments.filter(a => a.hasSubmitted && !a.submission?.isGraded).length})
          </button>
          <button
            className={`filter-btn ${filter === "graded" ? "active" : ""}`}
            onClick={() => setFilter("graded")}
          >
            Graded ({assignments.filter(a => a.hasSubmitted && a.submission?.isGraded).length})
          </button>
          <button
            className={`filter-btn ${filter === "overdue" ? "active" : ""}`}
            onClick={() => setFilter("overdue")}
          >
            Overdue ({assignments.filter(a => a.isOverdue && !a.hasSubmitted).length})
          </button>
        </div>
      </div>

      <div className="assignments-list">
        {filteredAssignments.length === 0 ? (
          <div className="no-assignments">
            <p>
              {filter === "all" 
                ? "No assignments available yet." 
                : `No ${filter} assignments.`}
            </p>
            {filter === "all" && (
              <p>Assignments will appear here once you enroll in courses that have assignments.</p>
            )}
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const statusInfo = getAssignmentStatus(assignment);
            return (
              <div key={assignment._id} className="assignment-card">
                <div className="assignment-header">
                  <div className="assignment-info">
                    <h4>{assignment.title}</h4>
                    <p className="course-name">Course: {assignment.courseName}</p>
                    <p className="assignment-description">{assignment.description}</p>
                  </div>
                  <div className="assignment-meta">
                    <span className={`status-badge ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                    <div className="due-date">
                      <strong>Due:</strong> {formatDate(assignment.dueDate)}
                    </div>
                    <div className="points">
                      <strong>Points:</strong> {assignment.points}
                    </div>
                  </div>
                </div>

                {assignment.instructions && (
                  <div className="assignment-instructions">
                    <h5>Instructions:</h5>
                    <p>{assignment.instructions}</p>
                  </div>
                )}

                <div className="assignment-details">
                  <div className="allowed-types">
                    <strong>Allowed submission types:</strong> {assignment.allowedTypes.join(", ")}
                  </div>
                </div>

                {assignment.hasSubmitted ? (
                  <div className="submission-info">
                    <h5>Your Submission:</h5>
                    <div className="submission-meta">
                      <span>Submitted: {formatDate(assignment.submission.submittedAt)}</span>
                      <span>Type: {assignment.submission.submissionType.toUpperCase()}</span>
                    </div>
                    
                    {assignment.submission.submissionType === "text" ? (
                      <div className="text-submission-preview">
                        <p>{assignment.submission.textContent}</p>
                      </div>
                    ) : (
                      <div className="file-submission-info">
                        <span>File: {assignment.submission.fileName}</span>
                      </div>
                    )}

                    {assignment.submission.isGraded && (
                      <div className="grade-info">
                        <div className="grade">
                          <strong>Grade: {assignment.submission.grade}/{assignment.points}</strong>
                        </div>
                        {assignment.submission.feedback && (
                          <div className="feedback">
                            <strong>Feedback:</strong> {assignment.submission.feedback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="assignment-actions">
                    {assignment.isOverdue ? (
                      <span className="overdue-notice">This assignment is overdue</span>
                    ) : (
                      <button
                        onClick={() => openSubmissionModal(assignment)}
                        className="btn-submit-assignment"
                      >
                        Submit Assignment
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <div className="submission-modal-overlay">
          <div className="submission-modal">
            <div className="modal-header">
              <h3>Submit Assignment: {selectedAssignment.title}</h3>
              <button className="close-btn" onClick={closeSubmissionModal}>
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="assignment-summary">
                <p><strong>Course:</strong> {selectedAssignment.courseName}</p>
                <p><strong>Due:</strong> {formatDate(selectedAssignment.dueDate)}</p>
                <p><strong>Points:</strong> {selectedAssignment.points}</p>
              </div>

              <form onSubmit={handleSubmitAssignment}>
                <div className="submission-type-selector">
                  <label>Submission Type:</label>
                  <div className="type-options">
                    {selectedAssignment.allowedTypes.includes("text") && (
                      <label className="type-option">
                        <input
                          type="radio"
                          name="submissionType"
                          value="text"
                          checked={submissionData.submissionType === "text"}
                          onChange={() => handleSubmissionTypeChange("text")}
                        />
                        Text Submission
                      </label>
                    )}
                    {selectedAssignment.allowedTypes.includes("pdf") && (
                      <label className="type-option">
                        <input
                          type="radio"
                          name="submissionType"
                          value="pdf"
                          checked={submissionData.submissionType === "pdf"}
                          onChange={() => handleSubmissionTypeChange("pdf")}
                        />
                        PDF Upload
                      </label>
                    )}
                  </div>
                </div>

                {submissionData.submissionType === "text" ? (
                  <div className="text-submission-input">
                    <label htmlFor="textContent">Your Answer:</label>
                    <textarea
                      id="textContent"
                      value={submissionData.textContent}
                      onChange={handleTextChange}
                      placeholder="Enter your submission text here..."
                      rows="10"
                      required
                    />
                  </div>
                ) : (
                  <div className="file-submission-input">
                    <label htmlFor="fileUpload">Upload PDF:</label>
                    <input
                      type="file"
                      id="fileUpload"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                    />
                    <small>Maximum file size: 10MB. Only PDF files are allowed.</small>
                    {submissionData.file && (
                      <div className="file-info">
                        Selected: {submissionData.file.name} ({(submissionData.file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={closeSubmissionModal}
                    className="btn-cancel"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
