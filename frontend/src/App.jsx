import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';
import StudentLayout, { FacultyLayout, AdminLayout } from './pages/layouts';
import StudentOutpasses from './pages/student/Outpasses';
import FacultyOutpasses from './pages/faculty/Outpasses';
import AdminScanner from './pages/admin/Scanner';

/**
 * Outpass + security module routes.
 * Merge into frontend/src/App.jsx:
 *   /student/outpasses, /faculty/outpasses, /admin/scanner
 */
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
                  <Route path="outpasses" element={<StudentOutpasses />} />
                </Route>
                <Route path="/faculty" element={<ProtectedRoute role="faculty"><FacultyLayout /></ProtectedRoute>}>
                  <Route path="outpasses" element={<FacultyOutpasses />} />
                </Route>
                <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
                  <Route path="scanner" element={<AdminScanner />} />
                </Route>
                <Route path="*" element={<Navigate to="/student/outpasses" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
