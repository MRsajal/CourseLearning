import React from "react";
import "./CSS/Dashboard.css";
import "./CSS/Table.css";
import "./CSS/Button.css";

const AdminDashboard = ({ user }) => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="user-info">
          <p>Welcome back, {user.name}!</p>
          <p>Email: {user.email}</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>User Management</h3>
          <p>
            Manage all users in the system. Add, remove, or modify user accounts
            and permissions.
          </p>
        </div>

        <div className="dashboard-card">
          <h3>Course Administration</h3>
          <p>
            Oversee all courses, approve new course proposals, and manage course
            schedules.
          </p>
        </div>

        <div className="dashboard-card">
          <h3>System Analytics</h3>
          <p>
            View comprehensive system statistics, user engagement metrics, and
            platform performance data.
          </p>
        </div>

        <div className="dashboard-card">
          <h3>Content Moderation</h3>
          <p>
            Review and moderate user-generated content, manage reports, and
            ensure platform guidelines.
          </p>
        </div>

        <div className="dashboard-card">
          <h3>Financial Management</h3>
          <p>
            Track platform revenue, manage instructor payments, and oversee
            subscription management.
          </p>
        </div>

        <div className="dashboard-card">
          <h3>System Settings</h3>
          <p>
            Configure platform settings, manage integrations, and control
            system-wide preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
