import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentLayout, { FacultyLayout, AdminLayout } from './pages/layouts';
import StudentDashboard from './pages/student/Dashboard';
import StudentResults from './pages/student/Results';
import StudentAttendance from './pages/student/Attendance';
import TimetablePage from './pages/student/Timetable';
import StudentAssignments from './pages/student/Assignments';
import StudentOutpasses from './pages/student/Outpasses';
import StudentCertificates from './pages/student/Certificates';
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyAttendance from './pages/faculty/Attendance';
import FacultyMarks from './pages/faculty/Marks';
import FacultyOutpasses from './pages/faculty/Outpasses';
import FacultyAssignments from './pages/faculty/Assignments';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminFaculty from './pages/admin/Faculty';
import AdminCertificates from './pages/admin/Certificates';
import AdminScanner from './pages/admin/Scanner';
import AdminAuditLogs from './pages/admin/AuditLogs';
import ProfilePage from './pages/shared/Profile';
import SettingsPage from './pages/shared/Settings';
import NotificationsPage from './pages/shared/Notifications';
import HelpPage from './pages/shared/Help';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
                  <Route index element={<StudentDashboard />} />
                  <Route path="results" element={<StudentResults />} />
                  <Route path="attendance" element={<StudentAttendance />} />
                  <Route path="timetable" element={<TimetablePage />} />
                  <Route path="assignments" element={<StudentAssignments />} />
                  <Route path="outpasses" element={<StudentOutpasses />} />
                  <Route path="certificates" element={<StudentCertificates />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="help" element={<HelpPage />} />
                </Route>

                <Route path="/faculty" element={<ProtectedRoute role="faculty"><FacultyLayout /></ProtectedRoute>}>
                  <Route index element={<FacultyDashboard />} />
                  <Route path="attendance" element={<FacultyAttendance />} />
                  <Route path="marks" element={<FacultyMarks />} />
                  <Route path="assignments" element={<FacultyAssignments />} />
                  <Route path="outpasses" element={<FacultyOutpasses />} />
                  <Route path="timetable" element={<TimetablePage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="help" element={<HelpPage />} />
                </Route>

                <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="students" element={<AdminStudents />} />
                  <Route path="faculty" element={<AdminFaculty />} />
                  <Route path="certificates" element={<AdminCertificates />} />
                  <Route path="scanner" element={<AdminScanner />} />
                  <Route path="audit" element={<AdminAuditLogs />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="help" element={<HelpPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
