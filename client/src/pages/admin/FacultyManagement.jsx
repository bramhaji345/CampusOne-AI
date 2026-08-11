import "./facultyManagement.css";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash
} from "react-icons/fa";

const faculty = [
  {
    id: 1,
    empId: "FAC001",
    name: "Dr. Ravi Kumar",
    department: "CSE",
    designation: "Professor",
    experience: "12 Years",
    email: "ravi@campusone.ai"
  },
  {
    id: 2,
    empId: "FAC002",
    name: "Dr. Priya Sharma",
    department: "ECE",
    designation: "Associate Professor",
    experience: "9 Years",
    email: "priya@campusone.ai"
  },
  {
    id: 3,
    empId: "FAC003",
    name: "Mr. Arjun",
    department: "IT",
    designation: "Assistant Professor",
    experience: "5 Years",
    email: "arjun@campusone.ai"
  },
  {
    id: 4,
    empId: "FAC004",
    name: "Mrs. Sneha",
    department: "EEE",
    designation: "Lecturer",
    experience: "4 Years",
    email: "sneha@campusone.ai"
  }
];

export default function FacultyManagement() {
  return (
    <AdminLayout>

      <div className="faculty-page">

        <div className="faculty-header">

          <div>
            <h2>Faculty Management</h2>
            <p>Manage all faculty members</p>
          </div>

          <button className="add-btn">
            <FaPlus />
            Add Faculty
          </button>

        </div>

        <div className="toolbar">

          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search Faculty..."
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

                <th>Faculty ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Experience</th>
                <th>Email</th>
                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {faculty.map((item) => (

                <tr key={item.id}>

                  <td>{item.empId}</td>

                  <td>{item.name}</td>

                  <td>{item.department}</td>

                  <td>{item.designation}</td>

                  <td>{item.experience}</td>

                  <td>{item.email}</td>

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