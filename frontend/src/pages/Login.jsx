import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BrainCircuit,
  ChartNoAxesCombined,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

function loginErrorMessage(err) {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message?.includes('Network Error')) {
    return 'Cannot reach backend service. Check connection or try again in a few moments.';
  }
  return 'Sign in failed. Check your ID and password.';
}

export default function Login() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') || 'student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const choosePortal = (nextRole) => {
    setRole(nextRole);
    setError('');
    setEmail('');
    setPassword('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password, role, { remember });
      // Navigate triggers; browser detects successful form submission and offers to save credentials
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
        <div className="login-atmosphere" aria-hidden="true">
          <span className="login-light login-light-one" />
          <span className="login-light login-light-two" />
          <span className="login-network" />
          <i /><i /><i /><i /><i />
        </div>
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

          {error && <div className="error-msg">{error}</div>}

          {/*
            Using a real <form> with name="username" / name="password" and proper autocomplete
            so the browser can detect the login form and offer to save credentials.
          */}
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="campus-username">
                {role === 'student' ? 'College ID or Email' : role === 'faculty' ? 'Faculty ID or Email' : 'Administrator Email'}
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
                    ? 'O22XXXX or student@campusone.edu'
                    : role === 'faculty'
                      ? 'FACXXXX or faculty@campusone.edu'
                      : 'admin@campusone.demo'
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
                      ? 'O22XXXX@123'
                      : role === 'faculty'
                        ? 'FACXXXX@123'
                        : '••••••••'
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
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 14 }}>
              {loading ? 'Signing in…' : `Sign in as ${role}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
