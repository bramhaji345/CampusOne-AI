import React from "react";
import "./StudentAttendance.css";

const subjects = [
  {
    code: "CS501",
    name: "Computer Networks",
    faculty: "Prof. Mallikarjuna sir",
    percentage: 79,
    attended: 38,
    total: 48,
  },
  {
    code: "CS502",
    name: "Operating Systems",
    faculty: "Prof. sampath sir",
    percentage: 68,
    attended: 30,
    total: 44,
  },
  {
    code: "CS503",
    name: "Software Engineering",
    faculty: "Prof. sindhu ruth mam",
    percentage: 80,
    attended: 40,
    total: 50,
  },
  {
    code: "CS504",
    name: "Artificial intelligence",
    faculty: "Prof. Madhavi Latha mam",
    percentage: 67,
    attended: 28,
    total: 42,
  },
  {
    code: "CS505",
    name: "English",
    faculty: "Prof. Samuel sir",
    percentage: 80,
    attended: 35,
    total: 44,
  },
  {
    code: "CS506",
    name: "Machine Learning",
    faculty: "Prof. Kiran Sir",
    percentage: 78,
    attended: 36,
    total: 46,
  },
];

function StudentAttendance() {
  const getStatus = (p) => {
    if (p >= 80) return "SAFE";
    if (p >= 75) return "CAUTION";
    return "AT RISK";
  };

  const getColor = (p) => {
    if (p >= 80) return "#10b981";
    if (p >= 75) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="attendance-page">

      <div className="top-header">
        <div>
          <h2>Subject-wise Attendance</h2>
          <p>Semester 5 • 6 Subjects</p>
        </div>

        <div className="overall-card">
          <h3>Overall</h3>
          <h1>75%</h1>
        </div>
      </div>

      <div className="subject-grid">

        {subjects.map((sub) => (

          <div className="subject-card" key={sub.code}>

            <div className="card-top">

              <span className="code">{sub.code}</span>

              <span
                className="status"
                style={{ color: getColor(sub.percentage) }}
              >
                {getStatus(sub.percentage)}
              </span>

            </div>

            <h3>{sub.name}</h3>

            <p>{sub.faculty}</p>

            <h1
              style={{
                color: getColor(sub.percentage),
              }}
            >
              {sub.percentage}%
            </h1>

            <div className="progress">

              <div
                className="fill"
                style={{
                  width: `${sub.percentage}%`,
                  background: getColor(sub.percentage),
                }}
              ></div>

            </div>

            <p className="classes">
              {sub.attended}/{sub.total} Classes
            </p>

          </div>

        ))}

      </div>

      <div className="bottom-section">

        <div className="today-card">
          <h3>Today's Classes</h3>

          <ul>
            <li>Software Engineering - 9:30 AM</li>
            <li>Operating Systems - 10:30 AM</li>
            <li>Computer Network - 11:40 PM</li>
            <li>English Lab - 1:30 PM</li>
          </ul>

        </div>

        <div className="summary-card">

          <h3>Attendance Summary</h3>

          <p>Present : 164</p>

          <p>Absent : 36</p>

          <p>Total Classes : 200</p>

        </div>

      </div>

    </div>
  );
}

export default StudentAttendance;