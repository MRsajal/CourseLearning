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
          id: 'pred-1',
          title: 'Complete Web Development Bootcamp',
          description: 'Learn HTML, CSS, JavaScript, React, Node.js and more in this comprehensive course.',
          category: 'Web Development',
          level: 'Beginner',
          price: 89.99,
          instructorName: 'John Smith',
          thumbnail: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=250&fit=crop',
          rating: 4.8,
          totalRatings: 1250,
          enrolledStudents: 3420
        },
        {
          id: 'pred-2',
          title: 'Data Science with Python',
          description: 'Master data analysis, visualization, and machine learning with Python.',
          category: 'Data Science',
          level: 'Intermediate',
          price: 129.99,
          instructorName: 'Sarah Johnson',
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
          rating: 4.9,
          totalRatings: 890,
          enrolledStudents: 2150
        },
        {
          id: 'pred-3',
          title: 'Digital Marketing Masterclass',
          description: 'Learn SEO, social media marketing, content marketing, and paid advertising.',
          category: 'Marketing',
          level: 'Beginner',
          price: 79.99,
          instructorName: 'Mike Chen',
          thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
          rating: 4.7,
          totalRatings: 675,
          enrolledStudents: 1890
        },
        {
          id: 'pred-4',
          title: 'Mobile App Development with React Native',
          description: 'Build iOS and Android apps using React Native and JavaScript.',
          category: 'Mobile Development',
          level: 'Intermediate',
          price: 99.99,
          instructorName: 'Emily Davis',
          thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
          rating: 4.6,
          totalRatings: 420,
          enrolledStudents: 1240
        },
        {
          id: 'pred-5',
          title: 'Graphic Design Fundamentals',
          description: 'Learn design principles, typography, color theory, and Adobe Creative Suite.',
          category: 'Design',
          level: 'Beginner',
          price: 69.99,
          instructorName: 'Alex Rodriguez',
          thumbnail: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop',
          rating: 4.5,
          totalRatings: 320,
          enrolledStudents: 980
        },
        {
          id: 'pred-6',
          title: 'Cybersecurity Essentials',
          description: 'Learn network security, ethical hacking, and cybersecurity best practices.',
          category: 'Cybersecurity',
          level: 'Intermediate',
          price: 149.99,
          instructorName: 'David Wilson',
          thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=250&fit=crop',
          rating: 4.8,
          totalRatings: 560,
          enrolledStudents: 1650
        }
      ];

      // Combine database courses with predefined courses
      // If we have fewer than 6 database courses, add predefined ones
      if (allCourses.length < 6) {
        const neededCourses = 6 - allCourses.length;
        allCourses = [...allCourses, ...predefinedCourses.slice(0, neededCourses)];
      }

      // Limit to 6 courses for display
      setFeaturedCourses(allCourses.slice(0, 6));
    } catch (error) {
      console.error("Error fetching courses:", error);
      // Fallback to predefined courses only if API fails
      const fallbackCourses = [
        {
          id: 'fallback-1',
          title: 'Introduction to Programming',
          description: 'Learn the basics of programming with JavaScript and Python.',
          category: 'Programming',
          level: 'Beginner',
          price: 0,
          instructorName: 'Tech Academy',
          thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
          rating: 4.3,
          totalRatings: 150,
          enrolledStudents: 500
        }
      ];
      setFeaturedCourses(fallbackCourses);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch real stats from API endpoints
      const statsResponse = await axios.get('/api/stats/platform');
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
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : 'empty'}`}
        >
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
                            {renderStars(course.averageRating || course.rating || 0)}
                          </div>
                          <span className="rating-text-hover">
                            {(course.averageRating || course.rating) 
                              ? `${course.averageRating || course.rating} (${course.totalRatings || 0})` 
                              : 'No ratings'}
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
                          👥 {Array.isArray(course.enrolledStudents) 
                            ? course.enrolledStudents.length 
                            : (course.enrolledStudents || 0)} students
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
                  📘
                </a>
                <a href="#" className="social-link">
                  🐦
                </a>
                <a href="#" className="social-link">
                  💼
                </a>
                <a href="#" className="social-link">
                  📸
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
