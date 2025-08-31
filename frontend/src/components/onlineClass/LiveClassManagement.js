import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router";
import axios from "axios";
import LiveClass from "./LiveClass";
import "../CSS/LiveClassManagement.css";

const LiveClassManagement = ({ user, courseId: propCourseId }) => {
  // Extract courseId from URL parameters or use prop
  const { courseId: urlCourseId } = useParams();
  const courseId = propCourseId || urlCourseId;

  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [newClass, setNewClass] = useState({
    title: "",
    description: "",
    scheduledTime: "",
    duration: 60,
    isRecurring: false,
    recurringPattern: {
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [],
      endDate: "",
    },
    maxParticipants: 100,
    settings: {
      allowChat: true,
      allowScreenShare: true,
      allowRecording: true,
      requireApproval: false,
      muteParticipantsOnEntry: true,
      allowParticipantVideo: false,
      allowParticipantAudio: false,
      enableWaitingRoom: false,
    },
  });

  const fetchCourseInfo = useCallback(async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCourse(response.data);
    } catch (error) {
      console.error("Error fetching course info:", error);
    }
  }, [courseId]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await axios.get(`/api/live-class/course/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setClasses(response.data.liveClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const checkActiveClass = useCallback(async () => {
    try {
      const response = await axios.get(`/api/live-class/active/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setActiveClass(response.data.liveClass);
    } catch (error) {
      console.error("Error checking active class:", error);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchCourseInfo();
      fetchClasses();
      checkActiveClass();
    }
  }, [courseId, fetchCourseInfo, fetchClasses, checkActiveClass]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "/api/live-class/create",
        {
          ...newClass,
          courseId,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setShowCreateForm(false);
      setNewClass({
        title: "",
        description: "",
        scheduledTime: "",
        duration: 60,
        isRecurring: false,
        recurringPattern: {
          frequency: "weekly",
          interval: 1,
          daysOfWeek: [],
          endDate: "",
        },
        maxParticipants: 100,
        settings: {
          allowChat: true,
          allowScreenShare: true,
          allowRecording: true,
          requireApproval: false,
          muteParticipantsOnEntry: true,
          allowParticipantVideo: false,
          allowParticipantAudio: false,
          enableWaitingRoom: false,
        },
      });
      fetchClasses();
      alert("Live class created successfully!");
    } catch (error) {
      console.error("Error creating class:", error);
      alert("Failed to create live class");
    }
  };

  const startClass = async (classId) => {
    try {
      await axios.post(
        `/api/live-class/start/${classId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      checkActiveClass();
      fetchClasses();
    } catch (error) {
      console.error("Error starting class:", error);
      alert("Failed to start class");
    }
  };

  const endClass = async (classId) => {
    try {
      await axios.post(
        `/api/live-class/end/${classId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setActiveClass(null);
      fetchClasses();
    } catch (error) {
      console.error("Error ending class:", error);
      alert("Failed to end class");
    }
  };

  const deleteClass = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await axios.delete(`/api/live-class/${classId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        fetchClasses();
        alert("Class deleted successfully");
      } catch (error) {
        console.error("Error deleting class:", error);
        alert("Failed to delete class");
      }
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "#2196F3";
      case "live":
        return "#4CAF50";
      case "ended":
        return "#9E9E9E";
      case "cancelled":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  // Show error if no courseId
  if (!courseId) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>Course ID not found. Please navigate from a valid course page.</p>
        <Link to="/courses" className="btn-back">
          Back to Courses
        </Link>
      </div>
    );
  }

  if (activeClass) {
    return (
      <LiveClass courseId={courseId} user={user} classData={activeClass} />
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading live classes...</p>
      </div>
    );
  }

  return (
    <div className="live-class-management">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/courses">Courses</Link>
        <span> / </span>
        <Link to={`/course/${courseId}`}>{course?.title || "Course"}</Link>
        <span> / Live Classes</span>
      </div>

      <div className="management-header">
        <div className="header-info">
          <h2>Live Classes</h2>
          {course && (
            <p className="course-info">
              <strong>Course:</strong> {course.title}
            </p>
          )}
        </div>
        {user.role === "instructor" && (
          <button
            className="btn-create-class"
            onClick={() => setShowCreateForm(true)}
          >
            + Schedule New Class
          </button>
        )}
      </div>

      {/* Active Class Alert */}
      {activeClass && (
        <div className="active-class-alert">
          <div className="alert-content">
            <h3>🔴 Live Class in Progress</h3>
            <p>{activeClass.title}</p>
            <div className="alert-actions">
              <Link
                to={`/live-class/${activeClass._id}`}
                className="btn-join-live"
              >
                Join Live Class
              </Link>
              {user.role === "instructor" && (
                <button
                  className="btn-end-class"
                  onClick={() => endClass(activeClass._id)}
                >
                  End Class
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Classes List */}
      <div className="classes-grid">
        {classes.length === 0 ? (
          <div className="no-classes">
            <p>No live classes scheduled for this course</p>
            {user.role === "instructor" && (
              <button
                className="btn-create-first"
                onClick={() => setShowCreateForm(true)}
              >
                Schedule Your First Class
              </button>
            )}
          </div>
        ) : (
          classes.map((liveClass) => (
            <div key={liveClass._id} className="class-card">
              <div className="class-header">
                <h3>{liveClass.title}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(liveClass.status) }}
                >
                  {liveClass.status.toUpperCase()}
                </span>
              </div>

              <div className="class-info">
                <p className="class-description">{liveClass.description}</p>
                <div className="class-details">
                  <div className="detail-item">
                    <span className="detail-label">📅 Scheduled:</span>
                    <span className="detail-value">
                      {formatDateTime(liveClass.scheduledTime)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">⏱️ Duration:</span>
                    <span className="detail-value">
                      {liveClass.duration} minutes
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">👥 Max Participants:</span>
                    <span className="detail-value">
                      {liveClass.maxParticipants}
                    </span>
                  </div>
                  {liveClass.attendance && liveClass.attendance.length > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">📊 Attendance:</span>
                      <span className="detail-value">
                        {liveClass.attendance.length} joined
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="class-actions">
                {liveClass.status === "scheduled" &&
                  user.role === "instructor" && (
                    <button
                      className="btn-start-class"
                      onClick={() => startClass(liveClass._id)}
                      disabled={
                        new Date(liveClass.scheduledTime) >
                        new Date(Date.now() + 15 * 60000)
                      }
                    >
                      Start Class
                    </button>
                  )}

                {liveClass.status === "live" && (
                  <Link
                    to={`/live-class/${liveClass._id}`}
                    className="btn-join-class"
                  >
                    Join Class
                  </Link>
                )}

                {liveClass.status === "ended" &&
                  liveClass.recordings &&
                  liveClass.recordings.length > 0 && (
                    <Link
                      to={`/recordings/${liveClass._id}`}
                      className="btn-view-recording"
                    >
                      View Recording
                    </Link>
                  )}

                {user.role === "instructor" &&
                  liveClass.status === "scheduled" && (
                    <button
                      className="btn-delete-class"
                      onClick={() => deleteClass(liveClass._id)}
                    >
                      Delete
                    </button>
                  )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Class Modal - Same as before but now uses courseId from useParams */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="create-class-modal">
            <div className="modal-header">
              <h3>Schedule New Live Class</h3>
              <button
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="create-class-form">
              <div className="form-section">
                <h4>Basic Information</h4>

                <div className="form-group">
                  <label>Class Title *</label>
                  <input
                    type="text"
                    value={newClass.title}
                    onChange={(e) =>
                      setNewClass({ ...newClass, title: e.target.value })
                    }
                    required
                    placeholder="Enter class title"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newClass.description}
                    onChange={(e) =>
                      setNewClass({ ...newClass, description: e.target.value })
                    }
                    placeholder="Describe what will be covered in this class"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Scheduled Time *</label>
                    <input
                      type="datetime-local"
                      value={newClass.scheduledTime}
                      onChange={(e) =>
                        setNewClass({
                          ...newClass,
                          scheduledTime: e.target.value,
                        })
                      }
                      required
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Duration (minutes) *</label>
                    <input
                      type="number"
                      value={newClass.duration}
                      onChange={(e) =>
                        setNewClass({
                          ...newClass,
                          duration: parseInt(e.target.value),
                        })
                      }
                      min="15"
                      max="480"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Max Participants</label>
                  <input
                    type="number"
                    value={newClass.maxParticipants}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        maxParticipants: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="1000"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Class Settings</h4>

                <div className="settings-grid">
                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      checked={newClass.settings.allowChat}
                      onChange={(e) =>
                        setNewClass({
                          ...newClass,
                          settings: {
                            ...newClass.settings,
                            allowChat: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Allow Chat</span>
                  </label>

                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      checked={newClass.settings.allowScreenShare}
                      onChange={(e) =>
                        setNewClass({
                          ...newClass,
                          settings: {
                            ...newClass.settings,
                            allowScreenShare: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Allow Screen Share</span>
                  </label>

                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      checked={newClass.settings.allowRecording}
                      onChange={(e) =>
                        setNewClass({
                          ...newClass,
                          settings: {
                            ...newClass.settings,
                            allowRecording: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Allow Recording</span>
                  </label>

                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      checked={newClass.settings.muteParticipantsOnEntry}
                      onChange={(e) =>
                        setNewClass({
                          ...newClass,
                          settings: {
                            ...newClass.settings,
                            muteParticipantsOnEntry: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Mute on Entry</span>
                  </label>

                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      checked={newClass.settings.allowParticipantVideo}
                      onChange={(e) =>
                        setNewClass({
                          ...newClass,
                          settings: {
                            ...newClass.settings,
                            allowParticipantVideo: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Allow Participant Video</span>
                  </label>

                  <label className="checkbox-group">
                    <input
                      type="checkbox"
                      checked={newClass.settings.enableWaitingRoom}
                      onChange={(e) =>
                        setNewClass({
                          ...newClass,
                          settings: {
                            ...newClass.settings,
                            enableWaitingRoom: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Enable Waiting Room</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-create">
                  Schedule Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClassManagement;
