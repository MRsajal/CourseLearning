import React, { act, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import CourseList from "./Course/CourseList";
import "./CSS/Dashboard.css";
import "./CSS/Table.css";
import "./CSS/Button.css";
import "./CSS/Courses.css";

const StudentDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState("browse");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (activeTab === "enrolled") {
      fetchEnrolledCourses();
    }
  }, [activeTab]);

  const fetchEnrolledCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/student/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Ensure we always set an array
      const coursesData = response.data.courses || response.data; // Try both formats
      if (Array.isArray(coursesData)) {
        setEnrolledCourses(coursesData);
      } else {
        console.warn("API response is not an array:", response.data);
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      setEnrolledCourses([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case "browse":
        return <CourseList user={user} />;
      case "enrolled":
        return (
          <div className="enrolled-courses">
            <h3>My Enrolled Courses</h3>
            {loading ? (
              <div className="loading">Loading your courses...</div>
            ) : enrolledCourses.length === 0 ? (
              <div className="no-courses">
                <p>You haven't enrolled in any courses yet.</p>
                <button
                  onClick={() => setActiveTab("browse")}
                  className="btn-primary"
                >
                  Browse Courses
                </button>
              </div>
            ) : (
              <div className="courses-grid">
                {Array.isArray(enrolledCourses) && enrolledCourses.map((course) => (
                  <div key={course._id} className="enrolled-course-card">
                    {course.thumbnail && (
                      <div className="course-thumbnail">
                        <img src={course.thumbnail} alt={course.title} />
                      </div>
                    )}
                    <div className="course-content">
                      <h4>{course.title}</h4>
                      <p className="course-instructor">
                        Instructor: {course.instructorName}
                      </p>
                      <p className="course-description">{course.description}</p>
                      <div className="course-meta">
                        <span className="course-category">{course.category}</span>
                        <span className="course-level">{course.level}</span>
                        <span className="course-duration">{course.duration}</span>
                      </div>
                      <div className="course-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${course.progressPercentage || 0}%` }}></div>
                        </div>
                        <span className="progress-text">{course.progressPercentage || 0}% Complete</span>
                      </div>
                      <Link to={`/course/${course._id}/learn`} className="btn-continue">
                        Continue Learning
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "progress":
        return (
          <div className="student-progress">
            <h3>Learning Progress</h3>
            <div className="progress-overview">
              <div className="progress-card">
                <h4>Courses Enrolled</h4>
                <div className="progress-number">{enrolledCourses.length}</div>
              </div>
              <div className="progress-card">
                <h4>Courses Completed</h4>
                <div className="progress-number">0</div>
              </div>
              <div className="progress-card">
                <h4>Total Hours Learned</h4>
                <div className="progress-number">0</div>
              </div>
              <div className="progress-card">
                <h4>Certificates Earned</h4>
                <div className="progress-number">0</div>
              </div>
            </div>

            <div className="recent-activity">
              <h4>Recent Activity</h4>
              <div className="activity-list">
                <p>
                  No recent activity yet. Start learning to see your progress!
                </p>
              </div>
            </div>
          </div>
        );
      case "assignments":
        return (
          <div className="student-assignments">
            <h3>Assignments & Assessments</h3>
            <div className="assignments-filter">
              <button className="filter-btn active">All</button>
              <button className="filter-btn">Pending</button>
              <button className="filter-btn">Submitted</button>
              <button className="filter-btn">Graded</button>
            </div>
            <div className="assignments-list">
              <div className="no-assignments">
                <p>No assignments available yet.</p>
                <p>Assignments will appear here once you enroll in courses.</p>
              </div>
            </div>
          </div>
        );
      default:
        return <CourseList user={user} />;
    }
  };
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <div className="user-info">
          <p>Welcome back, {user.name}!</p>
          <p>Continue your learning journey</p>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          Browse Courses
        </button>
        <button
          className={`tab-btn ${activeTab === "enrolled" ? "active" : ""}`}
          onClick={() => setActiveTab("enrolled")}
        >
          My Courses ({enrolledCourses.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "progress" ? "active" : ""}`}
          onClick={() => setActiveTab("progress")}
        >
          Progress
        </button>
        <button
          className={`tab-btn ${activeTab === "assignments" ? "active" : ""}`}
          onClick={() => setActiveTab("assignments")}
        >
          Assignments
        </button>
      </div>

      <div className="dashboard-content">{renderTabContent()}</div>
    </div>
  );
};

export default StudentDashboard;
