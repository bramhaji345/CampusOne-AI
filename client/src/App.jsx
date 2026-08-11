import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import StudentAttendance from "./pages/Attendance/StudentAttendance";
import StudentResults from "./pages/Results/StudentResults";
import Notifications from "./pages/Notifications/Notifications";
import StudentProfile from "./pages/Profile/StudentProfile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/attendance" element={<StudentAttendance />} />
      <Route path="/results" element={<StudentResults />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<StudentProfile />} />
    </Routes>
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import FacultyDashboard from "./pages/FacultyDashboard";
import Attendance from "./pages/Attendance";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<FacultyDashboard />} />
          <Route path="attendance" element={<Attendance />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;