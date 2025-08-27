import React from "react";
import { Link } from "react-router";
import "./CSS/Navigation.css";

const Navbar = ({ user, logout }) => {
  return (
    <nav className="navbar">
      <div className="nav-content">
        <Link to="/" className="logo">
          EduPlatform
        </Link>
        <div className="nav-links">
          <span className="nav-link">Welcome, {user.name}</span>
          <span className="nav-link">Role: {user.role}</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
