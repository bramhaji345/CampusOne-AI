import React, { useState } from "react";
import ResultsData from "./ResultsData";
import "./StudentResults.css";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function StudentResults() {
  const [selected, setSelected] = useState(ResultsData.semesters[0]);

  const downloadPDF = () => {
    const input = document.getElementById("result-card");

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      pdf.save(`${selected.year}-${selected.semester}.pdf`);
    });
  };

  return (
    <div className="results-container">

      <h1>Student Results</h1>

      {/* Student Details */}

      <div className="student-card">

        <div>
          <h2>{ResultsData.student.name}</h2>
          <p><strong>Roll No:</strong> {ResultsData.student.rollNo}</p>
        </div>

        <div>
          <p><strong>Department:</strong> {ResultsData.student.department}</p>
          <p><strong>Year:</strong> {ResultsData.student.year}</p>
        </div>

        <div>
          <p><strong>Semester:</strong> {ResultsData.student.semester}</p>
          <p><strong>Section:</strong> {ResultsData.student.section}</p>
        </div>

        <div>
          <p><strong>CGPA:</strong> {ResultsData.student.cgpa}</p>
          <p><strong>Academic Year:</strong> {ResultsData.student.academicYear}</p>
        </div>

      </div>

      {/* Semester Dropdown */}

      <div className="select-box">

        <select
          value={ResultsData.semesters.indexOf(selected)}
          onChange={(e) =>
            setSelected(ResultsData.semesters[e.target.value])
          }
        >
          {ResultsData.semesters.map((sem, index) => (
            <option key={index} value={index}>
              {sem.year} - {sem.semester}
            </option>
          ))}
        </select>

      </div>

      {/* Buttons */}

      <div className="action-buttons">

        <button
          className="print-btn"
          onClick={() => window.print()}
        >
          🖨 Print
        </button>

        <button
          className="download-btn"
          onClick={downloadPDF}
        >
          ⬇ Download PDF
        </button>

      </div>

      {/* Result Card */}

      <div className="result-card" id="result-card">

        <h2>
          {selected.year} - {selected.semester}
        </h2>

        <p>
          <strong>Exam :</strong> {selected.exam}
        </p>

        <div className="summary">

          <div>
            <h3>SGPA</h3>
            <p>{selected.sgpa}</p>
          </div>

          <div>
            <h3>CGPA</h3>
            <p>{selected.cgpa}</p>
          </div>

          <div>
            <h3>Status</h3>
            <p>{selected.result}</p>
          </div>

        </div>

        {selected.subjects.length === 0 ? (

          <div className="no-result">

            <h2>Result Not Available</h2>

            <p>
              This semester result is not available because it is currently
              being pursued.
            </p>

          </div>

        ) : (

          <table>

            <thead>

              <tr>
                <th>Code</th>
                <th>Subject</th>
                <th>Marks</th>
                <th>Grade</th>
              </tr>

            </thead>

            <tbody>

              {selected.subjects.map((sub) => (

                <tr key={sub.code}>
                  <td>{sub.code}</td>
                  <td>{sub.subject}</td>
                  <td>{sub.marks}</td>
                  <td>{sub.grade}</td>
                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}

export default StudentResults;