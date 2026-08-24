import React from "react";
import "./announcement.css";

function Announcements() {

  const announcements = [
    {
      id: 1,
      title: "Mid Semester Examination",
      date: "10 August 2026",
      priority: "High",
      description:
        "Mid Semester Examinations will begin from 10 August 2026. Students are requested to download their hall tickets.",
    },
    {
      id: 2,
      title: "Holiday Notice",
      date: "15 August 2026",
      priority: "Medium",
      description:
        "The college will remain closed on Independence Day.",
    },
    {
      id: 3,
      title: "AI Workshop",
      date: "20 August 2026",
      priority: "Low",
      description:
        "Department of CSE is organizing an AI Workshop on Machine Learning and Generative AI.",
    },
    {
      id: 4,
      title: "Assignment Submission",
      date: "25 August 2026",
      priority: "High",
      description:
        "Submit all pending assignments before the deadline through the student portal.",
    },
  ];

  return (
    <div className="announcement-container">

      <h1>📢 Announcements</h1>

      {announcements.map((item) => (

        <div className="announcement-card" key={item.id}>

          <div className="announcement-header">

            <h2>{item.title}</h2>

            <span
              className={
                item.priority === "High"
                  ? "high"
                  : item.priority === "Medium"
                  ? "medium"
                  : "low"
              }
            >
              {item.priority}
            </span>

          </div>

          <p className="date">
            📅 {item.date}
          </p>

          <p className="description">
            {item.description}
          </p>

        </div>

      ))}

    </div>
  );
}

export default Announcements;