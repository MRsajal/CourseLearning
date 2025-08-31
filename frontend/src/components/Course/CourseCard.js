import React, { useState } from "react";
import "../CSS/Courses.css";
import "../CSS/Button.css";

const CourseCard = ({ course, user, onEnroll }) => {
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState("");
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentData, setPaymentData] = useState({
    method: "Bkash",
    transactionId: "",
  });

  const handleEnrollClick = () => {
    if (!user || user.role !== "student") {
      alert("Only students can enroll in courses.");
      return;
    }

    // If course is free, enroll directly
    if (course.price === 0) {
      handleEnroll();
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

    await handleEnroll();
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      // Since we're using static data, simulate enrollment
      setMessage("Successfully enrolled!");
      setShowPaymentPopup(false);
      setPaymentData({ method: "Bkash", transactionId: "" });

      // For static data, we can update the course locally
      // In a real app, this would be an API call
      if (onEnroll) {
        onEnroll(); // Refresh the course list
      }
    } catch (error) {
      setMessage("Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  const closePaymentPopup = () => {
    setShowPaymentPopup(false);
    setPaymentData({ method: "Bkash", transactionId: "" });
    setMessage("");
  };
  // For static data, we'll check enrollment status differently
  // In a real app, this would check against the backend
  const isEnrolled = false; // For now, assume no enrollment for static demo

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
            <strong>Enrolled:</strong>{" "}
            {Array.isArray(course.enrolledStudents)
              ? course.enrolledStudents.length
              : 0}{" "}
            students
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
                  onClick={handleEnrollClick}
                  disabled={enrolling}
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

      {/* Payment Popup */}
      {showPaymentPopup && (
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
                <h4>{course.title}</h4>
                <p className="price">Total: ${course.price}</p>
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
                      Send ${course.price} to our {paymentData.method} number
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
    </div>
  );
};

export default CourseCard;
