import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, SkeletonGrid } from '../../components/Ui';
import api from '../../api';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [outpasses, setOutpasses] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [assignedCount, setAssignedCount] = useState(null);
  const [tt, setTt] = useState([]);

  useEffect(() => {
    api.get('/dashboard/overview')
      .then((r) => {
        if (r.data?.studentsCount != null) setAssignedCount(r.data.studentsCount);
      })
      .catch(() => {});

    api.get('/outpasses')
      .then((r) => setOutpasses(r.data.filter((x) => x.status === 'pending')))
      .catch(() => {});

    api.get('/notifications')
      .then((r) => setNotifs(r.data.slice(0, 4)))
      .catch(() => {});

    api.get('/timetable')
      .then((r) => setTt(r.data))
      .catch(() => {});
  }, [user]);

  const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const todayClasses = tt.filter((r) => r.day === today);

  return (
    <div>
      <div className="page-title">
        <h1>Faculty Dashboard</h1>
        <p>{user?.designation} · {user?.dept} · {user?.subjects}</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="label">Pending outpasses</div><div className="value">{outpasses.length}</div></div>
        <div className="stat-card"><div className="label">Assigned students</div><div className="value">{assignedCount ?? '…'}</div></div>
        <div className="stat-card"><div className="label">Subjects</div><div className="value">{user?.subjects?.split(',').filter(Boolean).length || 0}</div></div>
        <div className="stat-card"><div className="label">Today's classes</div><div className="value">{todayClasses.length}</div></div>
      </div>

      <div className="filters">
        <Link to="/faculty/attendance" className="btn btn-primary btn-sm">Take Attendance</Link>
        <Link to="/faculty/marks" className="btn btn-ghost btn-sm">Upload Marks</Link>
        <Link to="/faculty/assignments" className="btn btn-ghost btn-sm">Create Assignment</Link>
        <Link to="/faculty/notifications" className="btn btn-ghost btn-sm">Send Notification</Link>
        <Link to="/faculty/outpasses" className="btn btn-ghost btn-sm">Review Outpasses</Link>
      </div>

      <div className="ai-card">
        <div className="ai-label"><Sparkles size={14} /> Faculty insight</div>
        <p>
          {outpasses.some((o) => o.reason_type === 'urgent')
            ? `${outpasses.filter((o) => o.reason_type === 'urgent').length} urgent outpass(es) need review first.`
            : 'No urgent outpasses. Medical requests are next in the priority queue.'}
        </p>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Priority outpass queue</h3>
            <Link to="/faculty/outpasses" className="btn btn-ghost btn-sm">Review</Link>
          </div>
          {outpasses.length === 0 && <EmptyState title="No pending outpass requests." />}
          {outpasses.slice(0, 6).map((o) => (
            <div key={o.id} className="notif-item" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4>{o.student_name}</h4>
                <span className={`badge-pill badge-${o.reason_type}`}>{o.reason_type}</span>
              </div>
              <p>{o.reason}</p>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>Today's timetable</h3>
          {todayClasses.length === 0 && <EmptyState title="No classes scheduled today." />}
          {todayClasses.map((c) => (
            <div key={c.id} className="tt-slot" style={{ marginBottom: 8 }}>
              <strong>{c.time_slot}</strong>
              <div>{c.subject} · {c.room}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
