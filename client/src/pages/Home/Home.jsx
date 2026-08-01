import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-container">
      <h1>Campus One AI</h1>

      <div className="module-list">
        <Link to="/attendance" className="module-card">
          📋 Attendance
        </Link>

        <Link to="/results" className="module-card">
          📊 Results
        </Link>

        <Link to="/notifications" className="module-card">
          🔔 Notifications
        </Link>

        <Link to="/profile" className="module-card">
          👤 Student Profile
        </Link>
      </div>
    </div>
  );
}

export default Home;