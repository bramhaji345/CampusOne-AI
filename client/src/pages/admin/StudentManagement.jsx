import "./studentManagement.css";
import AdminLayout from "../../layouts/AdminLayout";
import { FaSearch, FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const students = [
  {
    id: 1,
    roll: "22CSE001",
    name: "Rahul Sharma",
    dept: "CSE",
    year: "3rd",
    attendance: "94%",
  },
  {
    id: 2,
    roll: "22ECE012",
    name: "Anjali",
    dept: "ECE",
    year: "2nd",
    attendance: "91%",
  },
  {
    id: 3,
    roll: "22EEE023",
    name: "Ramesh",
    dept: "EEE",
    year: "4th",
    attendance: "88%",
  },
  {
    id: 4,
    roll: "22IT014",
    name: "Priya",
    dept: "IT",
    year: "1st",
    attendance: "97%",
  },
];

export default function StudentManagement() {
  return (
    <AdminLayout>
      <div className="student-page">

        <div className="student-header">
          <div>
            <h2>Student Management</h2>
            <p>Manage all students from one place</p>
          </div>

          <button className="add-btn">
            <FaPlus />
            Add Student
          </button>
        </div>

        <div className="toolbar">

          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search student..."
            />
          </div>

          <select>
            <option>All Departments</option>
            <option>CSE</option>
            <option>ECE</option>
            <option>EEE</option>
            <option>IT</option>
          </select>

        </div>

        <div className="table-card">

          <table>

            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Department</th>
                <th>Year</th>
                <th>Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {students.map((student) => (
                <tr key={student.id}>

                  <td>{student.roll}</td>

                  <td>{student.name}</td>

                  <td>{student.dept}</td>

                  <td>{student.year}</td>

                  <td>

                    <span className="attendance">
                      {student.attendance}
                    </span>

                  </td>

                  <td>

                    <button className="view">
                      <FaEye />
                    </button>

                    <button className="edit">
                      <FaEdit />
                    </button>

                    <button className="delete">
                      <FaTrash />
                    </button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>
    </AdminLayout>
  );
}