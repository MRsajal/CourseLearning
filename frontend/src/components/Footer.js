import React from "react";
import "./CSS/Footer.css";

const Footer = () => {
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
          <h4>Connect</h4>
          <div className="social-links">
            <button className="social-link" aria-label="Facebook">
              📘
            </button>
            <button className="social-link" aria-label="Twitter">
              🐦
            </button>
            <button className="social-link" aria-label="LinkedIn">
              💼
            </button>
            <button className="social-link" aria-label="Instagram">
              📸
            </button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 EduPlatform. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
