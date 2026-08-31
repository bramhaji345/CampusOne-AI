import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';
import { AdminLayout } from './pages/layouts';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminFaculty from './pages/admin/Faculty';
import AdminCertificates from './pages/admin/Certificates';
import NotificationsPage from './pages/shared/Notifications';
import ProfilePage from './pages/shared/Profile';
import SettingsPage from './pages/shared/Settings';
import HelpPage from './pages/shared/Help';

/**
 * Admin module routes. QR scanner lives in 05-Outpass-Security.
 * Merge these paths into frontend/src/App.jsx under /admin.
 */
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
               <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>  
                {/* <Route path="/admin" element={<AdminLayout />}>  */}
                  <Route index element={<AdminDashboard />} />
                  <Route path="students" element={<AdminStudents />} />
                  <Route path="faculty" element={<AdminFaculty />} />
                  <Route path="certificates" element={<AdminCertificates />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="help" element={<HelpPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
