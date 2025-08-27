import React from "react";
import CourseMaterials from "./CourseMaterials";
import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import "../CSS/Courses.css";
import "../CSS/Button.css";

const CourseDetails = ({ user }) => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchCourse();
  }, [courseId]);
  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}`);
      setCourse(response.data);
    } catch (error) {
      console.error("Error fetching course details:", error);
    } finally {
      setLoading(false);
    }
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
  if (!course) {
    return <div className="error">Course not found</div>;
  }

  const isOwner = user && course.instructor._id === user.id;
  const isEnrolled =
    user &&
    course.enrolledStudents?.some(
      (enrollment) => enrollment.student === user.id
    );
  const hasAccess = isOwner || isEnrolled || user?.role === "admin";

  return (
    <div className="course-details">
      <div className="course-header">
        <div className="course-info">
          <h1>{course.title}</h1>
          <p className="course-instructor">by {course.instructorName}</p>
          <div className="course-meta">
            <span className="course-category">{course.category}</span>
            <span className="course-level">{course.level}</span>
            <span className="course-duration">{course.duration}</span>
          </div>
        </div>
        {course.thumbnail && (
          <div className="course-thumbnail-large">
            <img src={course.thumbnail} alt={course.title} />
          </div>
        )}
      </div>

      <div className="course-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        {hasAccess && (
          <button
            className={`tab-btn ${activeTab === "materials" ? "active" : ""}`}
            onClick={() => setActiveTab("materials")}
          >
            Materials
          </button>
        )}
      </div>

      <div className="course-content">
        {activeTab === "overview" && (
          <div className="course-overview">
            <div className="course-description">
              <h3>About This Course</h3>
              <p>{course.description}</p>
            </div>

            <div className="course-stats">
              <div className="stat">
                <strong>Students Enrolled:</strong>{" "}
                {course.enrolledStudents?.length || 0}
              </div>
              <div className="stat">
                <strong>Price:</strong> $
                {course.price === 0 ? "Free" : course.price}
              </div>
              <div className="stat">
                <strong>Duration:</strong> {course.duration}
              </div>
            </div>
          </div>
        )}

        {activeTab === "materials" && hasAccess && (
          <CourseMaterials courseId={courseId} user={user} isOwner={isOwner} />
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
