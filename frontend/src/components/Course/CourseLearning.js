import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import "../CSS/CourseLearning.css";

const CourseLearning = ({ user }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingMaterial, setCompletingMaterial] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/courses/${courseId}/learn`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCourseData(response.data.course);
      setMaterials(response.data.materials);
      setProgress(response.data.progress);
    } catch (error) {
      console.error("Error fetching course data:", error);
      console.error("Error details:", error.response?.data);
      setMessage(error.response?.data?.message || "Failed to load course data.");
    } finally {
      setLoading(false);
    }
  };
  const handleMaterialCompletion = async (materialId, isCompleted) => {
    setCompletingMaterial(materialId);
    try {
      const token = localStorage.getItem("token");

      if (isCompleted) {
        // Mark as incomplete
        await axios.delete(`/api/materials/${materialId}/complete`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage("Material marked as incomplete");
      } else {
        const timeSpent = prompt(
          "How many minutes did you spend on this material? (optional)",
          "0"
        );
        await axios.post(
          `/api/materials/${materialId}/complete`,
          {
            timeSpent: parseInt(timeSpent) || 0,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessage("Material marked as completed!");
      }
      fetchCourseData();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Error updating completion status"
      );
    } finally {
      setCompletingMaterial(null);
    }
  };
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const getFileIcon = (type) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "video":
        return "🎥";
      default:
        return "📁";
    }
  };
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: `${40}px`,
            height: `${40}px`,
            borderWidth: `${4}px`,
            borderColor: "#89A8B2",
            borderTopColor: "transparent",
            borderStyle: "solid",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }
  if (!courseData) {
    return <div className="error">Course not found or access denied</div>;
  }
  return (
    <div className="course-learning">
      <div className="learning-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Back
        </button>

        <div className="course-info">
          <h1>{courseData.title}</h1>
          <p className="instructor">by {courseData.instructorName}</p>
        </div>

        <div className="progress-summary">
          <div className="progress-circle">
            <svg className="progress-ring" width="80" height="80">
              <circle
                className="progress-ring-circle"
                stroke="#E5E1DA"
                strokeWidth="8"
                fill="transparent"
                r="32"
                cx="40"
                cy="40"
              />
              <circle
                className="progress-ring-circle progress-ring-fill"
                stroke="#89A8B2"
                strokeWidth="8"
                fill="transparent"
                r="32"
                cx="40"
                cy="40"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${
                  2 * Math.PI * 32 * (1 - progress?.progressPercentage / 100)
                }`}
              />
            </svg>
            <div className="progress-text">
              {progress?.progressPercentage || 0}%
            </div>
          </div>

          <div className="progress-stats">
            <div className="stat">
              <strong>{progress?.completedMaterials || 0}</strong> /{" "}
              {progress?.totalMaterials || 0}
              <span>Materials</span>
            </div>
            <div className="stat">
              <strong>{formatDuration(progress?.totalTimeSpent || 0)}</strong>
              <span>Total Time</span>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`message ${
            message.includes("completed") || message.includes("incomplete")
              ? "success"
              : "error"
          }`}
        >
          {message}
        </div>
      )}

      <div className="learning-content">
        <div className="materials-section">
          <h2>Course Materials</h2>

          {materials.length === 0 ? (
            <div className="no-materials">
              <p>No materials available for this course yet.</p>
            </div>
          ) : (
            <div className="materials-list">
              {materials.map((material, index) => (
                <div
                  key={material._id}
                  className={`learning-material ${
                    material.isCompleted ? "completed" : ""
                  }`}
                >
                  <div className="material-header">
                    <div className="material-icon">
                      {getFileIcon(material.type)}
                    </div>

                    <div className="material-info">
                      <h3>{material.title}</h3>
                      {material.description && (
                        <p className="material-description">
                          {material.description}
                        </p>
                      )}
                      <div className="material-meta">
                        <span className="material-type">
                          {material.type.toUpperCase()}
                        </span>
                        <span className="material-size">
                          {formatFileSize(material.fileSize)}
                        </span>
                        {material.isCompleted && (
                          <span className="completed-badge">
                            ✓ Completed{" "}
                            {material.timeSpent > 0 &&
                              `(${formatDuration(material.timeSpent)})`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="material-number">{index + 1}</div>
                  </div>

                  <div className="material-actions">
                    <a
                      href={`/api/materials/${material._id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-view"
                      onClick={(e) => {
                        const token = localStorage.getItem("token");
                        if (token) {
                          e.preventDefault();
                          window.open(
                            `/api/materials/${material._id}/download?token=${token}`,
                            "_blank"
                          );
                        }
                      }}
                    >
                      {material.type === "video" ? "🎥 Watch" : "📖 View"}
                    </a>

                    <button
                      onClick={() =>
                        handleMaterialCompletion(
                          material._id,
                          material.isCompleted
                        )
                      }
                      disabled={completingMaterial === material._id}
                      className={`btn-complete ${
                        material.isCompleted ? "completed" : ""
                      }`}
                    >
                      {completingMaterial === material._id
                        ? "Updating..."
                        : material.isCompleted
                        ? "✓ Completed"
                        : "Mark Complete"}
                    </button>
                  </div>

                  {material.isCompleted && material.completedAt && (
                    <div className="completion-info">
                      <small>
                        Completed on{" "}
                        {new Date(material.completedAt).toLocaleDateString()}
                      </small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="learning-sidebar">
          <div className="course-progress-card">
            <h3>Your Progress</h3>
            <div className="progress-bar-large">
              <div
                className="progress-fill-large"
                style={{ width: `${progress?.progressPercentage || 0}%` }}
              ></div>
            </div>
            <p>{progress?.progressPercentage || 0}% Complete</p>

            <div className="progress-details">
              <div className="detail-item">
                <span>Materials Completed:</span>
                <strong>
                  {progress?.completedMaterials || 0} /{" "}
                  {progress?.totalMaterials || 0}
                </strong>
              </div>
              <div className="detail-item">
                <span>Time Spent:</span>
                <strong>{formatDuration(progress?.totalTimeSpent || 0)}</strong>
              </div>
              <div className="detail-item">
                <span>Last Accessed:</span>
                <strong>
                  {progress?.lastAccessedAt
                    ? new Date(progress.lastAccessedAt).toLocaleDateString()
                    : "Never"}
                </strong>
              </div>
            </div>
          </div>

          {progress?.progressPercentage === 100 && (
            <div className="completion-certificate">
              <h3>🎉 Congratulations!</h3>
              <p>You have completed this course!</p>
              <button className="btn-certificate">Download Certificate</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseLearning;
