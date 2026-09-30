import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, ChartNoAxesCombined, CheckCircle2, Eye, EyeOff, Sparkles } from 'lucide-react';

function loginErrorMessage(err) {
  const apiError = err.response?.data?.error;
  if (apiError) return apiError;
  if (!err.response) {
    return 'Cannot reach the campus server. Start the backend on port 5000, then try again.';
  }
  return 'Login failed. Check your portal and credentials.';
}

export default function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const choosePortal = (r) => {
    setRole(r);
    setEmail('');
    setPassword('');
  };

  const credentialHint = role === 'student'
    ? 'Student ID (e.g. O240001) · Password: O240001@123'
    : role === 'faculty'
      ? 'Faculty ID (e.g. FAC0001) · Password: FAC0001@123'
      : 'Email: admin@campusone.demo · Password: Admin@123';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password, role, { remember });
      // navigate triggers, browser detects successful form submission and offers to save credentials
      navigate(`/${user.role}`);
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page campus-login">
      <div className="auth-visual">
        <div className="login-atmosphere" aria-hidden="true"><span className="login-light login-light-one" /><span className="login-light login-light-two" /><span className="login-network" /><i /><i /><i /><i /><i /></div>
        <Logo />
        <div className="auth-copy">
          <div className="kicker"><Sparkles size={14} /> AI-powered campus intelligence</div>
          <h2>Welcome Back to<br /><span>CampusOneAI</span></h2>
          <p style={{ marginTop: 12, opacity: 0.9 }}>
            Your intelligent campus is just one login away.
          </p>
          <div className="auth-highlights">
            <div><BrainCircuit size={18} /><span><strong>AI campus assistant</strong><small>Instant academic guidance</small></span></div>
            <div><ChartNoAxesCombined size={18} /><span><strong>Smart academic analytics</strong><small>See trends before they become risks</small></span></div>
            <div><CheckCircle2 size={18} /><span><strong>One connected portal</strong><small>Students, faculty, and administration</small></span></div>
          </div>
        </div>
        <div className="auth-orb" aria-hidden="true" />
        <p className="login-legal">Secure access for your campus community</p>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-card">
          <Logo size={44} />
          <p className="login-form-eyebrow">CAMPUSONE AI PORTAL</p>
          <h1>Welcome Back</h1>
          <p className="subtitle">Sign in to continue to your CampusOneAI dashboard.</p>

          <div className="role-tabs" role="tablist">
            {['student', 'faculty', 'admin'].map((r) => (
              <button key={r} type="button" className={role === r ? 'active' : ''} onClick={() => choosePortal(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, background: 'var(--surface-2)', padding: '6px 10px', borderRadius: 6 }}>
            💡 {credentialHint}
          </p>
          {error && <div className="error-msg">{error}</div>}

          {/*
            Using a real <form> with name="username" / name="password" and proper autocomplete
            so the browser can detect the login form and offer to save credentials.
          */}
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="campus-username">
                {role === 'student' ? 'Student ID / College ID or Email' : role === 'faculty' ? 'Faculty ID / Employee ID or Email' : 'Administrator Email or ID'}
              </label>
              <input
                id="campus-username"
                name="username"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={
                  role === 'student'
                    ? 'Enter Student ID (e.g. O240001 or o240001@campusone.edu)'
                    : role === 'faculty'
                      ? 'Enter Faculty ID (e.g. FAC0001 or fac0001@campusone.edu)'
                      : 'Enter Admin Email (e.g. admin@campusone.demo)'
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="campus-password">Password</label>
              <div className="password-field">
                <input
                  id="campus-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={
                    role === 'student'
                      ? 'Enter Password (e.g. O240001@123)'
                      : role === 'faculty'
                        ? 'Enter Password (e.g. FAC0001@123)'
                        : 'Enter Password (e.g. Admin@123)'
                  }
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>
            <label className="remember-row">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Keep me signed in on this device</span>
            </label>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
            <span className="institution-access">Accounts are provided by your institution.</span><br />
            <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
