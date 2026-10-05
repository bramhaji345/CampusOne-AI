import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, HelpCircle, LogOut, Menu, Moon, Search, Sun, User, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirm } from '../context/ConfirmContext';
import { EmptyState } from './Ui';
import api from '../api';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

export default function DashboardLayout({ links, title }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState([]);
  const searchRef = useRef(null);
  const syncStatus = useRealtimeSync();

  const loadNotifs = () => api.get('/notifications').then((r) => setNotifs(r.data)).catch(() => {});

  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 12000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const refreshNotifs = () => loadNotifs();
    window.addEventListener('campus:data-changed', refreshNotifs);
    window.addEventListener('campus:reconnected', refreshNotifs);
    return () => {
      window.removeEventListener('campus:data-changed', refreshNotifs);
      window.removeEventListener('campus:reconnected', refreshNotifs);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (user?.role) root.setAttribute('data-portal', user.role);
    else root.removeAttribute('data-portal');
    return () => root.removeAttribute('data-portal');
  }, [user?.role]);

  useEffect(() => {
    if (q.length < 2) { setHits([]); return; }
    const t = setTimeout(() => {
      api.get('/search', { params: { q } }).then((r) => setHits(r.data.results || [])).catch(() => {});
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const unread = notifs.filter((n) => !(n.read_by || []).includes(user?.id)).length;

  const handleLogout = async () => {
    const ok = await confirm({ title: 'Log out?', message: 'You will need your college credentials to sign in again.', confirmLabel: 'Logout', danger: true });
    if (ok) { logout(); navigate('/login'); }
  };

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`} data-portal={user?.role || 'student'}>
      {open && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Logo size={36} />
          <button className="icon-btn sidebar-collapse" onClick={() => setCollapsed((value) => !value)} type="button" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
          <button className="icon-btn mobile-menu-btn" onClick={() => setOpen(false)} type="button" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}>
              {l.icon}
              <span className="nav-label">{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleLogout} type="button">
          <LogOut size={16} /> Logout
        </button>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button className="icon-btn mobile-menu-btn" onClick={() => setOpen(true)} type="button" aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div>
              <strong>{title}</strong>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                Welcome, {user?.name}
                <span className={`sync-status ${syncStatus}`} title={`Central DB Sync: ${syncStatus}`}>
                  <span className="sync-dot" />
                  {syncStatus === 'connected' ? 'Live' : syncStatus === 'offline' ? 'Offline' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>

          <div className="search-wrap" ref={searchRef}>
            <Search size={15} />
            <input
              aria-label="Search"
              placeholder="Search campus…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {hits.length > 0 && (
              <div className="search-drop">
                {hits.map((h, i) => (
                  <a
                    href={h.to}
                    key={`${h.title}-${i}`}
                    onClick={(e) => { e.preventDefault(); setQ(''); setHits([]); navigate(h.to); }}
                  >
                    <small style={{ color: 'var(--text-muted)' }}>{h.type}</small>
                    <div>{h.title}</div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} type="button" title="Toggle theme" aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotifs((v) => !v)} type="button" aria-label="Notifications">
                <Bell size={18} />
                {unread > 0 && <span className="badge">{unread}</span>}
              </button>
              {showNotifs && (
                <div className="panel" style={{ position: 'absolute', right: 0, top: 48, width: 330, maxHeight: 380, overflow: 'auto', zIndex: 50 }}>
                  <h3>Notifications</h3>
                  {notifs.length === 0 && <EmptyState title="You're all caught up!" hint="No notifications available." />}
                  {notifs.slice(0, 6).map((n) => (
                    <div key={n.id} className={`notif-item ${(n.read_by || []).includes(user?.id) ? '' : 'unread'}`} style={{ marginBottom: 8 }}>
                      <h4>{n.title}</h4>
                      <p>{n.body}</p>
                    </div>
                  ))}
                  <NavLink to={`/${user.role}/notifications`} onClick={() => setShowNotifs(false)} className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
                    View all
                  </NavLink>
                </div>
              )}
            </div>
            <button className="icon-btn" onClick={() => navigate(`/${user.role}/help`)} type="button" title="Help" aria-label="Help">
              <HelpCircle size={18} />
            </button>
            <button
              className="icon-btn"
              onClick={() => navigate(`/${user.role}/profile`)}
              type="button"
              title="Profile"
              aria-label="Profile"
              style={{ padding: 0, overflow: 'hidden' }}
            >
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt={user?.name || 'Profile'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 11,
                    display: 'block',
                  }}
                />
              ) : user?.name ? (
                <span className="avatar sm">{user.name.charAt(0)}</span>
              ) : (
                <User size={18} />
              )}
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
