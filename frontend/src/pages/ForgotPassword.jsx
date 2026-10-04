import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDemoLink('');
    if (!email.endsWith('@campusone.demo') && !email.endsWith('@campusone.edu')) {
      setError('Please use your institutional email ending with @campusone.demo or @campusone.edu');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
      setDemoLink(data.demoResetLink || '');
    } catch (err) {
      setError(err.response?.data?.error || 'We could not process this request. Try again.');
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
            <p className="login-form-eyebrow" style={{ color: '#f18701', fontWeight: 800, fontSize: '0.74rem', letterSpacing: '0.14em', marginBottom: 4 }}>
              PASSWORD RECOVERY
            </p>
            <h1>Forgot password</h1>
            <p className="subtitle">Enter your college email and we will send you a secure link to reset your password.</p>
          </div>
          {error && <div className="error-msg">{error}</div>}
          {message && (
            <div className="success-msg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{message}</span>
            </div>
          )}
          {demoLink && (
            <div className="demo-hint">
              <strong>Demo reset link (emailed in production):</strong>
              <div style={{ marginTop: 6 }}>
                <Link to={demoLink} style={{ color: 'var(--primary, #5B3DF5)', fontWeight: 700, textDecoration: 'underline' }}>
                  Click here to open reset password page →
                </Link>
              </div>
            </div>
          )}
          <form onSubmit={onSubmit}>
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label htmlFor="mail">College Email</label>
              <input
                id="mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@campusone.demo"
                autoComplete="email"
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
              {loading ? 'Sending link…' : 'Send reset link'}
            </button>
          </form>
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <Link to="/login" className="auth-back-link">
              <ArrowLeft size={16} /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
