import React, { useState } from "react";
import axios from "axios";
import "../CSS/Forms.css";
import "../CSS/Button.css";

const CreateCourse = ({ onCourseCreated }) => {
  const [formData, setFormData] = useState({
    title: "",
    descripton: "",
    category: "Technology",
    level: "Beginner",
    duration: "",
    price: "",
    maxStudents: "100",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleFileChange = (e) => {
    setThumbnail(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const formDatatoSend = new FormData();

      Object.keys(formData).forEach((key) => {
        formDatatoSend.append(key, formData[key]);
      });

      if (thumbnail) {
        formDatatoSend.append("thumbnail", thumbnail);
      }
      await axios.post("/api/courses", formDatatoSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage("Course created successfully!");
      setFormData({
        title: "",
        description: "",
        category: "Technology",
        level: "Beginner",
        duration: "",
        price: "",
        maxStudents: "100",
      });
      setThumbnail(null);

      if (onCourseCreated) {
        onCourseCreated();
      }
    } catch (error) {
      setMessage("Error creating course");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="create-course">
      <h2>Create New Course</h2>

      {message && (
        <div
          className={`message ${
            message.includes("success") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Course Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
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
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="level">Level *</label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              required
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration *</label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 4 weeks, 2 months"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxStudents">Max Students *</label>
            <input
              type="number"
              id="maxStudents"
              name="maxStudents"
              value={formData.maxStudents}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="thumbnail">Course Thumbnail</label>
          <input
            type="file"
            id="thumbnail"
            accept="image/*"
            onChange={handleFileChange}
          />
          <small>Upload an image for your course (max 5MB)</small>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Creating Course..." : "Create Course"}
        </button>
      </form>
    </div>
  );
};

export default CreateCourse;
