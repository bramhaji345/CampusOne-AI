import { useCallback, useEffect, useState } from 'react';
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
  const [aiLoading, setAiLoading] = useState(true);
  const [attLoading, setAttLoading] = useState(true);

  const load = useCallback(() => {
    api.get('/dashboard/overview')
      .then((r) => setOverview(r.data))
      .catch(() => {});

    api.get('/attendance/ai-analysis')
      .then((r) => setAtt(r.data))
      .catch(() => {})
      .finally(() => setAttLoading(false));

    api.get('/results/ai-analysis')
      .then((r) => setAi(r.data))
      .catch(() => {})
      .finally(() => setAiLoading(false));

    api.get('/notifications')
      .then((r) => setNotifs(r.data.slice(0, 4)))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('campus:data-changed', refresh);
    window.addEventListener('campus:reconnected', refresh);
    return () => {
      window.removeEventListener('campus:data-changed', refresh);
      window.removeEventListener('campus:reconnected', refresh);
    };
  }, [load]);

  const attPct = att?.summary?.length
    ? Math.round(att.summary.reduce((s, x) => s + x.percentage, 0) / att.summary.length)
    : 0;
  const cgpaByYear = new Map();
  for (const item of ai?.trend || []) {
    const year = item.label.match(/^E[1-4]/)?.[0];
    if (year) cgpaByYear.set(year, item.gpa);
  }

  return (
    <div>
      <div className="page-title">
        <h1>Hello, {user?.name?.split(' ')[0]}</h1>
        <p>{user?.student_id} · {user?.course} · Year {user?.year} ({user?.cohort || `E${user?.year}`}) · Semester {user?.semester || 1} · {user?.dept} · Section {user?.section}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="label">Current CGPA</div><div className="value">{user?.cgpa ?? ai?.cgpa ?? '—'}</div></div>
        <div className="stat-card"><div className="label">Overall Attendance</div><div className="value">{att ? `${attPct}%` : (attLoading ? '…' : '0%')}</div></div>
        <div className="stat-card"><div className="label">Pending assignments</div><div className="value">{overview ? (overview.pendingAssignments ?? 0) : '…'}</div></div>
        <div className="stat-card"><div className="label">Active outpasses</div><div className="value">{overview ? (overview.pendingOutpasses ?? 0) : '…'}</div></div>
      </div>

      <div className="panel cgpa-history-panel">
        <h3>CGPA journey</h3>
        <div className="cgpa-history-row">
          {Array.from({ length: user?.year || 1 }, (_, index) => `E${index + 1}`).map((year) => (
            <div className={`cgpa-year ${year === `E${user?.year || 1}` ? 'current' : ''}`} key={year}>
              <span>{year}</span><strong>{cgpaByYear.get(year)?.toFixed(2) || (aiLoading ? '…' : '—')}</strong>
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
        {aiLoading ? (
          <div className="skeleton" style={{ height: 36, marginTop: 8 }} />
        ) : (
          <>
            <p>{ai?.insight || 'Academic analytics will update as results and attendance are recorded.'}</p>
            {ai?.recommendations?.length > 0 && (
              <ul style={{ marginTop: 10, color: 'var(--text-muted)', paddingLeft: 18 }}>
                {ai.recommendations.map((r) => <li key={r}>{r}</li>)}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>CGPA trend</h3>
          {aiLoading ? (
            <div className="skeleton" style={{ height: 250 }} />
          ) : ai?.trend?.length ? (
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
          {aiLoading ? (
            <div className="skeleton" style={{ height: 250 }} />
          ) : ai?.subjects?.length ? (
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
