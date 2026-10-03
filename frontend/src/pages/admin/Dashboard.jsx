import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Sparkles } from 'lucide-react';
import { SkeletonGrid } from '../../components/Ui';
import api from '../../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const load = useCallback(() => {
    api.get('/admin/stats')
      .then((s) => setStats(s.data))
      .catch(() => {});

    api.get('/admin/analytics')
      .then((a) => setAnalytics(a.data))
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('campus:data-changed', refresh);
    window.addEventListener('campus:reconnected', refresh);
    return () => { window.removeEventListener('campus:data-changed', refresh); window.removeEventListener('campus:reconnected', refresh); };
  }, [load]);

  return (
    <div>
      <div className="page-title">
        <h1>Administration dashboard</h1>
        <p>Campus-wide analytics, people, certificates, and gate verification</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="label">Students</div><div className="value">{stats.students ?? '—'}</div></div>
        <div className="stat-card"><div className="label">Faculty</div><div className="value">{stats.faculty ?? '—'}</div></div>
        <div className="stat-card"><div className="label">Pending certificates</div><div className="value">{stats.pendingCerts ?? '—'}</div></div>
        <div className="stat-card"><div className="label">Pending outpasses</div><div className="value">{stats.pendingOut ?? '—'}</div></div>
        <div className="stat-card"><div className="label">Attendance</div><div className="value">{analytics?.attendanceRate ?? '—'}%</div></div>
      </div>

      {analytics?.insights && (
        <div className="ai-card">
          <div className="ai-label"><Sparkles size={14} /> Admin AI analytics</div>
          {analytics.insights.map((i) => <p key={i} style={{ marginBottom: 6 }}>{i}</p>)}
        </div>
      )}

      <div className="grid-2">
        <div className="panel">
          <h3>Students by department</h3>
          {analyticsLoading ? (
            <div className="skeleton" style={{ height: 220 }} />
          ) : analytics?.depts?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.depts}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="dept" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="c" name="Students" fill="var(--chart-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
        <div className="panel">
          <h3>Quick modules</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            <Link to="/admin/students" className="btn btn-ghost">Student management</Link>
            <Link to="/admin/faculty" className="btn btn-ghost">Faculty management</Link>
            <Link to="/admin/certificates" className="btn btn-ghost">Certificate management</Link>
            <Link to="/admin/notifications" className="btn btn-ghost">Notification management</Link>
            <Link to="/admin/scanner" className="btn btn-primary">Security QR scanner</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
