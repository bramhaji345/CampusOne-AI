import React from "react";
import "./Navbar.css";

function Navbar() {
  return (
    <div className="navbar">
      <div className="navbar-left">
        <h2>Faculty Dashboard</h2>
      </div>

      <div className="navbar-right">
        <span className="notification">🔔</span>

        <div className="profile">
          <div className="profile-icon">👤</div>
          <span>Faculty</span>
        </div>
      </div>
    </div>
  );
}

export default Navbar;