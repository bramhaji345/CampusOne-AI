import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, LogOut, Moon, Monitor, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

export default function SettingsPage() {
  const { theme, pref, setTheme } = useTheme();
  const { logout, user } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [emailN, setEmailN] = useState(true);
  const [portalN, setPortalN] = useState(true);

  const changePw = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', pw);
      toast('Password updated');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast(err.response?.data?.error || 'Could not update password');
    }
  };

  const doLogout = async () => {
    const ok = await confirm({ title: 'Log out?', message: 'End this portal session.', confirmLabel: 'Logout', danger: true });
    if (ok) { logout(); navigate('/login'); }
  };

  return (
    <div>
      <div className="page-title"><h1>Settings</h1><p>Appearance, notifications, security, and account</p></div>
      <div className="panel">
        <h3>Appearance</h3>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <button type="button" className={`btn ${pref === 'light' || (pref !== 'system' && theme === 'light') ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTheme('light')}><Sun size={16} /> Light</button>
          <button type="button" className={`btn ${pref === 'dark' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTheme('dark')}><Moon size={16} /> Dark</button>
          <button type="button" className={`btn ${pref === 'system' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTheme('system')}><Monitor size={16} /> System</button>
        </div>
      </div>
      <div className="panel">
        <h3>Notifications</h3>
        <label style={{ display: 'flex', gap: 8, marginBottom: 8 }}><input type="checkbox" checked={portalN} onChange={(e) => setPortalN(e.target.checked)} /> Portal notifications</label>
        <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={emailN} onChange={(e) => setEmailN(e.target.checked)} /> Email notifications</label>
      </div>
      <div className="panel">
        <h3>Security</h3>
        <form onSubmit={changePw} style={{ maxWidth: 360 }}>
          <div className="form-group"><label>Current password</label><input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required /></div>
          <div className="form-group"><label>New password</label><input type="password" minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required /></div>
          <button className="btn btn-primary" type="submit">Update password</button>
        </form>
      </div>
      <div className="panel">
        <h3>Help</h3>
        <button type="button" className="btn btn-ghost" onClick={() => navigate(`/${user?.role}/help`)}><HelpCircle size={16} /> Open Help Center</button>
      </div>
      <div className="panel">
        <h3>Account</h3>
        <button type="button" className="btn btn-danger" onClick={doLogout}><LogOut size={16} /> Logout</button>
      </div>
    </div>
  );
}
