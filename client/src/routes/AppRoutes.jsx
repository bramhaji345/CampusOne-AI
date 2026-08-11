import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login/Login";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";

export default function AppRoutes() {
  return (
    <Routes>

      <Route path="/" element={<Login />} />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/student-dashboard"
        element={<div>Student Dashboard</div>}
      />

      <Route
        path="/faculty-dashboard"
        element={<div>Faculty Dashboard</div>}
      />

      <Route
        path="/admin-dashboard"
        element={<div>Admin Dashboard</div>}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}