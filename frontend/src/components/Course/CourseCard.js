import React, { useState } from "react";
import axios from "axios";
import "../CSS/Courses.css";
import "../CSS/Button.css";

const CourseCard = ({ course, user, onEnroll }) => {
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState("");
  const handleEnroll = async () => {
    if (!user || user.role !== "student") {
      alert("Only students can enroll in courses.");
      return;
    }
    setEnrolling(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/courses/${course._id}/enroll`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("Successfully enrolled!");
      onEnroll(); // Refresh the course list
    } catch (error) {
      setMessage(error.response?.data?.message || "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };
  const isEnrolled =
    user &&
    course.enrolledStudents?.some(
      (enrollment) => enrollment.student.toString() === user.id.toString()
    );

  return (
    <div className="course-card">
      {course.thumbnail && (
        <div className="course-thumbnail">
          <img src={course.thumbnail} alt={course.title} />
        </div>
      )}

      <div className="course-content">
        <div className="course-header">
          <h3 className="course-title">{course.title}</h3>
          <div className="course-meta">
            <span className="course-category">{course.category}</span>
            <span className="course-level">{course.level}</span>
          </div>
        </div>

        <p className="course-description">{course.description}</p>

        <div className="course-details">
          <div className="course-instructor">
            <strong>Instructor:</strong> {course.instructorName}
          </div>
          <div className="course-duration">
            <strong>Duration:</strong> {course.duration}
          </div>
          <div className="course-enrollment">
            <strong>Enrolled:</strong> {course.enrolledStudents?.length || 0}/
            {course.maxStudents}
          </div>
        </div>

        <div className="course-footer">
          <div className="course-price">
            ${course.price === 0 ? "Free" : course.price}
          </div>

          {user && user.role === "student" && (
            <div className="course-actions">
              {isEnrolled ? (
                <button className="btn-enrolled" disabled>
                  Enrolled
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={
                    enrolling ||
                    course.enrolledStudents?.length >= course.maxStudents
                  }
                  className="btn-enroll"
                >
                  {enrolling ? "Enrolling..." : "Enroll Now"}
                </button>
              )}
            </div>
          )}
        </div>

        {message && (
          <div
            className={`message ${
              message.includes("Success") ? "success" : "error"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
