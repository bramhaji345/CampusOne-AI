import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="splash">
        <div style={{ textAlign: 'center' }}>
          <Logo size={56} />
          <p style={{ marginTop: 14, color: 'var(--text-muted)' }}>Loading CampusOne AI…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}
