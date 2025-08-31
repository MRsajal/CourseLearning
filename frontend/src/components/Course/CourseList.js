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
                  </div>
                </div>
              )}
              <div className="course-content">
                <div className="course-meta">
                  <span className="course-category">{course.category}</span>
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
    </div>
  );
};

export default CourseList;
