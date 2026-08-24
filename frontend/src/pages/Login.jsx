import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const fillDemo = (r) => {
    setRole(r);
    if (r === 'student') { setEmail('student@campusone.demo'); setPassword('Student@123'); }
    if (r === 'faculty') { setEmail('faculty@campusone.demo'); setPassword('Faculty@123'); }
    if (r === 'admin') { setEmail('admin@campusone.demo'); setPassword('Admin@123'); }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, role);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your portal and credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Logo />
        <div>
          <h2>Your campus, intelligently connected.</h2>
          <p style={{ marginTop: 12, opacity: 0.9 }}>
            Institutional credentials only. There is no public registration —
            access is provisioned by the college.
          </p>
        </div>
        <p style={{ opacity: 0.8, fontSize: 14 }}>CampusOne AI</p>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-card">
          <Logo size={44} />
          <h1>Welcome back</h1>
          <p className="subtitle">Choose your portal, then sign in with college credentials</p>

          <div className="role-tabs" role="tablist">
            {['student', 'faculty', 'admin'].map((r) => (
              <button key={r} type="button" className={role === r ? 'active' : ''} onClick={() => fillDemo(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Selected portal: <strong>{role}</strong>
          </p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="email">College Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@campusone.demo" />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>

          <div className="demo-hint">
            Demo accounts (college-issued, no public signup)
            <code>Student: student@campusone.demo / Student@123</code>
            <code>Faculty: faculty@campusone.demo / Faculty@123</code>
            <code>Admin: admin@campusone.demo / Admin@123</code>
          </div>
          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
