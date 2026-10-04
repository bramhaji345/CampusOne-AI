import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

function loginErrorMessage(err, role) {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message?.includes('Network Error')) {
    return 'Cannot reach backend service. Check connection or try again in a few moments.';
  }
  const roleName = role === 'student' ? 'Student' : role === 'faculty' ? 'Faculty' : 'Admin';
  return `Invalid ${roleName} ID or password. Please verify and try again.`;
}

const roleConfigs = {
  student: {
    roleLabel: 'Student',
    tag: 'STUDENT PORTAL',
    title: 'Student Portal',
    subtitle: 'Sign in to access your academic dashboard',
    identifierLabel: 'Student ID or College Email',
    identifierPlaceholder: 'O2xxxx or O2xxxx@campusone.edu',
    passwordPlaceholder: 'Enter your password',
  },
  faculty: {
    roleLabel: 'Faculty',
    tag: 'FACULTY PORTAL',
    title: 'Faculty Portal',
    subtitle: 'Sign in to manage your academic activities',
    identifierLabel: 'Faculty ID or College Email',
    identifierPlaceholder: 'e.g. FAC001 or faculty@campusone.edu',
    passwordPlaceholder: 'Enter your password',
  },
  admin: {
    roleLabel: 'Admin',
    tag: 'ADMIN PORTAL',
    title: 'Admin Portal',
    subtitle: 'Sign in to manage CampusOne-AI',
    identifierLabel: 'Admin ID or Email',
    identifierPlaceholder: 'admin@campusone.demo',
    passwordPlaceholder: '••••••••',
  },
};

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const rawRole = params.get('role')?.toLowerCase();
  const role = ['student', 'faculty', 'admin'].includes(rawRole) ? rawRole : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // If no valid role specified in URL, redirect directly to Portal Selection
  useEffect(() => {
    if (!role) {
      navigate('/portals', { replace: true });
    }
  }, [role, navigate]);

  // Preload target dashboard chunk for maximum speed
  useEffect(() => {
    if (!role) return;
    try {
      if (role === 'student') import('./student/Dashboard');
      else if (role === 'faculty') import('./faculty/Dashboard');
      else if (role === 'admin') import('./admin/Dashboard');
    } catch {}
  }, [role]);

  if (!role) {
    return null; // Will redirect via useEffect
  }

  const config = roleConfigs[role];

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password, role, { remember });
      // Navigate immediately to the user's dashboard based on server-verified role
      navigate(`/${user.role}`);
    } catch (err) {
      setError(loginErrorMessage(err, role));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page campus-login role-login-page">
      <div className="auth-form-wrap">
        <div className="auth-card role-auth-card">
          {/* Top Bar: Logo on left with CampusOne AI text, spanning across to role badge at the end of the box */}
          <div className="auth-card-top-bar">
            <Link to="/" title="CampusOne-AI Home" className="auth-card-logo-link">
              <Logo size={40} />
            </Link>
            <span className={`role-badge role-badge-${role}`}>{config.tag}</span>
          </div>

          {/* Role Header */}
          <div className="role-auth-header">
            <h1 className="role-auth-title">{config.title}</h1>
            <p className="role-auth-subtitle">{config.subtitle}</p>
          </div>

          {/* Inline Error Notice */}
          {error && (
            <div className="role-error-banner" role="alert">
              <span>{error}</span>
            </div>
          )}

          {/* Role-Specific Login Form (NO tabs) */}
          <form onSubmit={onSubmit} className="role-login-form" noValidate={false}>
            <div className="form-group">
              <label htmlFor="campus-identifier">{config.identifierLabel}</label>
              <div className="input-with-icon">
                <span className="input-icon" aria-hidden="true">
                  <User size={18} />
                </span>
                <input
                  id="campus-identifier"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={config.identifierPlaceholder}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="campus-password">Password</label>
                <Link
                  to="/forgot-password"
                  className="forgot-pass-link"
                  tabIndex={0}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="password-field">
                <span className="input-icon" aria-hidden="true">
                  <Lock size={18} />
                </span>
                <input
                  id="campus-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={config.passwordPlaceholder}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className="remember-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              <span>Keep me signed in on this device</span>
            </label>

            <button
              className="btn btn-primary role-submit-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="btn-spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In as {config.roleLabel}</span>
              )}
            </button>
          </form>

          {/* Change Portal Navigation */}
          <div className="change-portal-wrap">
            <Link to="/portals" className="change-portal-link">
              <ArrowLeft size={16} />
              <span>Change Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
