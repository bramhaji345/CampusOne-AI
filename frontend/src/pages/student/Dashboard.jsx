import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, SkeletonGrid } from '../../components/Ui';
import api from '../../api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [ai, setAi] = useState(null);
  const [att, setAtt] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/results/ai-analysis'),
      api.get('/attendance/ai-analysis'),
      api.get('/notifications'),
      api.get('/dashboard/overview'),
    ]).then(([a, b, c, d]) => {
      setAi(a.data);
      setAtt(b.data);
      setNotifs(c.data.slice(0, 4));
      setOverview(d.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const attPct = att?.summary?.length
    ? Math.round(att.summary.reduce((s, x) => s + x.percentage, 0) / att.summary.length)
    : 0;
  const cgpaByYear = new Map();
  for (const item of ai?.trend || []) {
    const year = item.label.match(/^E[1-4]/)?.[0];
    if (year) cgpaByYear.set(year, item.gpa);
  }

  if (loading) {
    return (
      <div>
        <div className="page-title"><h1>Student Dashboard</h1><p>Loading your campus overview…</p></div>
        <SkeletonGrid />
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">
        <h1>Hello, {user?.name?.split(' ')[0]}</h1>
        <p>{user?.student_id} · {user?.course} · Year {user?.year} · {user?.dept} · Section {user?.section}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="label">Current CGPA</div><div className="value">{ai?.cgpa ?? user?.cgpa}</div></div>
        <div className="stat-card"><div className="label">Overall Attendance</div><div className="value">{attPct}%</div></div>
        <div className="stat-card"><div className="label">Pending assignments</div><div className="value">{overview?.pendingAssignments ?? 0}</div></div>
        <div className="stat-card"><div className="label">Active outpasses</div><div className="value">{overview?.pendingOutpasses ?? 0}</div></div>
      </div>

      <div className="panel cgpa-history-panel">
        <h3>CGPA journey</h3>
        <div className="cgpa-history-row">
          {Array.from({ length: user?.year || 1 }, (_, index) => `E${index + 1}`).map((year) => (
            <div className={`cgpa-year ${year === `E${user?.year || 1}` ? 'current' : ''}`} key={year}>
              <span>{year}</span><strong>{cgpaByYear.get(year)?.toFixed(2) || '—'}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="filters no-print">
        <Link to="/student/results" className="btn btn-primary btn-sm">View results</Link>
        <Link to="/student/attendance" className="btn btn-ghost btn-sm">Attendance</Link>
        <Link to="/student/outpasses" className="btn btn-ghost btn-sm">Request outpass</Link>
        <Link to="/student/assignments" className="btn btn-ghost btn-sm">Assignments</Link>
      </div>

      <div className="ai-card">
        <div className="ai-label"><Sparkles size={14} /> AI Academic Insights</div>
        <p>{ai?.insight}</p>
        {ai?.recommendations?.length > 0 && (
          <ul style={{ marginTop: 10, color: 'var(--text-muted)', paddingLeft: 18 }}>
            {ai.recommendations.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>CGPA trend</h3>
          {ai?.trend?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={ai.trend}>
                <defs>
                  <linearGradient id="gpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="gpa" stroke="var(--chart-secondary)" strokeWidth={2.5} fill="url(#gpa)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No semester trend yet" />}
        </div>
        <div className="panel">
          <h3>Subject performance</h3>
          {ai?.subjects?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ai.subjects}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="subject" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={58} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="percentage" fill="var(--chart-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No subject scores yet" />}
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Latest notifications</h3>
          <Link to="/student/notifications" className="btn btn-ghost btn-sm">View all</Link>
        </div>
        {notifs.length === 0 && <EmptyState title="You're all caught up!" />}
        <div className="notif-list">
          {notifs.map((n) => (
            <div key={n.id} className="notif-item">
              <h4>{n.title}</h4>
              <p>{n.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
