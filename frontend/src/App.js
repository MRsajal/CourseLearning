import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import "./App.css";
import "./components/CSS/Landing.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Register from "./components/Register";
import StudentDashboard from "./components/StudentDashboard";
import InstructorDashboard from "./components/InstructorDashboard";
import AdminDashboard from "./components/AdminDashboard";
import CourseLearning from "./components/Course/CourseLearning";
import QuizTaking from "./components/Quiz/QuizTaking";
import Certificate from "./components/Quiz/Certificate";
import LandingPage from "./components/Landing";
import CourseList from "./components/Course/CourseList";
import CourseDetails from "./components/Course/CourseDetails";
import LiveClassManagement from "./components/onlineClass/LiveClassManagement";
import LiveClass from "./components/onlineClass/LiveClass";
import axios from "axios";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   const userData = localStorage.getItem("user");

  //   if (token && userData) {
  //     setUser(JSON.parse(userData));
  //   }
  //   setLoading(false);
  // }, []);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }
  return (
    <Router>
      <div className="app-container">
        {user && <Navbar user={user} logout={logout} />}
        <div className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  // Redirect authenticated users to their dashboard
                  user.role === "student" ? (
                    <Navigate to="/student-dashboard" />
                  ) : user.role === "instructor" ? (
                    <Navigate to="/instructor-dashboard" />
                  ) : user.role === "admin" ? (
                    <Navigate to="/admin-dashboard" />
                  ) : (
                    <Navigate to="/courses" />
                  )
                ) : (
                  // Show landing page for non-authenticated users
                  <LandingPage />
                )
              }
            />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={`/${user.role}-dashboard`} />
                ) : (
                  <Login setUser={setUser} />
                )
              }
            />
            <Route
              path="/register"
              element={
                user ? (
                  <Navigate to={`/${user.role}-dashboard`} />
                ) : (
                  <Register />
                )
              }
            />
            <Route path="/courses" element={<CourseList user={user} />} />

            <Route path="/course/:id" element={<CourseDetails user={user} />} />
            <Route
              path="/student-dashboard"
              element={
                user && user.role === "student" ? (
                  <StudentDashboard user={user} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/instructor-dashboard"
              element={
                user && user.role === "instructor" ? (
                  <InstructorDashboard user={user} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/course/:courseId/live-classes"
              element={
                user ? <LiveClassManagement user={user} /> : <Navigate to="/" />
              }
            />

            <Route
              path="/live-class/:classId"
              element={user ? <LiveClass user={user} /> : <Navigate to="/" />}
            />
            <Route
              path="/quiz/:quizId/take"
              element={
                user && user.role === "student" ? (
                  <QuizTaking user={user} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/certificate/:certificateId"
              element={
                user ? <Certificate user={user} /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                user && user.role === "admin" ? (
                  <AdminDashboard user={user} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/course/:courseId/learn"
              element={
                user && user.role === "student" ? (
                  <CourseLearning user={user} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to={`/${user.role}-dashboard`} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </div>
        {user && <Footer />}
      </div>
    </Router>
  );
}
