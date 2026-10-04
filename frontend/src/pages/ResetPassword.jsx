import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import api from '../api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!token) return setError('This reset link is invalid or has expired.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-clean-page">
      <div className="auth-form-wrap">
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Logo size={46} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1>Set new password</h1>
            <p className="subtitle">Enter your new secure password below to regain access to your account.</p>
          </div>
          {error && <div className="error-msg">{error}</div>}
          {done ? (
            <div className="success-msg" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <CheckCircle2 size={28} color="#166534" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, color: '#166534' }}>
                Password updated successfully!
              </div>
              <p style={{ fontSize: '0.88rem', color: '#166534', marginBottom: 14 }}>
                You can now sign in using your new credentials.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center', width: '100%' }}>
                Sign in now →
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </button>
              <div style={{ marginTop: 22, textAlign: 'center' }}>
                <Link to="/login" className="auth-back-link">
                  <ArrowLeft size={16} /> Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
