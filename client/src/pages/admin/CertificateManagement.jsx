import "./certificateManagement.css";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FaSearch,
  FaEye,
  FaCheck,
  FaTimes,
  FaDownload
} from "react-icons/fa";

const certificates = [
  {
    id: 1,
    student: "Rahul Sharma",
    roll: "22CSE001",
    type: "Bonafide",
    date: "01 Aug 2026",
    status: "Pending",
  },
  {
    id: 2,
    student: "Priya",
    roll: "22IT014",
    type: "Study Certificate",
    date: "30 Jul 2026",
    status: "Approved",
  },
  {
    id: 3,
    student: "Ramesh",
    roll: "22EEE023",
    type: "Transfer Certificate",
    date: "28 Jul 2026",
    status: "Rejected",
  },
  {
    id: 4,
    student: "Anjali",
    roll: "22ECE012",
    type: "Conduct Certificate",
    date: "25 Jul 2026",
    status: "Pending",
  },
];

export default function CertificateManagement() {
  return (
    <AdminLayout>
      <div className="certificate-page">

        <div className="certificate-header">
          <div>
            <h2>Certificate Management</h2>
            <p>Manage all certificate requests</p>
          </div>
        </div>

        <div className="toolbar">

          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search Student..."
            />
          </div>

          <select>
            <option>All Certificates</option>
            <option>Bonafide</option>
            <option>Study Certificate</option>
            <option>Transfer Certificate</option>
            <option>Conduct Certificate</option>
          </select>

        </div>

        <div className="table-card">

          <table>

            <thead>

              <tr>

                <th>Student</th>
                <th>Roll No</th>
                <th>Certificate</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {certificates.map((item) => (

                <tr key={item.id}>

                  <td>{item.student}</td>

                  <td>{item.roll}</td>

                  <td>{item.type}</td>

                  <td>{item.date}</td>

                  <td>

                    <span
                      className={`status ${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>

                  </td>

                  <td>

                    <button className="view">
                      <FaEye />
                    </button>

                    <button className="approve">
                      <FaCheck />
                    </button>

                    <button className="reject">
                      <FaTimes />
                    </button>

                    <button className="download">
                      <FaDownload />
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