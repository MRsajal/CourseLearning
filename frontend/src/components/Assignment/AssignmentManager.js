import React, { useState, useEffect } from "react";
import assignmentService from "../../services/assignmentService";
import "./AssignmentManager.css";

const AssignmentManager = ({ courseId, user }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    allowedTypes: ["text", "pdf"],
    instructions: "",
    points: 100,
  });

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getCourseAssignments(courseId);
      setAssignments(data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      allowedTypes: prev.allowedTypes.includes(type)
        ? prev.allowedTypes.filter((t) => t !== type)
        : [...prev.allowedTypes, type],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const assignmentData = {
        ...formData,
        courseId,
        dueDate: new Date(formData.dueDate).toISOString(),
      };

      await assignmentService.createAssignment(assignmentData);
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        allowedTypes: ["text", "pdf"],
        instructions: "",
        points: 100,
      });
      fetchAssignments();
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Failed to create assignment. Please try again.");
    }
  };

  const viewSubmissions = async (assignment) => {
    try {
      const data = await assignmentService.getAssignmentSubmissions(
        assignment._id
      );
      setSelectedAssignment({ ...assignment, submissionData: data });
      setShowSubmissions(true);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const gradeSubmission = async (submissionId, grade, feedback) => {
    try {
      await assignmentService.gradeSubmission(
        selectedAssignment._id,
        submissionId,
        { grade: parseFloat(grade), feedback }
      );
      // Refresh submissions
      viewSubmissions(selectedAssignment);
    } catch (error) {
      console.error("Error grading submission:", error);
      alert("Failed to grade submission. Please try again.");
    }
  };

  const downloadSubmission = async (submissionId) => {
    try {
      const response = await assignmentService.downloadSubmission(
        selectedAssignment._id,
        submissionId
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = "submission.pdf";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading submission:", error);
      alert("Failed to download submission.");
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    try {
      await assignmentService.deleteAssignment(assignmentId);
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading assignments...</div>;
  }

  if (showSubmissions && selectedAssignment) {
    return (
      <div className="assignment-submissions">
        <div className="submissions-header">
          <h3>Submissions for: {selectedAssignment.title}</h3>
          <button
            onClick={() => {
              setShowSubmissions(false);
              setSelectedAssignment(null);
            }}
            className="btn-secondary"
          >
            Back to Assignments
          </button>
        </div>

        <div className="submissions-stats">
          <div className="stat-card">
            <h4>Total Students</h4>
            <div className="stat-number">
              {selectedAssignment.submissionData.totalStudents}
            </div>
          </div>
          <div className="stat-card">
            <h4>Submissions</h4>
            <div className="stat-number">
              {selectedAssignment.submissionData.submissionCount}
            </div>
          </div>
          <div className="stat-card">
            <h4>Pending</h4>
            <div className="stat-number">
              {selectedAssignment.submissionData.pendingCount}
            </div>
          </div>
        </div>

        <div className="submissions-list">
          {selectedAssignment.submissionData.assignment.submissions.map(
            (submission) => (
              <div key={submission._id} className="submission-item">
                <div className="submission-header">
                  <div className="student-info">
                    <h4>{submission.student.name}</h4>
                    <p>{submission.student.email}</p>
                  </div>
                  <div className="submission-meta">
                    <span className="submission-type">
                      {submission.submissionType.toUpperCase()}
                    </span>
                    <span className="submission-date">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="submission-content">
                  {submission.submissionType === "text" ? (
                    <div className="text-submission">
                      <p>{submission.textContent}</p>
                    </div>
                  ) : (
                    <div className="file-submission">
                      <p>File: {submission.fileName}</p>
                      <button
                        onClick={() => downloadSubmission(submission._id)}
                        className="btn-sm btn-download"
                      >
                        Download PDF
                      </button>
                    </div>
                  )}
                </div>

                <div className="grading-section">
                  {submission.isGraded ? (
                    <div className="grade-display">
                      <span className="grade">
                        Grade: {submission.grade}/{selectedAssignment.points}
                      </span>
                      {submission.feedback && (
                        <div className="feedback">
                          <strong>Feedback:</strong> {submission.feedback}
                        </div>
                      )}
                    </div>
                  ) : (
                    <GradingForm
                      submission={submission}
                      maxPoints={selectedAssignment.points}
                      onGrade={gradeSubmission}
                    />
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-manager">
      <div className="assignment-header">
        <h3>Assignment Management</h3>
        <button onClick={() => setShowCreateForm(true)} className="btn-primary">
          Create New Assignment
        </button>
      </div>

      {showCreateForm && (
        <div className="assignment-form-modal">
          <div className="assignment-form">
            <h4>Create New Assignment</h4>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="instructions">Instructions</label>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Additional instructions for students..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dueDate">Due Date *</label>
                  <input
                    type="datetime-local"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="points">Points</label>
                  <input
                    type="number"
                    id="points"
                    name="points"
                    value={formData.points}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Allowed Submission Types *</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.allowedTypes.includes("text")}
                      onChange={() => handleTypeChange("text")}
                    />
                    Text Submission
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.allowedTypes.includes("pdf")}
                      onChange={() => handleTypeChange("pdf")}
                    />
                    PDF Upload
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Create Assignment
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
        </div>
      )}

      <div className="assignments-list">
        {assignments.length === 0 ? (
          <div className="no-assignments">
            <p>No assignments created yet.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Your First Assignment
            </button>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment._id} className="assignment-card">
              <div className="assignment-info">
                <h4>{assignment.title}</h4>
                <p className="assignment-description">
                  {assignment.description}
                </p>
                <div className="assignment-meta">
                  <span className="due-date">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                  <span className="points">Points: {assignment.points}</span>
                  <span className="types">
                    Types: {assignment.allowedTypes.join(", ")}
                  </span>
                </div>
              </div>

              <div className="assignment-stats">
                <div className="stat">
                  <span className="stat-label">Submissions:</span>
                  <span className="stat-value">
                    {assignment.submissionCount || 0}
                  </span>
                </div>
                <div
                  className={`assignment-status ${
                    assignment.isOverdue ? "overdue" : "active"
                  }`}
                >
                  {assignment.isOverdue ? "Overdue" : "Active"}
                </div>
              </div>

              <div className="assignment-actions">
                <button
                  onClick={() => viewSubmissions(assignment)}
                  className="btn-sm btn-view"
                >
                  View Submissions
                </button>
                <button
                  onClick={() => deleteAssignment(assignment._id)}
                  className="btn-sm btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Grading form component
const GradingForm = ({ submission, maxPoints, onGrade }) => {
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (grade && parseFloat(grade) >= 0 && parseFloat(grade) <= maxPoints) {
      onGrade(submission._id, grade, feedback);
      setGrade("");
      setFeedback("");
    } else {
      alert(`Grade must be between 0 and ${maxPoints}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grading-form">
      <div className="grade-input">
        <label>
          Grade (out of {maxPoints}):
          <input
            type="number"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            min="0"
            max={maxPoints}
            step="0.1"
            required
          />
        </label>
      </div>
      <div className="feedback-input">
        <label>
          Feedback:
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Optional feedback for the student..."
            rows="2"
          />
        </label>
      </div>
      <button type="submit" className="btn-sm btn-grade">
        Submit Grade
      </button>
    </form>
  );
};

export default AssignmentManager;
