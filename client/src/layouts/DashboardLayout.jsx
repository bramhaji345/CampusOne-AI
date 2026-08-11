import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../App.css";

function DashboardLayout() {
  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;