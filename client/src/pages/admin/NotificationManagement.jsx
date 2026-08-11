import "./notificationManagement.css";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FaPaperPlane,
  FaEdit,
  FaTrash,
  FaSearch
} from "react-icons/fa";

const notifications = [
  {
    id: 1,
    title: "Semester Exam Schedule",
    audience: "Students",
    date: "01 Aug 2026",
    status: "Sent"
  },
  {
    id: 2,
    title: "Faculty Meeting",
    audience: "Faculty",
    date: "30 Jul 2026",
    status: "Scheduled"
  },
  {
    id: 3,
    title: "Holiday Notice",
    audience: "Everyone",
    date: "28 Jul 2026",
    status: "Sent"
  },
  {
    id: 4,
    title: "Workshop Registration",
    audience: "Students",
    date: "25 Jul 2026",
    status: "Draft"
  }
];

export default function NotificationManagement() {

  return (

    <AdminLayout>

      <div className="notification-page">

        <div className="notification-header">

          <div>
            <h2>Notification Management</h2>
            <p>Create and manage campus notifications</p>
          </div>

        </div>

        <div className="notification-form">

          <h3>Create Notification</h3>

          <input
            type="text"
            placeholder="Notification Title"
          />

          <textarea
            rows="5"
            placeholder="Write notification..."
          ></textarea>

          <div className="form-row">

            <select>

              <option>Students</option>
              <option>Faculty</option>
              <option>Everyone</option>

            </select>

            <button>

              <FaPaperPlane />

              Send Notification

            </button>

          </div>

        </div>

        <div className="history-section">

          <div className="history-header">

            <h3>Notification History</h3>

            <div className="search-box">

              <FaSearch />

              <input
                type="text"
                placeholder="Search..."
              />

            </div>

          </div>

          <div className="table-card">

            <table>

              <thead>

                <tr>

                  <th>Title</th>
                  <th>Audience</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>

                </tr>

              </thead>

              <tbody>

                {notifications.map((item) => (

                  <tr key={item.id}>

                    <td>{item.title}</td>

                    <td>{item.audience}</td>

                    <td>{item.date}</td>

                    <td>

                      <span
                        className={`status ${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </span>

                    </td>

                    <td>

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

      </div>

    </AdminLayout>

  );

}