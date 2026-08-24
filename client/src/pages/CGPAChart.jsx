import React from "react";
import { Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
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

function CGPAChart() {

  const data = {
    labels: [
      "Sem 1",
      "Sem 2",
      "Sem 3",
      "Sem 4",
      "Sem 5",
      "Predicted Sem 6"
    ],

    datasets: [
      {
        label: "CGPA",

        data: [7.8, 8.2, 8.5, 8.9, 9.12, 9.28],

        borderColor: "#10B981",

        backgroundColor: "rgba(16,185,129,0.15)",

        fill: true,

        tension: 0.4,

        pointRadius: 5,

        pointHoverRadius: 8,

        pointBackgroundColor: "#10B981",
      },
    ],
  };

  const options = {

    responsive: true,

    maintainAspectRatio: false,

    plugins: {

      legend: {

        position: "top",

      },

      title: {

        display: true,

        text: "AI CGPA Prediction",

        font: {

          size: 18,

        },

      },

    },

    scales: {

      y: {

        min: 7,

        max: 10,

        ticks: {

          stepSize: 0.5,

        },

      },

    },

  };

  return (

    <div
      style={{
        height: "350px",
      }}
    >

      <Line
        data={data}
        options={options}
      />

    </div>

  );

}

export default CGPAChart;