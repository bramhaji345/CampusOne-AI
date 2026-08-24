import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/Ui';
import api from '../../api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function slotStart(slot) {
  const [h, m] = (slot || '09:00').split('-')[0].split(':').map(Number);
  return h * 60 + m;
}

export default function TimetablePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const todayName = DAYS[new Date().getDay() - 1] || 'Monday';
  const [day, setDay] = useState(todayName);

  useEffect(() => {
    api.get('/timetable').then((r) => setRows(r.data));
  }, []);

  const filtered = rows.filter((r) => r.day === day).sort((a, b) => a.period - b.period);
  const next = useMemo(() => {
    const todayRows = rows.filter((r) => r.day === todayName).sort((a, b) => a.period - b.period);
    const n = nowMinutes();
    return todayRows.find((r) => slotStart(r.time_slot) >= n - 50) || todayRows[0];
  }, [rows, todayName]);

  const current = filtered.find((r) => {
    const [start, end] = (r.time_slot || '').split('-');
    if (!start || !end) return false;
    const n = nowMinutes();
    return n >= slotStart(start) && n < slotStart(end);
  });

  return (
    <div>
      <div className="page-title">
        <h1>{user?.role === 'faculty' ? 'Teaching timetable' : 'Class timetable'}</h1>
        <p>{next ? `Next class: ${next.subject} — ${next.time_slot?.split('-')[0]}` : 'No classes scheduled today'}</p>
      </div>
      <div className="filters">
        {DAYS.map((d) => (
          <button key={d} type="button" className={`btn btn-sm ${day === d ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDay(d)}>
            {d.slice(0, 3)}
          </button>
        ))}
      </div>
      <div className="panel">
        <h3>{day}{day === todayName ? ' · Today' : ''}</h3>
        {filtered.length === 0 && <EmptyState title="No classes" hint="Enjoy the free slot." />}
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((r) => (
            <div key={r.id} className={`tt-slot ${current?.id === r.id ? 'now' : ''}`}>
              <strong>{r.time_slot}</strong>
              <div>{r.subject} · {r.class_type || (r.period % 2 ? 'Lecture' : 'Lab')} · {r.room}</div>
              {r.faculty_name && <small style={{ color: 'var(--text-muted)' }}>{r.faculty_name}</small>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
