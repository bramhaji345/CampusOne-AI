import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/admin/Dashboard";
import StudentManagement from "./pages/admin/StudentManagement";
import FacultyManagement from "./pages/admin/FacultyManagement";
import CertificateManagement from "./pages/admin/CertificateManagement";
import NotificationManagement from "./pages/admin/NotificationManagement";
import Settings from "./pages/admin/Settings";
import Profile from "./pages/admin/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Redirect to Dashboard */}
        <Route path="/" element={<Navigate to="/admin/dashboard" />} />

        {/* Admin Routes */}
         <Route path="/admin/dashboard" element={<Dashboard />} />

         <Route path="/admin/students" element={<StudentManagement />} /> 

         <Route path="/admin/faculty" element={<FacultyManagement />} /> 

         <Route path="/admin/certificates" element={<CertificateManagement />} /> 

         <Route path="/admin/notifications" element={<NotificationManagement />} /> 

         <Route path="/admin/settings" element={<Settings />} /> 

         <Route path="/admin/profile" element={<Profile />} /> 

      </Routes>
    </BrowserRouter>
  );
}

export default App;