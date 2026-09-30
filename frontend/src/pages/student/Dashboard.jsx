import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, SkeletonGrid } from '../../components/Ui';
import api from '../../api';

function cgpaColor(val) {
  if (!val) return 'var(--text-muted)';
  if (val >= 9) return '#22c55e';
  if (val >= 8) return '#3b82f6';
  if (val >= 7) return '#f59e0b';
  if (val >= 6) return '#f97316';
  return '#ef4444';
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [ai, setAi] = useState(null);
  const [att, setAtt] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
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

  // Build per-year CGPA map and per-year semester breakdown
  const cgpaByYear = new Map();
  const cgpaBySemester = {};
  for (const item of ai?.trend || []) {
    const year = item.label.match(/^E[1-4]/)?.[0];
    if (year) {
      if (!cgpaByYear.has(year) || item.gpa > cgpaByYear.get(year)) {
        cgpaByYear.set(year, item.gpa);
      }
      if (!cgpaBySemester[year]) cgpaBySemester[year] = [];
      cgpaBySemester[year].push(item);
    }
  }

  const currentYear = `E${user?.year || 1}`;
  const totalYears = user?.year || 1;
  const currentCgpa = ai?.cgpa ?? user?.cgpa;

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

      {/* Top stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Current CGPA</div>
          <div className="value" style={{ color: cgpaColor(currentCgpa) }}>
            {typeof currentCgpa === 'number' ? currentCgpa.toFixed(2) : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Overall Attendance</div>
          <div className="value" style={{ color: attPct >= 75 ? '#22c55e' : '#ef4444' }}>{attPct}%</div>
        </div>
        <div className="stat-card">
          <div className="label">Pending assignments</div>
          <div className="value">{overview?.pendingAssignments ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active outpasses</div>
          <div className="value">{overview?.pendingOutpasses ?? 0}</div>
        </div>
      </div>

      {/* ─── CGPA Journey: E1 to current year ─── */}
      <div className="panel cgpa-history-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <TrendingUp size={16} color="var(--accent)" />
          <h3 style={{ margin: 0 }}>CGPA Journey — E1 to {currentYear}</h3>
        </div>

        {/* Year summary cards */}
        <div className="cgpa-history-row">
          {Array.from({ length: totalYears }, (_, i) => `E${i + 1}`).map((yr) => {
            const val = cgpaByYear.get(yr);
            const isCurrent = yr === currentYear;
            return (
              <div
                key={yr}
                className={`cgpa-year ${isCurrent ? 'current' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: isCurrent ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                  background: 'var(--bg-soft)',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{yr}</span>
                <strong style={{ fontSize: 24, fontWeight: 700, color: val ? cgpaColor(val) : 'var(--text-muted)', lineHeight: 1 }}>
                  {val ? val.toFixed(2) : '—'}
                </strong>
                {isCurrent && <span style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4, fontWeight: 700 }}>CURRENT</span>}
              </div>
            );
          })}
        </div>

        {/* Semester-wise breakdown */}
        {Object.entries(cgpaBySemester).length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(cgpaBySemester).map(([yr, sems]) =>
              sems.map((s) => (
                <div key={s.label} style={{
                  fontSize: 12, background: 'var(--bg-soft)', padding: '4px 10px',
                  borderRadius: 8, border: '1px solid var(--border)',
                  color: cgpaColor(s.gpa),
                }}>
                  {s.label}: <strong>{s.gpa.toFixed(2)}</strong>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick action links */}
      <div className="filters no-print">
        <Link to="/student/results" className="btn btn-primary btn-sm"><BookOpen size={13} /> View results</Link>
        <Link to="/student/attendance" className="btn btn-ghost btn-sm">Attendance</Link>
        <Link to="/student/timetable" className="btn btn-ghost btn-sm">Timetable</Link>
        <Link to="/student/outpasses" className="btn btn-ghost btn-sm">Request outpass</Link>
        <Link to="/student/assignments" className="btn btn-ghost btn-sm">Assignments</Link>
      </div>

      {/* AI insights */}
      <div className="ai-card">
        <div className="ai-label"><Sparkles size={14} /> AI Academic Insights</div>
        <p>{ai?.insight}</p>
        {ai?.recommendations?.length > 0 && (
          <ul style={{ marginTop: 10, color: 'var(--text-muted)', paddingLeft: 18 }}>
            {ai.recommendations.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="panel">
          <h3>CGPA trend (all semesters)</h3>
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
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={48} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v.toFixed(2), 'GPA']} />
                <Area type="monotone" dataKey="gpa" stroke="var(--chart-secondary)" strokeWidth={2.5} fill="url(#gpa)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No semester trend yet" />}
        </div>
        <div className="panel">
          <h3>Subject performance</h3>
          {ai?.subjects?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ai.subjects.slice(0, 8)}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="subject" tick={{ fontSize: 9 }} interval={0} angle={-18} textAnchor="end" height={58} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                  {ai.subjects.slice(0, 8).map((entry) => (
                    <Cell key={entry.subject} fill={entry.percentage >= 75 ? 'var(--chart-primary)' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No subject scores yet" />}
        </div>
      </div>

      {/* Latest notifications */}
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
