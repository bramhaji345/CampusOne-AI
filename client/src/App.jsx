import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

// Import Pages
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/profile";
import EditProfile from "./pages/editprofile";
import Announcements from "./pages/announcement";
import Timetable from "./pages/Timetable";

function App() {

  // Student Data
  const [student, setStudent] = useState({
    name: "Neharika Kandipati",
    rollNo: "22CSE001",
    department: "Computer Science and Engineering",
    year: "3rd Year",
    semester: "Semester 5",
    email: "student@campusone.com",
    phone: "9876543210",
    gender: "Female",
    dob: "2005-05-12",
    bloodGroup: "O+",
    cgpa: "9.12",
    attendance: "92%",
    address: "Hyderabad, Telangana",
    profileImage: "https://i.pravatar.cc/200"
  });

  return (
    <BrowserRouter>

      <Routes>

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <Profile
              student={student}
              setStudent={setStudent}
            />
          }
        />

        {/* Edit Profile */}
        <Route
          path="/edit-profile"
          element={
            <EditProfile
              student={student}
              setStudent={setStudent}
            />
          }
        />

        {/* Announcements */}
        <Route
          path="/announcements"
          element={<Announcements />}
        />

        {/* Timetable */}
        <Route
          path="/timetable"
          element={<Timetable />}
        />

        {/* Invalid Route */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;