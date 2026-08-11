import React from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

import AttendanceChart from "./AttendanceChart";
import CGPAChart from "./CGPAChart";
import AIInsights from "./AIInsights";

function Dashboard() {

  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Announcements",
      icon: "📢",
      color: "#3B82F6",
      path: "/announcements",
    },
    {
      title: "Timetable",
      icon: "📅",
      color: "#10B981",
      path: "/timetable",
    },
    {
      title: "Fee Details",
      icon: "💰",
      color: "#F59E0B",
      path: "/fee-details",
    },
    {
      title: "Outpass Request",
      icon: "🚶",
      color: "#8B5CF6",
      path: "/outpass",
    },
    {
      title: "Results",
      icon: "📊",
      color: "#EF4444",
      path: "/results",
    },
    {
      title: "Quick Actions",
      icon: "⚡",
      color: "#06B6D4",
      path: "/quick-actions",
    },
  ];

  return (
    <div className="dashboard">

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">

        <div className="logo">
          <h2>🎓 CampusOne AI</h2>
        </div>

        <div className="nav-right">

          <button
            className="icon-btn"
            onClick={() => navigate("/announcements")}
          >
            🔔
          </button>

          <button
            className="icon-btn"
          >
            ⚙️
          </button>

          <button
            className="profile-btn"
            onClick={() => navigate("/profile")}
          >
            👤 Neharika
          </button>

        </div>

      </nav>

      {/* ================= WELCOME ================= */}

      <div className="welcome-card">

        <div>

          <h1>Welcome Back, Neharika 👋</h1>

          <p>
            Computer Science & Engineering
          </p>

          <p>
            3rd Year | Semester 5
          </p>

        </div>

      </div>

      {/* ================= OVERVIEW ================= */}

      <div className="overview-grid">

        <div className="overview-card attendance-card">

          <h3>🎯 AI Attendance</h3>

          <h1>92%</h1>

          <p>Predicted End Semester</p>

          <h4>94%</h4>

          <span className="badge green">
            Excellent
          </span>

        </div>

        <div className="overview-card cgpa-card">

          <h3>📈 AI CGPA Predictor</h3>

          <h1>9.12</h1>

          <p>Predicted CGPA</p>

          <h4>9.28</h4>

          <span className="badge blue">
            Outstanding
          </span>

        </div>

        <div className="overview-card">

          <h3>💰 Fee Details</h3>

          <h2>Paid</h2>

          <p>No Pending Fee</p>

        </div>

        <div className="overview-card">

          <h3>🚶 Outpass</h3>

          <h2>1 Pending</h2>

          <p>Awaiting Approval</p>

        </div>

      </div>

      {/* ================= CHARTS ================= */}

      <div className="charts-grid">

        <div className="chart-card">

          <h2>Attendance Trend</h2>

          <AttendanceChart />

        </div>

        <div className="chart-card">

          <h2>CGPA Progress</h2>

          <CGPAChart />

        </div>

      </div>

      {/* ================= AI INSIGHTS ================= */}

      <AIInsights />

      {/* ================= QUICK ACTIONS ================= */}

      <h2 className="section-title">
        ⚡ Quick Actions
      </h2>

      <div className="action-grid">

        {quickActions.map((item, index) => (

          <div
            key={index}
            className="action-card"
            onClick={() => navigate(item.path)}
          >

            <div
              className="action-icon"
              style={{
                background: item.color,
              }}
            >
              {item.icon}
            </div>

            <h3>{item.title}</h3>

          </div>

        ))}

      </div>

      {/* ================= ANNOUNCEMENTS ================= */}

      <h2 className="section-title">

        📢 Recent Announcements

      </h2>

      <div className="announcement-card">

        <h3>
          Mid Semester Examination
        </h3>

        <p>
          Mid Semester Examinations will begin on
          <strong> 10 August 2026.</strong>
          Download your Hall Ticket before the exam.
        </p>

      </div>

      <div className="announcement-card">

        <h3>
          AI Workshop
        </h3>

        <p>
          Register before
          <strong> 18 August 2026</strong>
          to attend the Generative AI Workshop.
        </p>

      </div>

    </div>
  );
}

export default Dashboard;