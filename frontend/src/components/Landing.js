import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import courseService from "../services/courseService";
import axios from "axios";

const LandingPage = () => {
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCourses();
    fetchStats();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      // Fetch database courses
      const dbCoursesResult = await courseService.getFeaturedCourses(10);
      let allCourses = dbCoursesResult.courses || [];

      // Add predefined courses if we need more to reach a good number for display
      const predefinedCourses = [
        {
          id: "pred-1",
          title: "Complete Web Development Bootcamp",
          description:
            "Learn HTML, CSS, JavaScript, React, Node.js and more in this comprehensive course.",
          category: "Web Development",
          level: "Beginner",
          price: 89.99,
          instructorName: "John Smith",
          thumbnail:
            "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=250&fit=crop",
          rating: 4.8,
          totalRatings: 1250,
          enrolledStudents: 3420,
        },
        {
          id: "pred-2",
          title: "Data Science with Python",
          description:
            "Master data analysis, visualization, and machine learning with Python.",
          category: "Data Science",
          level: "Intermediate",
          price: 129.99,
          instructorName: "Sarah Johnson",
          thumbnail:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
          rating: 4.9,
          totalRatings: 890,
          enrolledStudents: 2150,
        },
        {
          id: "pred-3",
          title: "Digital Marketing Masterclass",
          description:
            "Learn SEO, social media marketing, content marketing, and paid advertising.",
          category: "Marketing",
          level: "Beginner",
          price: 79.99,
          instructorName: "Mike Chen",
          thumbnail:
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
          rating: 4.7,
          totalRatings: 675,
          enrolledStudents: 1890,
        },
        {
          id: "pred-4",
          title: "Mobile App Development with React Native",
          description:
            "Build iOS and Android apps using React Native and JavaScript.",
          category: "Mobile Development",
          level: "Intermediate",
          price: 99.99,
          instructorName: "Emily Davis",
          thumbnail:
            "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop",
          rating: 4.6,
          totalRatings: 420,
          enrolledStudents: 1240,
        },
        {
          id: "pred-5",
          title: "Graphic Design Fundamentals",
          description:
            "Learn design principles, typography, color theory, and Adobe Creative Suite.",
          category: "Design",
          level: "Beginner",
          price: 69.99,
          instructorName: "Alex Rodriguez",
          thumbnail:
            "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop",
          rating: 4.5,
          totalRatings: 320,
          enrolledStudents: 980,
        },
        {
          id: "pred-6",
          title: "Cybersecurity Essentials",
          description:
            "Learn network security, ethical hacking, and cybersecurity best practices.",
          category: "Cybersecurity",
          level: "Intermediate",
          price: 149.99,
          instructorName: "David Wilson",
          thumbnail:
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop",
          rating: 4.8,
          totalRatings: 560,
          enrolledStudents: 1650,
        },
      ];

      // Combine database courses with predefined courses
      // If we have fewer than 6 database courses, add predefined ones
      if (allCourses.length < 6) {
        const neededCourses = 6 - allCourses.length;
        allCourses = [
          ...allCourses,
          ...predefinedCourses.slice(0, neededCourses),
        ];
      }

      // Limit to 6 courses for display
      setFeaturedCourses(allCourses.slice(0, 6));
    } catch (error) {
      console.error("Error fetching courses:", error);
      // Fallback to predefined courses only if API fails
      const fallbackCourses = [
        {
          id: "fallback-1",
          title: "Introduction to Programming",
          description:
            "Learn the basics of programming with JavaScript and Python.",
          category: "Programming",
          level: "Beginner",
          price: 0,
          instructorName: "Tech Academy",
          thumbnail:
            "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop",
          rating: 4.3,
          totalRatings: 150,
          enrolledStudents: 500,
        },
      ];
      setFeaturedCourses(fallbackCourses);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch real stats from API endpoints
      const statsResponse = await axios.get("/api/stats/platform");
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback to default stats if API fails
      setStats({
        totalCourses: 150,
        totalStudents: 2500,
        totalInstructors: 85,
        totalHours: 10000,
      });
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? "filled" : "empty"}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  const features = [
    {
      icon: "🎓",
      title: "Expert Instructors",
      description:
        "Learn from industry professionals with years of experience in their fields.",
    },
    {
      icon: "📱",
      title: "Mobile Learning",
      description:
        "Access your courses anywhere, anytime on any device with our responsive platform.",
    },
    {
      icon: "🏆",
      title: "Certificates",
      description:
        "Earn certificates upon course completion to showcase your new skills.",
    },
    {
      icon: "💬",
      title: "Interactive Learning",
      description:
        "Engage with quizzes, assignments, and interactive content for better learning.",
    },
    {
      icon: "⏱️",
      title: "Self-Paced",
      description:
        "Learn at your own pace with lifetime access to course materials.",
    },
    {
      icon: "🌟",
      title: "Quality Content",
      description:
        "High-quality video content, resources, and materials for effective learning.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Developer",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b1e0?w=100&h=100&fit=crop&crop=face",
      text: "This platform transformed my career. The courses are well-structured and the instructors are amazing!",
    },
    {
      name: "Michael Chen",
      role: "Data Scientist",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      text: "I love the flexibility and quality of content. I was able to learn new skills while working full-time.",
    },
    {
      name: "Emily Davis",
      role: "Marketing Manager",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      text: "The interactive quizzes and certificates really helped me advance in my career. Highly recommended!",
    },
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-text">EduPlatform</span>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="btn-login">
              Login
            </Link>
            <Link to="/register" className="btn-signup">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Learn New Skills
              <br />
              <span className="highlight">Advance Your Career</span>
            </h1>
            <p className="hero-description">
              Join thousands of learners worldwide and access high-quality
              courses taught by industry experts. Start your learning journey
              today!
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-primary-large">
                Get Started Free
              </Link>
              <Link to="/courses" className="btn-secondary-large">
                Browse Courses
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">
                  {stats.totalStudents.toLocaleString()}+
                </span>
                <span className="stat-label">Students</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.totalCourses}+</span>
                <span className="stat-label">Courses</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.totalInstructors}+</span>
                <span className="stat-label">Instructors</span>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <div className="hero-illustration">
              <div className="floating-card card-1">
                <div className="card-icon">📚</div>
                <div className="card-text">Interactive Lessons</div>
              </div>
              <div className="floating-card card-2">
                <div className="card-icon">🏆</div>
                <div className="card-text">Certificates</div>
              </div>
              <div className="floating-card card-3">
                <div className="card-icon">👥</div>
                <div className="card-text">Expert Instructors</div>
              </div>
              <div className="main-hero-graphic">
                <div className="hero-graphic-content">
                  <h3>Start Learning Today</h3>
                  <div className="progress-demo">
                    <div className="progress-bar-demo">
                      <div className="progress-fill-demo"></div>
                    </div>
                    <span>Course Progress: 75%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Our Platform?</h2>
            <p>
              Discover the features that make learning effective and enjoyable
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section id="courses" className="courses-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Courses</h2>
            <p>Explore our most popular courses and start learning today</p>
          </div>

          {loading ? (
            <div className="loading-courses">
              <div className="loading-spinner"></div>
              <p>Loading courses...</p>
            </div>
          ) : (
            <div className="courses-grid">
              {featuredCourses.map((course) => (
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
                        <Link to="/register" className="btn-preview">
                          Preview Course
                        </Link>
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
              ))}
            </div>
          )}

          <div className="courses-cta">
            <Link to="/register" className="btn-view-all">
              View All Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Students Say</h2>
            <p>Real success stories from our learning community</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <div className="quote-icon">"</div>
                  <p className="testimonial-text">{testimonial.text}</p>
                </div>
                <div className="testimonial-author">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="author-image"
                  />
                  <div className="author-info">
                    <h4 className="author-name">{testimonial.name}</h4>
                    <p className="author-role">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Learning?</h2>
            <p>
              Join thousands of students and advance your skills with our
              expert-led courses
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn-primary-large">
                Start Learning Today
              </Link>
              <Link to="/login" className="btn-secondary-large">
                Already have an account?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-brand">
                <span className="brand-icon">🎓</span>
                <span className="brand-text">EduPlatform</span>
              </div>
              <p className="footer-description">
                Empowering learners worldwide with high-quality online
                education.
              </p>
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#courses">Courses</a>
                </li>
                <li>
                  <a href="#about">About Us</a>
                </li>
                <li>
                  <a href="#contact">Contact</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Support</h4>
              <ul className="footer-links">
                <li>
                  <a href="#help">Help Center</a>
                </li>
                <li>
                  <a href="#faq">FAQ</a>
                </li>
                <li>
                  <a href="#privacy">Privacy Policy</a>
                </li>
                <li>
                  <a href="#terms">Terms of Service</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Connect</h4>
              <div className="social-links">
                <a href="#" className="social-link">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-facebook"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
                  </svg>
                </a>
                <a href="#" className="social-link">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-instagram"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
                  </svg>
                </a>
                <a href="#" className="social-link">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-telegram"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09" />
                  </svg>
                </a>
                <a href="#" className="social-link">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-twitter-x"
                    viewBox="0 0 16 16"
                  >
                    <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2025 LearnHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
