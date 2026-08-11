import {
  FaHome,
  FaUserGraduate,
  FaClipboardCheck,
  FaBook,
  FaTasks,
  FaCalendarAlt,
  FaBell,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";

import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>Faculty Portal</h2>

      <ul>
        <li>
          <NavLink to="/" className="nav-link">
            <FaHome />
            <span>Dashboard</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/attendance" className="nav-link">
            <FaClipboardCheck />
            <span>Attendance</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/students" className="nav-link">
            <FaUserGraduate />
            <span>Students</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/marks" className="nav-link">
            <FaBook />
            <span>Marks</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/assignments" className="nav-link">
            <FaTasks />
            <span>Assignments</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/timetable" className="nav-link">
            <FaCalendarAlt />
            <span>Timetable</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/notices" className="nav-link">
            <FaBell />
            <span>Notices</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/profile" className="nav-link">
            <FaUser />
            <span>Profile</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/logout" className="nav-link">
            <FaSignOutAlt />
            <span>Logout</span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;