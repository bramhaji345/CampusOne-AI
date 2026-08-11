import React from "react";
import { useNavigate } from "react-router-dom";
import "./timetable.css";

function Timetable() {

  const navigate = useNavigate();

  const timetable = [
    {
      time: "9:00 - 10:00",
      monday: "AI",
      tuesday: "SE",
      wednesday: "CN",
      thursday: "OS",
      friday: "AI",
      saturday: "PROJECT"
    },
    {
      time: "10:00 - 11:00",
      monday: "OS",
      tuesday: "AI",
      wednesday: "SE",
      thursday: "CN",
      friday: "Leisure Hour",
      saturday: "PROJECT"
    },
    {
      time: "11:00 - 12:00",
      monday: "CN",
      tuesday: "Leisure Hour",
      wednesday: "AI",
      thursday: "OS",
      friday: "SE",
      saturday: "PROJECT"
    },
    {
      time: "12:00 - 1:00",
      monday: "Lunch Break",
      tuesday: "Lunch Break",
      wednesday: "Lunch Break",
      thursday: "Lunch Break",
      friday: "Lunch Break",
      saturday: "Lunch Break"
    },
    {
      time: "1:00 - 2:00",
      monday: "OS Lab",
      tuesday: "SE Lab",
      wednesday: "CN Lab",
      thursday: "ENG Lab",
      friday: "Leisure Hour",
      saturday: "Library"
    },
    {
      time: "2:00 - 3:00",
      monday: "OS Lab",
      tuesday: "SE Lab",
      wednesday: "CN Lab",
      thursday: "ENG Lab",
      friday: "Placement",
      saturday: "Sports"
    },
    {
      time: "3:00 - 4:00",
      monday: "OS Lab",
      tuesday: "SE Lab",
      wednesday: "CN Lab",
      thursday: "ENG Lab",
      friday: "Mentor Hour",
      saturday: "Free"
    }
  ];

  return (

    <div className="timetable-page">

      <nav className="tt-navbar">

        <h2>📅 CampusOne AI Timetable</h2>

        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

      </nav>

      <div className="tt-container">

        <div className="table-section">

          <h2>Weekly Timetable</h2>

          <table>

            <thead>

              <tr>

                <th>Time</th>

                <th>Monday</th>

                <th>Tuesday</th>

                <th>Wednesday</th>

                <th>Thursday</th>

                <th>Friday</th>

                <th>Saturday</th>

              </tr>

            </thead>

            <tbody>

              {timetable.map((row, index) => (

                <tr key={index}>

                  <td>{row.time}</td>

                  <td>{row.monday}</td>

                  <td>{row.tuesday}</td>

                  <td>{row.wednesday}</td>

                  <td>{row.thursday}</td>

                  <td>{row.friday}</td>

                  <td>{row.saturday}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        <div className="ai-panel">

          <h2>🤖 AI Timetable Assistant</h2>

          <div className="ai-card">

            <h3>Today's Classes</h3>

            <ul>
              <li>Artificial Intelligence</li>
              <li>Operating Systems</li>
              <li>Computer Networks</li>
            </ul>

          </div>

          <div className="ai-card">

            <h3>Next Class</h3>

            <p><strong>Software Engineering</strong></p>
            <p>⏰ Starts in 30 Minutes</p>
            <p>🏫 Room CSE-302</p>

          </div>

          <div className="ai-card">

            <h3>Study Recommendation</h3>

            <p>
              Revise Operating Systems Unit-3 before tomorrow's lecture.
            </p>

          </div>

          <div className="ai-card">

            <h3>Attendance Prediction</h3>

            <p>Current Attendance : <strong>92%</strong></p>

            <p>Predicted Attendance : <strong>94%</strong></p>

          </div>

        </div>

      </div>

    </div>

  );

}

export default Timetable;