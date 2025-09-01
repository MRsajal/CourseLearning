import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import courseService from "../services/courseService";
import CourseList from "./Course/CourseList";
import StudentAssignments from "./Assignment/StudentAssignments";
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
  const [liveClasses, setLiveClasses] = useState([]);
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

  // Rating states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRatingCourse, setSelectedRatingCourse] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

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
    } else if (activeTab === "liveClasses") {
      fetchLiveClasses();
    } else if (activeTab === "enrolled") {
      fetchEnrolledCourses();
    }
  }, [activeTab]);

  // Initial load when component mounts
  useEffect(() => {
    // Load data based on the initial active tab
    if (activeTab === "enrolled") {
      fetchEnrolledCourses();
    } else if (activeTab === "browse") {
      fetchFeaturedCourses();
    } else if (activeTab === "liveClasses") {
      fetchLiveClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on component mount

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
      const coursesWithRatings = await Promise.all(
        result.courses.map(async (course) => {
          try {
            const token = localStorage.getItem("token");
            if (token) {
              const ratingResponse = await fetch(
                `http://localhost:5000/api/courses/${
                  course._id || course.id
                }/rating`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                return {
                  ...course,
                  userRating: ratingData.userRating,
                  averageRating: ratingData.averageRating || course.rating,
                  totalRatings: ratingData.totalRatings || 0,
                  isStaticCourse: ratingData.isStaticCourse || false,
                };
              } else {
                // If rating fetch fails, return course with original rating
                return {
                  ...course,
                  averageRating: course.rating,
                  totalRatings: 0,
                  isStaticCourse: course.id && course.id.toString().startsWith('static-'),
                };
              }
            }
            return course;
          } catch (error) {
            console.log("Could not fetch rating for course:", course.title);
            return course;
          }
        })
      );
      setFeaturedCourses(coursesWithRatings);
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
        // Fetch user ratings for enrolled courses
        const coursesWithRatings = await Promise.all(
          coursesData.map(async (course) => {
            try {
              const ratingResponse = await fetch(
                `http://localhost:5000/api/courses/${course._id}/rating`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                return {
                  ...course,
                  userRating: ratingData.userRating,
                  averageRating: ratingData.averageRating || course.rating,
                  totalRatings: ratingData.totalRatings || 0,
                };
              }
              return course;
            } catch (error) {
              console.log("Could not fetch rating for course:", course.title);
              return course;
            }
          })
        );
        setEnrolledCourses(coursesWithRatings);
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

  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/live-class/student", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setLiveClasses(response.data.liveClasses || []);
      } else {
        setLiveClasses([]);
      }
    } catch (error) {
      console.error("Error fetching live classes:", error);
      setLiveClasses([]);
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

  const handleRateCourse = (course) => {
    setSelectedRatingCourse(course);
    setUserRating(course.userRating || 0); // Pre-fill with existing rating
    setHoverRating(0);
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!user || userRating === 0) return;

    try {
      const courseId = selectedRatingCourse._id || selectedRatingCourse.id;
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please log in to rate courses");
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/rate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating: userRating }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Handle both database and static courses
        const updatedCourseData = {
          averageRating: data.averageRating,
          totalRatings: data.totalRatings,
          userRating: data.userRating,
          rating: data.averageRating, // Keep backward compatibility
        };

        // Update featured courses with backend response
        const updatedFeaturedCourses = featuredCourses.map((course) => {
          if ((course._id || course.id) === courseId) {
            return {
              ...course,
              ...updatedCourseData,
            };
          }
          return course;
        });

        // Update enrolled courses with backend response
        const updatedEnrolledCourses = enrolledCourses.map((course) => {
          if ((course._id || course.id) === courseId) {
            return {
              ...course,
              ...updatedCourseData,
            };
          }
          return course;
        });

        setFeaturedCourses(updatedFeaturedCourses);
        setEnrolledCourses(updatedEnrolledCourses);
        setShowRatingModal(false);
        setSelectedRatingCourse(null);
        setUserRating(0);
        setMessage("Course rated successfully!");

        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Failed to submit rating");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      setMessage("Failed to submit rating. Please try again.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const renderStars = (rating, isInteractive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${
            i <= (isInteractive ? hoverRating || userRating : rating)
              ? "filled"
              : "empty"
          }`}
          onClick={isInteractive ? () => setUserRating(i) : undefined}
          onMouseEnter={isInteractive ? () => setHoverRating(i) : undefined}
          onMouseLeave={isInteractive ? () => setHoverRating(0) : undefined}
          style={{ cursor: isInteractive ? "pointer" : "default" }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const handleJoinLiveClass = (liveClass) => {
    // Navigate to live class room
    navigate(`/live-class/${liveClass._id}`);
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
                          {/* Rating Display on Hover */}
                          <div className="course-rating-hover">
                            <div className="rating-stars-hover">
                              {renderStars(
                                course.averageRating || course.rating || 0
                              )}
                            </div>
                            <span className="rating-text-hover">
                              {course.averageRating || course.rating
                                ? `${course.averageRating || course.rating} (${
                                    course.totalRatings || 0
                                  })`
                                : "No ratings"}
                            </span>
                          </div>
                          <div className="course-overlay-buttons">
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
                            {/* Rate Course Button in Overlay */}
                            {!isEnrolled(course._id || course.id) && (
                              <button
                                className="btn-rate-overlay"
                                onClick={() => handleRateCourse(course)}
                              >
                                Rate Course
                              </button>
                            )}
                          </div>
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
                onClick={() => navigate("/courses")}
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
                            {/* Rating Display on Hover */}
                            <div className="course-rating-hover">
                              <div className="rating-stars-hover">
                                {renderStars(
                                  course.averageRating || course.rating || 0
                                )}
                              </div>
                              <span className="rating-text-hover">
                                {course.averageRating || course.rating
                                  ? `${
                                      course.averageRating || course.rating
                                    } (${course.totalRatings || 0})`
                                  : "No ratings"}
                              </span>
                            </div>
                            <div className="course-overlay-buttons">
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
                              {/* Rate Course Button in Overlay */}
                              <button
                                className="btn-rate-overlay"
                                onClick={() => handleRateCourse(course)}
                              >
                                Rate Course
                              </button>
                            </div>
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
        return <StudentAssignments user={user} />;
      case "liveClasses":
        return (
          <div className="live-classes">
            <div className="live-classes-header">
              <h3>Live Classes</h3>
              <button
                onClick={fetchLiveClasses}
                className="btn-secondary btn-refresh"
                disabled={loading}
              >
                {loading ? "⏳ Refreshing..." : "🔄 Refresh"}
              </button>
            </div>
            {loading ? (
              <div className="loading">Loading live classes...</div>
            ) : liveClasses.length === 0 ? (
              <div className="no-live-classes">
                <h4>No Live Classes Available</h4>
                <p>No live classes are scheduled for your enrolled courses at the moment.</p>
                <p>Check back later or contact your instructors for updates.</p>
              </div>
            ) : (
              <div className="live-classes-grid">
                {liveClasses.map((liveClass) => (
                  <div key={liveClass._id} className="live-class-card">
                    <div className="live-class-header">
                      <h4>{liveClass.title}</h4>
                      <span className={`status-badge ${liveClass.status}`}>
                        {liveClass.status === 'scheduled' ? '🕒 Scheduled' :
                         liveClass.status === 'live' ? '🔴 Live Now' :
                         liveClass.status === 'ended' ? '✅ Ended' : liveClass.status}
                      </span>
                    </div>
                    
                    <div className="live-class-info">
                      <p className="course-name">
                        <strong>Course:</strong> {liveClass.courseName || liveClass.course?.title || 'Unknown Course'}
                      </p>
                      <p className="instructor-name">
                        <strong>Instructor:</strong> {liveClass.instructorName || 'Unknown Instructor'}
                      </p>
                      <p className="class-description">
                        {liveClass.description || 'No description available'}
                      </p>
                    </div>

                    <div className="live-class-schedule">
                      <div className="schedule-info">
                        <span className="schedule-date">
                          📅 {new Date(liveClass.scheduledDate).toLocaleDateString()}
                        </span>
                        <span className="schedule-time">
                          🕐 {new Date(liveClass.scheduledDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="duration">
                        <span>⏱️ {liveClass.duration || 60} minutes</span>
                      </div>
                    </div>

                    <div className="live-class-actions">
                      {liveClass.status === 'live' ? (
                        <button
                          className="btn-join-live"
                          onClick={() => handleJoinLiveClass(liveClass)}
                        >
                          🔴 Join Live Class
                        </button>
                      ) : liveClass.status === 'scheduled' ? (
                        <button
                          className="btn-join-scheduled"
                          onClick={() => handleJoinLiveClass(liveClass)}
                        >
                          📝 View Class Details
                        </button>
                      ) : (
                        <button
                          className="btn-join-ended"
                          disabled
                        >
                          ✅ Class Ended
                        </button>
                      )}
                      
                      {liveClass.recordingUrl && (
                        <button
                          className="btn-recording"
                          onClick={() => window.open(liveClass.recordingUrl, '_blank')}
                        >
                          📹 View Recording
                        </button>
                      )}
                    </div>

                    {liveClass.status === 'scheduled' && (
                      <div className="countdown-info">
                        <small>
                          Starts in: {Math.max(0, Math.ceil((new Date(liveClass.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24)))} days
                        </small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
        <button
          className={`tab-btn ${activeTab === "liveClasses" ? "active" : ""}`}
          onClick={() => setActiveTab("liveClasses")}
        >
          Live Classes
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

      {/* Rating Modal */}
      {showRatingModal && selectedRatingCourse && (
        <div className="rating-modal-overlay">
          <div className="rating-modal">
            <div className="modal-header">
              <h3>Rate Course</h3>
              <button
                className="close-btn"
                onClick={() => setShowRatingModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <h4>{selectedRatingCourse.title}</h4>
              <p>How would you rate this course?</p>
              <div className="rating-stars">{renderStars(0, true)}</div>
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowRatingModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={submitRating}
                  disabled={userRating === 0}
                >
                  Submit Rating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
