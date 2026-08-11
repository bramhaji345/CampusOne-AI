import React from "react";
import "./dashboard.css";

function AIInsights() {
  const insights = [
    {
      id: 1,
      icon: "🎯",
      title: "AI Attendance Prediction",
      description:
        "Based on your attendance pattern, you are expected to maintain approximately 94% attendance by the end of the semester.",
      status: "Excellent"
    },

    {
      id: 2,
      icon: "📈",
      title: "AI CGPA Prediction",
      description:
        "Your current academic performance suggests an estimated CGPA of 9.28. Continue your current preparation to achieve this goal.",
      status: "Outstanding"
    },

    {
      id: 3,
      icon: "🤖",
      title: "AI Recommendation",
      description:
        "Focus more on Data Structures and Artificial Intelligence subjects this week. Completing assignments on time can further improve your CGPA.",
      status: "Recommended"
    },

    {
      id: 4,
      icon: "⭐",
      title: "Performance Analysis",
      description:
        "You are performing better than 88% of students in your department based on attendance, CGPA and academic consistency.",
      status: "Top Performer"
    }
  ];

  return (
    <div className="ai-insights-container">

      <h2 className="section-title">
        🤖 AI Insights
      </h2>

      <div className="insights-grid">

        {insights.map((item) => (

          <div
            className="insight-card"
            key={item.id}
          >

            <div className="insight-icon">
              {item.icon}
            </div>

            <div className="insight-content">

              <h3>{item.title}</h3>

              <p>{item.description}</p>

              <span className="status-badge">
                {item.status}
              </span>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default AIInsights;