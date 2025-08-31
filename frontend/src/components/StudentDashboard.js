import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import courseService from "../services/courseService";
import CourseList from "./Course/CourseList";
import CourseCard from "./Course/CourseCard";
import "./CSS/Dashboard.css";
import "./CSS/Table.css";
import "./CSS/Button.css";
import "./CSS/Courses.css";
import "./CSS/Landing.css";

const StudentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("browse");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Payment and enrollment states
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState("");
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [paymentData, setPaymentData] = useState({
    method: "Bkash",
    transactionId: "",
  });

  const categories = [
    "Technology",
    "Business",
    "Design",
    "Marketing",
    "Health",
    "Music",
    "Language",
    "Other",
  ];

  useEffect(() => {
    if (activeTab === "browse") {
      fetchFeaturedCourses();
    }
  }, [activeTab]);

  // Also refresh enrolled courses when component mounts or when user navigates back
  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === "enrolled") {
        fetchEnrolledCourses();
        fetchFeaturedCourses();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [activeTab]);

  const fetchFeaturedCourses = async () => {
    try {
      const result = await courseService.getFeaturedCourses(6);
      setFeaturedCourses(result.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchEnrolledCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/student/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const coursesData = response.data.courses || response.data;
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
  const filteredCourses = useMemo(() => {
    return featuredCourses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "" || course.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [featuredCourses, searchTerm, selectedCategory]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(selectedCategory === category ? "" : category);
  };

  // Enrollment functions
  const handleEnrollClick = (course) => {
    if (!user || user.role !== "student") {
      alert("Only students can enroll in courses.");
      return;
    }

    setSelectedCourse(course);

    // If course is free, enroll directly
    if (course.price === 0) {
      handleEnroll(course);
    } else {
      // Show payment popup for paid courses
      setShowPaymentPopup(true);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!paymentData.transactionId.trim()) {
      setMessage("Please enter a valid transaction ID");
      return;
    }

    await handleEnroll(selectedCourse);
  };

  const handleEnroll = async (course) => {
    setEnrolling(true);
    try {
      const token = localStorage.getItem("token");

      // Try to enroll via API first
      if (token) {
        const response = await axios.post(
          `/api/courses/${course._id || course.id}/enroll`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data) {
          setMessage("Successfully enrolled!");
          setShowPaymentPopup(false);
          setPaymentData({ method: "Bkash", transactionId: "" });

          // Refresh enrolled courses
          await fetchEnrolledCourses();
          return;
        }
      }

      // Fallback for static data - simulate enrollment
      setMessage("Successfully enrolled!");
      setShowPaymentPopup(false);
      setPaymentData({ method: "Bkash", transactionId: "" });

      // Add to enrolled courses locally for demo
      const enrolledCourse = {
        ...course,
        enrolledAt: new Date().toISOString(),
        progressPercentage: 0,
        completedMaterials: 0,
        totalMaterials: course.totalMaterials || 20,
      };

      setEnrolledCourses((prev) => [...prev, enrolledCourse]);
    } catch (error) {
      console.error("Enrollment error:", error);
      setMessage("Enrollment failed. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const closePaymentPopup = () => {
    setShowPaymentPopup(false);
    setSelectedCourse(null);
    setPaymentData({ method: "Bkash", transactionId: "" });
    setMessage("");
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(
      (enrolled) => enrolled._id === courseId || enrolled.id === courseId
    );
  };

  const handleViewMaterials = (course) => {
    // Navigate to course learning page
    navigate(`/course/${course._id || course.id}/learn`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "browse":
        return (
          <div>
            {/* Search Section */}
            <div className="search-section">
              <div className="search-container">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search for courses"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                  />
                  <button className="search-button">Search</button>
                </div>
              </div>
            </div>

            {/* Categories Section */}
            <div className="categories-section">
              <h3 className="categories-title">Browse by Category</h3>
              <div className="categories-grid">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`category-button ${
                      selectedCategory === category ? "active" : ""
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Info */}
            <div className="results-info">
              <p>
                Showing {filteredCourses.length} course
                {filteredCourses.length !== 1 ? "s" : ""}
                {selectedCategory && ` in ${selectedCategory}`}
                {searchTerm && ` for "${searchTerm}"`}
              </p>
              {(searchTerm || selectedCategory) && (
                <button
                  className="clear-filters"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Courses Grid */}
            <div className="courses-grid">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <div key={course.id} className="course-card-landing-compact">
                    {course.thumbnail && (
                      <div className="course-image">
                        <img src={course.thumbnail} alt={course.title} />
                        <div className="course-overlay">
                          {isEnrolled(course._id || course.id) ? (
                            <button className="btn-enrolled" disabled>
                              Enrolled
                            </button>
                          ) : (
                            <button
                              className="btn-preview"
                              onClick={() => handleEnrollClick(course)}
                              disabled={enrolling}
                            >
                              {enrolling && selectedCourse?.id === course.id
                                ? "Enrolling..."
                                : "Enroll Course"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="course-content">
                      <div className="course-meta">
                        <span className="course-category">
                          {course.category}
                        </span>
                        <span className="course-level">{course.level}</span>
                      </div>
                      <h3 className="course-title">{course.title}</h3>
                      <p className="course-description">{course.description}</p>
                      <div className="course-instructor">
                        <span className="instructor-name">
                          By {course.instructorName}
                        </span>
                      </div>
                      <div className="course-footer">
                        <div className="course-students">
                          <span>
                            👥{" "}
                            {Array.isArray(course.enrolledStudents)
                              ? course.enrolledStudents.length
                              : course.enrolledStudents || 0}{" "}
                            students
                          </span>
                        </div>
                        <div className="course-price">
                          <span className="price">
                            {course.price === 0 ? "Free" : `$${course.price}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <h3>No courses found</h3>
                  <p>Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>

            {/* View All Courses Button */}
            <div className="view-all-section">
              <button
                className="btn-primary btn-view-all"
                onClick={() => navigate('/courses')}
              >
                View All Courses
              </button>
            </div>
          </div>
        );
      case "enrolled":
        return (
          <div className="enrolled-courses">
            <div className="enrolled-courses-header">
              <h3>My Enrolled Courses</h3>
              <button
                onClick={fetchEnrolledCourses}
                className="btn-secondary btn-refresh"
                disabled={loading}
              >
                {loading ? "⏳ Refreshing..." : "🔄 Refresh"}
              </button>
            </div>
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
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className="course-card-landing-compact"
                    >
                      {course.thumbnail && (
                        <div className="course-image">
                          <img src={course.thumbnail} alt={course.title} />
                          <div className="course-overlay">
                            {isEnrolled(course._id || course.id) ? (
                              <button
                                className="btn-enrolled"
                                onClick={() => handleViewMaterials(course)}
                              >
                                Materials
                              </button>
                            ) : (
                              <button
                                className="btn-preview"
                                onClick={() => handleEnrollClick(course)}
                                disabled={enrolling}
                              >
                                {enrolling && selectedCourse?.id === course.id
                                  ? "Enrolling..."
                                  : "Enroll Course"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="course-content">
                        <div className="course-meta">
                          <span className="course-category">
                            {course.category}
                          </span>
                          <span className="course-level">{course.level}</span>
                        </div>
                        <h3 className="course-title">{course.title}</h3>
                        <p className="course-description">
                          {course.description}
                        </p>
                        <div className="course-instructor">
                          <span className="instructor-name">
                            By {course.instructorName}
                          </span>
                        </div>
                        <div className="course-footer">
                          <div className="course-students">
                            <span>
                              👥{" "}
                              {Array.isArray(course.enrolledStudents)
                                ? course.enrolledStudents.length
                                : course.enrolledStudents || 0}{" "}
                              students
                            </span>
                          </div>
                          <div className="course-price">
                            <span className="price">
                              {course.price === 0 ? "Free" : `$${course.price}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    <h3>No courses found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                  </div>
                )}
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

      {/* Payment Popup */}
      {showPaymentPopup && selectedCourse && (
        <div className="payment-popup-overlay">
          <div className="payment-popup">
            <div className="popup-header">
              <h3>Complete Payment</h3>
              <button className="close-btn" onClick={closePaymentPopup}>
                ×
              </button>
            </div>

            <div className="popup-content">
              <div className="course-info">
                <h4>{selectedCourse.title}</h4>
                <p className="price">Total: ${selectedCourse.price}</p>
              </div>

              <form onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method:</label>
                  <select
                    id="paymentMethod"
                    value={paymentData.method}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        method: e.target.value,
                      }))
                    }
                    className="payment-select"
                  >
                    <option value="Bkash">Bkash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Upay">Upay</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="transactionId">Transaction ID:</label>
                  <input
                    type="text"
                    id="transactionId"
                    value={paymentData.transactionId}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        transactionId: e.target.value,
                      }))
                    }
                    placeholder="Enter your transaction ID"
                    className="payment-input"
                    required
                  />
                </div>

                <div className="payment-instructions">
                  <p>
                    <strong>Payment Instructions:</strong>
                  </p>
                  <ul>
                    <li>
                      Send ${selectedCourse.price} to our {paymentData.method}{" "}
                      number
                    </li>
                    <li>
                      Copy the transaction ID from your payment confirmation
                    </li>
                    <li>
                      Enter the transaction ID above and click "Confirm
                      Enrollment"
                    </li>
                  </ul>
                </div>

                <div className="popup-actions">
                  <button
                    type="button"
                    onClick={closePaymentPopup}
                    className="btn-cancel"
                    disabled={enrolling}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enrolling || !paymentData.transactionId.trim()}
                    className="btn-confirm"
                  >
                    {enrolling ? "Processing..." : "Confirm Enrollment"}
                  </button>
                </div>
              </form>

              {message && (
                <div
                  className={`popup-message ${
                    message.includes("Success") ? "success" : "error"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Message */}
      {message && !showPaymentPopup && (
        <div
          className={`dashboard-message ${
            message.includes("Success") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
