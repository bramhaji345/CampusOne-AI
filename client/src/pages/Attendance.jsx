import { useState } from "react";
import "./Attendance.css";

const students = [
  { id: 1, roll: "22CS001", name: "Rahul Kumar" },
  { id: 2, roll: "22CS002", name: "Priya Sharma" },
  { id: 3, roll: "22CS003", name: "Arjun Reddy" },
  { id: 4, roll: "22CS004", name: "Sneha Patel" },
  { id: 5, roll: "22CS005", name: "Aman Verma" },
];

function Attendance() {
  const [department, setDepartment] = useState("CSE");
  const [year, setYear] = useState("3rd Year");
  const [section, setSection] = useState("Section A");
  const [subject, setSubject] = useState("DBMS");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [attendance, setAttendance] = useState({});

  const handleStatus = (id, status) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const markAllPresent = () => {
    const updated = {};
    students.forEach((student) => {
      updated[student.id] = "Present";
    });
    setAttendance(updated);
  };

  const saveAttendance = () => {
    const attendanceData = {
      department,
      year,
      section,
      subject,
      date,
      students: students.map((student) => ({
        roll: student.roll,
        name: student.name,
        status: attendance[student.id] || "Absent",
      })),
    };

    console.log(attendanceData);

    alert("Attendance Saved Successfully!");
  };

  return (
    <div className="attendance-container">

      <h2>Attendance Entry</h2>

      <div className="filters">

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option>CSE</option>
          <option>ECE</option>
          <option>EEE</option>
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option>1st Year</option>
          <option>2nd Year</option>
          <option>3rd Year</option>
          <option>4th Year</option>
        </select>

        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
        >
          <option>Section A</option>
          <option>Section B</option>
        </select>

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option>DBMS</option>
          <option>Operating Systems</option>
          <option>Artificial Intelligence</option>
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

      </div>

      <div className="button-group">

        <button
          className="present-btn"
          onClick={markAllPresent}
        >
          Mark All Present
        </button>

        <button
          className="save-btn"
          onClick={saveAttendance}
        >
          Save Attendance
        </button>

      </div>

      <table className="attendance-table">

        <thead>

          <tr>
            <th>Roll No</th>
            <th>Student Name</th>
            <th>Status</th>
          </tr>

        </thead>

        <tbody>

          {students.map((student) => (

            <tr key={student.id}>

              <td>{student.roll}</td>

              <td>{student.name}</td>

              <td>

                <select
                  value={attendance[student.id] || ""}
                  onChange={(e) =>
                    handleStatus(student.id, e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Attendance;