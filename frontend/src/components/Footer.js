import React, { useState } from "react";
import "./CSS/Footer.css";

const Footer = () => {
  const [reviewData, setReviewData] = useState({
    name: "",
    email: "",
    rating: 0,
    feedback: "",
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingClick = (rating) => {
    setReviewData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!reviewData.name || !reviewData.email || !reviewData.feedback || reviewData.rating === 0) {
      setMessage("Please fill in all fields and provide a rating.");
      return;
    }

    setSubmitting(true);
    try {
      // Send review data to backend
      const response = await fetch('http://localhost:5000/api/send-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: reviewData.name,
          email: reviewData.email,
          rating: reviewData.rating,
          message: reviewData.feedback,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message || "Thank you for your review! We appreciate your feedback.");
        setReviewData({ name: "", email: "", rating: 0, feedback: "" });
        setTimeout(() => {
          setShowReviewModal(false);
          setMessage("");
        }, 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to send review. Please try again.");
      }
    } catch (error) {
      console.error("Error sending review:", error);
      setMessage("Failed to send review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : ''}`}
          onClick={interactive ? () => handleRatingClick(i) : undefined}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-brand">
            <span className="brand-icon">🎓</span>
            <span className="brand-text">EduPlatform</span>
          </div>
          <p className="footer-description">
            Empowering learners worldwide with high-quality online education.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li>
              <a href="/courses">Courses</a>
            </li>
            <li>
              <a href="/about">About Us</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
            <li>
              <a href="/help">Help Center</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <ul className="footer-links">
            <li>
              <a href="/help">Help Center</a>
            </li>
            <li>
              <a href="/faq">FAQ</a>
            </li>
            <li>
              <a href="/privacy">Privacy Policy</a>
            </li>
            <li>
              <a href="/terms">Terms of Service</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Review Our Platform</h4>
          <p className="footer-description">
            Share your experience and help us improve our platform!
          </p>
          <button
            className="review-button"
            onClick={() => setShowReviewModal(true)}
          >
            ⭐ Write a Review
          </button>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 EduPlatform. All rights reserved.</p>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Review Our Website</h3>
              <p>Your feedback helps us improve! Please share your experience with our platform.</p>
              <button
                className="close-button"
                onClick={() => setShowReviewModal(false)}
              >
                ×
              </button>
            </div>

            <form className="review-form" onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label htmlFor="name">Your Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={reviewData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Your Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={reviewData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <div className="star-rating">
                <label>Overall Rating *</label>
                <div className="stars">
                  {renderStars(reviewData.rating, true)}
                </div>
                <span className="rating-text">
                  {reviewData.rating > 0 ? `${reviewData.rating}/5` : "Click to rate"}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="feedback">Your Feedback *</label>
                <textarea
                  id="feedback"
                  name="feedback"
                  value={reviewData.feedback}
                  onChange={handleInputChange}
                  required
                  rows="5"
                  placeholder="Tell us about your experience with our platform..."
                />
              </div>

              {message && (
                <div className={`${message.includes('Thank you') ? 'success-message' : 'error-message'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? <span className="loading">Sending Review</span> : "Send Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
