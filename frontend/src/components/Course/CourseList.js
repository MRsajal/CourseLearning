import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import CourseCard from "./CourseCard";
import "../CSS/Courses.css";
import "../CSS/Button.css";

const CourseList = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "all",
    level: "all",
    search: "",
  });

  const fetchCourses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category !== "all")
        params.append("category", filters.category);
      if (filters.level !== "all") params.append("level", filters.level);
      if (filters.search) params.append("search", filters.search);
      const response = await axios.get(`/api/courses?${params.toString()}`);
      setCourses(response.data.courses || response.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
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
      <div className="course-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search courses..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="Business">Business</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Health">Health</option>
            <option value="Music">Music</option>
            <option value="Language">Language</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.level}
            onChange={(e) => handleFilterChange("level", e.target.value)}
            className="filter-select"
          >
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="no-courses">
            <p>No courses found matching your criteria.</p>
          </div>
        ) : (
          courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              user={user}
              onEnroll={fetchCourses}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CourseList;
