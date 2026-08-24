import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="auth-page">
      <div className="auth-visual">
        <Logo />
        <div>
          <h2>Reset with your college mail</h2>
          <p style={{ marginTop: 12, opacity: 0.9 }}>
            Enter your @campusone.demo or @campusone.edu address. A secure reset link is sent only to registered inboxes.
          </p>
        </div>
        <p style={{ opacity: 0.8, fontSize: 14 }}>CampusOne AI</p>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-card">
          <Logo size={44} />
          <h1>Forgot password</h1>
          <p className="subtitle">A reset link will be sent to your college inbox</p>
          {error && <div className="error-msg">{error}</div>}
          {message && <div className="success-msg">{message}</div>}
          {demoLink && (
            <div className="demo-hint">
              Demo reset link (emailed in production):
              <Link to={demoLink} style={{ color: 'var(--primary)', fontWeight: 600 }}>Open reset page</Link>
            </div>
          )}
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="mail">College Email</label>
              <input id="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@campusone.demo" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
            <Link to="/login" style={{ color: 'var(--text-muted)' }}>← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
