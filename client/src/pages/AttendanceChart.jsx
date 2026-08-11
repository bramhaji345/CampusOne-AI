import React from "react";
import {
  Line
} from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function AttendanceChart() {

  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug"
    ],

    datasets: [

      {
        label: "Attendance (%)",

        data: [82, 85, 88, 90, 91, 92, 93, 94],

        borderColor: "#2563eb",

        backgroundColor: "rgba(37,99,235,0.15)",

        fill: true,

        tension: 0.4,

        pointRadius: 5,

        pointHoverRadius: 7,

        pointBackgroundColor: "#2563eb"
      },

      {
        label: "Minimum Required (75%)",

        data: [75,75,75,75,75,75,75,75],

        borderColor: "#ef4444",

        borderDash: [8,5],

        pointRadius: 0,

        fill: false
      }

    ]
  };

  const options = {

    responsive: true,

    maintainAspectRatio: false,

    plugins: {

      legend: {
        position: "top"
      },

      title: {

        display: true,

        text: "AI Attendance Prediction"

      }

    },

    scales: {

      y: {

        min: 60,

        max: 100,

        ticks: {

          stepSize: 5

        }

      }

    }

  };

  return (

    <div
      style={{
        height: "350px"
      }}
    >

      <Line
        data={data}
        options={options}
      />

    </div>

  );

}

export default AttendanceChart;