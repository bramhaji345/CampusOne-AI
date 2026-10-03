import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
const StudentLayout = lazy(() => import('./pages/layouts').then((m) => ({ default: m.default })));
const FacultyLayout = lazy(() => import('./pages/layouts').then((m) => ({ default: m.FacultyLayout })));
const AdminLayout = lazy(() => import('./pages/layouts').then((m) => ({ default: m.AdminLayout })));

// Public Pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentResults = lazy(() => import('./pages/student/Results'));
const StudentAttendance = lazy(() => import('./pages/student/Attendance'));
const TimetablePage = lazy(() => import('./pages/student/Timetable'));
const StudentAssignments = lazy(() => import('./pages/student/Assignments'));
const StudentOutpasses = lazy(() => import('./pages/student/Outpasses'));
const StudentCertificates = lazy(() => import('./pages/student/Certificates'));

// Faculty Pages
const FacultyDashboard = lazy(() => import('./pages/faculty/Dashboard'));
const FacultyAttendance = lazy(() => import('./pages/faculty/Attendance'));
const FacultyMarks = lazy(() => import('./pages/faculty/Marks'));
const FacultyOutpasses = lazy(() => import('./pages/faculty/Outpasses'));
const FacultyAssignments = lazy(() => import('./pages/faculty/Assignments'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminStudents = lazy(() => import('./pages/admin/Students'));
const AdminFaculty = lazy(() => import('./pages/admin/Faculty'));
const AdminCertificates = lazy(() => import('./pages/admin/Certificates'));
const AdminScanner = lazy(() => import('./pages/admin/Scanner'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

// Shared Pages
const ProfilePage = lazy(() => import('./pages/shared/Profile'));
const SettingsPage = lazy(() => import('./pages/shared/Settings'));
const NotificationsPage = lazy(() => import('./pages/shared/Notifications'));
const HelpPage = lazy(() => import('./pages/shared/Help'));

function PageFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="skeleton" style={{ width: 140, height: 28, borderRadius: 8 }} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<PageFallback />}>
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
            </Suspense>
          </BrowserRouter>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
