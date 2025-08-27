import React, { useState, useEffect } from "react";
import axios from "axios";
import CreateCourse from "./Course/CreateCourse";
import CourseMaterials from "./Course/CourseMaterials";
import "./CSS/Dashboard.css";
import "./CSS/Table.css";
import "./CSS/Button.css";

const InstructorDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [courses]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/instructor/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(
      (course) => course.isPublished
    ).length;
    const totalStudents = courses.reduce(
      (sum, course) => sum + (course.enrolledStudents?.length || 0),
      0
    );
    const totalRevenue = courses.reduce((sum, course) => {
      return sum + (course.enrolledStudents?.length || 0) * course.price;
    }, 0);

    setStats({
      totalCourses,
      publishedCourses,
      totalStudents,
      totalRevenue,
    });
  };

  const toggleCoursePublish = async (courseId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/courses/${courseId}/publish`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchCourses(); // Refresh courses
    } catch (error) {
      console.error("Error toggling course publish status:", error);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCourses(); // Refresh courses
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="instructor-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Total Courses</h4>
                <div className="stat-number">{stats.totalCourses}</div>
              </div>
              <div className="stat-card">
                <h4>Published Courses</h4>
                <div className="stat-number">{stats.publishedCourses}</div>
              </div>
              <div className="stat-card">
                <h4>Total Students</h4>
                <div className="stat-number">{stats.totalStudents}</div>
              </div>
              <div className="stat-card">
                <h4>Total Revenue</h4>
                <div className="stat-number">
                  ${stats.totalRevenue.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {courses.length === 0 ? (
                  <p>
                    No courses created yet. Create your first course to get
                    started!
                  </p>
                ) : (
                  <div className="courses-summary">
                    <h4>Your Latest Courses:</h4>
                    {courses.slice(0, 3).map((course) => (
                      <div key={course._id} className="course-summary-item">
                        <div className="course-info">
                          <h5>{course.title}</h5>
                          <p>
                            {course.enrolledStudents?.length || 0} students
                            enrolled
                          </p>
                        </div>
                        <div className="course-status">
                          <span
                            className={`status-badge ${
                              course.isPublished ? "published" : "draft"
                            }`}
                          >
                            {course.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "courses":
        return (
          <div className="instructor-courses">
            <div className="courses-header">
              <h3>My Courses</h3>
              <button
                onClick={() => setActiveTab("create")}
                className="btn-primary"
              >
                Create New Course
              </button>
            </div>

            {loading ? (
              <div className="loading">Loading your courses...</div>
            ) : courses.length === 0 ? (
              <div className="no-courses">
                <p>You haven't created any courses yet.</p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="btn-primary"
                >
                  Create Your First Course
                </button>
              </div>
            ) : (
              <div className="courses-table">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Category</th>
                      <th>Students</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course._id}>
                        <td>
                          <div className="course-cell">
                            {course.thumbnail && (
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="course-thumb"
                              />
                            )}
                            <div>
                              <h4>{course.title}</h4>
                              <p className="course-level">{course.level}</p>
                            </div>
                          </div>
                        </td>
                        <td>{course.category}</td>
                        <td>
                          {course.enrolledStudents?.length || 0}/
                          {course.maxStudents}
                        </td>
                        <td>${course.price}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              course.isPublished ? "published" : "draft"
                            }`}
                          >
                            {course.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td>
                          <div className="course-actions">
                            <button
                              onClick={() => {
                                setSelectedCourse(course);
                                setActiveTab("materials");
                              }}
                              className="btn-sm btn-materials"
                            >
                              Materials
                            </button>
                            <button
                              onClick={() =>
                                toggleCoursePublish(
                                  course._id,
                                  course.isPublished
                                )
                              }
                              className={`btn-sm ${
                                course.isPublished
                                  ? "btn-unpublish"
                                  : "btn-publish"
                              }`}
                            >
                              {course.isPublished ? "Unpublish" : "Publish"}
                            </button>
                            <button className="btn-sm btn-edit">Edit</button>
                            <button
                              onClick={() => deleteCourse(course._id)}
                              className="btn-sm btn-delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case "create":
        return (
          <CreateCourse
            onCourseCreated={() => {
              fetchCourses();
              setActiveTab("courses");
            }}
          />
        );

      case "students":
        return (
          <div className="instructor-students">
            <h3>Student Management</h3>
            <div className="students-overview">
              {courses.length === 0 ? (
                <p>Create courses to see enrolled students here.</p>
              ) : (
                <div className="courses-students">
                  {courses.map((course) => (
                    <div key={course._id} className="course-students-section">
                      <h4>{course.title}</h4>
                      <div className="students-count">
                        {course.enrolledStudents?.length || 0} students enrolled
                      </div>

                      {course.enrolledStudents?.length > 0 ? (
                        <div className="students-list">
                          {course.enrolledStudents.map((enrollment) => (
                            <div
                              key={enrollment.student._id}
                              className="student-item"
                            >
                              <div className="student-info">
                                <strong>{enrollment.student.name}</strong>
                                <p>{enrollment.student.email}</p>
                              </div>
                              <div className="enrollment-date">
                                Enrolled:{" "}
                                {new Date(
                                  enrollment.enrolledAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No students enrolled yet.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="instructor-analytics">
            <h3>Course Analytics</h3>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Enrollment Trends</h4>
                <div className="chart-placeholder">
                  <p>Chart showing enrollment over time</p>
                  <div className="mock-chart">
                    {courses.map((course) => (
                      <div key={course._id} className="course-metric">
                        <span>{course.title}:</span>
                        <span>
                          {course.enrolledStudents?.length || 0} students
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h4>Revenue Analytics</h4>
                <div className="revenue-breakdown">
                  {courses.map((course) => {
                    const revenue =
                      (course.enrolledStudents?.length || 0) * course.price;
                    return (
                      <div key={course._id} className="revenue-item">
                        <span>{course.title}:</span>
                        <span>${revenue.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div className="revenue-total">
                    <strong>Total: ${stats.totalRevenue.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "materials":
        return (
          <div className="course-materials-management">
            {selectedCourse ? (
              <>
                <div className="materials-header">
                  <h3>Materials for: {selectedCourse.title}</h3>
                  <button
                    onClick={() => setActiveTab("courses")}
                    className="btn-secondary"
                  >
                    Back to Courses
                  </button>
                </div>
                <CourseMaterials
                  courseId={selectedCourse._id}
                  user={user}
                  isOwner={true}
                />
              </>
            ) : (
              <div className="no-course-selected">
                <p>Please select a course to manage materials.</p>
                <button
                  onClick={() => setActiveTab("courses")}
                  className="btn-primary"
                >
                  Go to Courses
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Instructor Dashboard</h1>
        <div className="user-info">
          <p>Welcome back, {user.name}!</p>
          <p>Manage your courses and track your success</p>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          My Courses ({courses.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          Create Course
        </button>
        <button
          className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Students ({stats.totalStudents})
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
      </div>

      <div className="dashboard-content">{renderTabContent()}</div>
    </div>
  );
};

export default InstructorDashboard;
