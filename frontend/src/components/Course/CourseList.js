import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import courseService from "../../services/courseService";
import "../CSS/Button.css";
import "../CSS/Landing.css";
import "../CSS/Dashboard.css";
import "../CSS/Courses.css";

const CourseList = ({ user }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const categoryList = [
    "Technology",
    "Business", 
    "Design",
    "Marketing",
    "Health",
    "Music",
    "Language",
    "Other",
  ];

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const result = await courseService.getAllCourses();
      setCourses(result.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "" || course.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(selectedCategory === category ? "" : category);
  };

  const handleRateCourse = (course) => {
    setSelectedCourse(course);
    setUserRating(0);
    setHoverRating(0);
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!user || userRating === 0) return;

    try {
      // Update course rating locally for demo
      const updatedCourses = courses.map(course => {
        if (course.id === selectedCourse.id) {
          const currentRatings = course.ratings || [];
          const newRatings = [...currentRatings, { userId: user.id, rating: userRating }];
          const avgRating = newRatings.reduce((sum, r) => sum + r.rating, 0) / newRatings.length;
          
          return {
            ...course,
            ratings: newRatings,
            rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
            totalRatings: newRatings.length
          };
        }
        return course;
      });

      setCourses(updatedCourses);
      setShowRatingModal(false);
      setSelectedCourse(null);
      setUserRating(0);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  const renderStars = (rating, isInteractive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= (isInteractive ? (hoverRating || userRating) : rating) ? 'filled' : 'empty'}`}
          onClick={isInteractive ? () => setUserRating(i) : undefined}
          onMouseEnter={isInteractive ? () => setHoverRating(i) : undefined}
          onMouseLeave={isInteractive ? () => setHoverRating(0) : undefined}
          style={{ cursor: isInteractive ? 'pointer' : 'default' }}
        >
          ★
        </span>
      );
    }
    return stars;
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

  return (
    <div className="course-list">
      {/* Back Button */}
      <div className="back-button-section">
        <button 
          className="btn-back" 
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h2>All Courses</h2>
      </div>

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
          {categoryList.map((category) => (
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
        {loading ? (
          <div className="loading">Loading courses...</div>
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div key={course.id} className="course-card-landing-compact">
              {course.thumbnail && (
                <div className="course-image">
                  <img src={course.thumbnail} alt={course.title} />
                  <div className="course-overlay">
                    <button className="btn-preview">
                      View Details
                    </button>
                    {user && user.role === "student" && (
                      <button 
                        className="btn-rate"
                        onClick={() => handleRateCourse(course)}
                      >
                        Rate Course
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="course-content">
                <div className="course-meta">
                  <span className="course-category">{course.category}</span>
                  <span className="course-level">{course.level}</span>
                </div>
                <h3 className="course-title">{course.title}</h3>
                
                {/* Rating Display */}
                <div className="course-rating">
                  <div className="stars">
                    {renderStars(course.rating || 0)}
                  </div>
                  <span className="rating-text">
                    {course.rating ? `${course.rating} (${course.totalRatings || 0} reviews)` : 'No ratings yet'}
                  </span>
                </div>
                
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

      {/* Rating Modal */}
      {showRatingModal && selectedCourse && (
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
              <h4>{selectedCourse.title}</h4>
              <p>How would you rate this course?</p>
              <div className="rating-stars">
                {renderStars(0, true)}
              </div>
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

export default CourseList;
