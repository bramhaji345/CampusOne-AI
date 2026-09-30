import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/Ui';
import api from '../../api';

const ENTRY_LEVELS = [
  { value: 'E1', label: 'Class E1 (1st Year — O24xxxx)', prefix: 'O24' },
  { value: 'E2', label: 'Class E2 (2nd Year — O23xxxx)', prefix: 'O23' },
  { value: 'E3', label: 'Class E3 (3rd Year — O22xxxx)', prefix: 'O22' },
  { value: 'E4', label: 'Class E4 (4th Year — O21xxxx)', prefix: 'O21' },
];

export default function FacultyAttendance() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const subjects = (user?.subjects || '').split(',').map((s) => s.trim()).filter(Boolean);
  const [subject, setSubject] = useState(subjects[0] || '');
  const [entryLevel, setEntryLevel] = useState('E1');
  const [section, setSection] = useState('all');
  const [availableSections, setAvailableSections] = useState([]);
  const [classType, setClassType] = useState('lecture');
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  const currentLevelConfig = ENTRY_LEVELS.find((l) => l.value === entryLevel) || ENTRY_LEVELS[0];

  useEffect(() => {
    setLoading(true);
    api.get('/students/list', {
      params: {
        dept: user?.dept,
        subject,
        year_level: entryLevel,
        section: section !== 'all' ? section : undefined,
      },
    })
      .then((r) => {
        const data = r.data || [];
        setStudents(data);
        const map = {};
        data.forEach((s) => { map[s.student_id] = 'present'; });
        setStatusMap(map);

        // Extract available sections from the class
        const sects = [...new Set(data.map((s) => s.section).filter(Boolean))].sort();
        if (sects.length > 0) setAvailableSections(sects);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [user, subject, entryLevel, section]);

  const markAll = (status) => {
    const map = {};
    students.forEach((s) => { map[s.student_id] = status; });
    setStatusMap(map);
  };

  const save = async () => {
    if (!students.length) return;
    const ok = await confirm({
      title: `Submit ${entryLevel} Attendance`,
      message: `Submit ${subject} (${classType}) for Class ${entryLevel} (${students.length} students) on ${today}? Duplicate submissions for today overwrite the session.`,
      confirmLabel: 'Confirm Attendance',
    });
    if (!ok) return;
    const records = Object.entries(statusMap).map(([student_id, status]) => ({ student_id, status }));
    try {
      const { data } = await api.post('/attendance', { subject, class_type: classType, records });
      toast(`Attendance submitted successfully for ${data.date} (${students.length} students)`);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to submit attendance');
    }
  };

  const presentCount = Object.values(statusMap).filter((v) => v === 'present').length;

  return (
    <div>
      <div className="page-title">
        <h1>Mark attendance</h1>
        <p>Select student class/year level to load matching roster (E1 → O24, E2 → O23, E3 → O22, E4 → O21)</p>
      </div>

      <div className="panel">
        <div className="filters" style={{ flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
          {/* Class / Year Level Selector */}
          <div className="form-group" style={{ minWidth: 220 }}>
            <label htmlFor="att-entry-level" style={{ fontWeight: 700 }}>Class / Entry Level</label>
            <select
              id="att-entry-level"
              value={entryLevel}
              onChange={(e) => {
                setEntryLevel(e.target.value);
                setSection('all');
              }}
              style={{ fontWeight: 600 }}
            >
              {ENTRY_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          {availableSections.length > 0 && (
            <div className="form-group" style={{ minWidth: 130 }}>
              <label htmlFor="att-section" style={{ fontWeight: 700 }}>Section</label>
              <select id="att-section" value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="all">All Sections</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Selector */}
          <div className="form-group" style={{ minWidth: 200 }}>
            <label htmlFor="att-subject" style={{ fontWeight: 700 }}>Subject</label>
            <select id="att-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Class Type */}
          <div className="form-group" style={{ minWidth: 120 }}>
            <label htmlFor="att-type" style={{ fontWeight: 700 }}>Session Type</label>
            <select id="att-type" value={classType} onChange={(e) => setClassType(e.target.value)}>
              <option value="lecture">Lecture</option>
              <option value="lab">Lab</option>
            </select>
          </div>

          {/* Anti-proxy locked date */}
          <div className="form-group" style={{ minWidth: 130 }}>
            <label htmlFor="att-date" style={{ fontWeight: 700 }}>Session Date</label>
            <input id="att-date" type="date" value={today} disabled title="Locked to current date to prevent proxy attendance" />
          </div>

          <button className="btn btn-primary" type="button" onClick={save} disabled={students.length === 0}>
            Submit Attendance
          </button>
        </div>

        {/* Status banner and batch buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          padding: '10px 14px',
          background: 'var(--bg-soft)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 13 }}>
            <strong>Class {entryLevel} ({currentLevelConfig.prefix}xxxx)</strong> ·{' '}
            <span style={{ color: '#16a34a', fontWeight: 600 }}>{presentCount} Present</span> ·{' '}
            <span style={{ color: '#ef4444', fontWeight: 600 }}>{students.length - presentCount} Absent</span> ·{' '}
            <span style={{ color: 'var(--text-muted)' }}>{students.length} Total</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => markAll('present')}>
              Mark All Present
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => markAll('absent')}>
              Mark All Absent
            </button>
          </div>
        </div>

        {loading && <div className="skeleton" style={{ height: 160 }} />}

        {!loading && students.length === 0 && (
          <EmptyState
            title={`No students found for Class ${entryLevel}`}
            hint={`No active students enrolled in ${user?.dept || 'this department'} for ${entryLevel}. Try another class level.`}
          />
        )}

        {!loading && students.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Section</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, index) => (
                  <tr key={s.student_id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{index + 1}</td>
                    <td>
                      <strong style={{
                        fontFamily: 'monospace',
                        color: s.student_id.startsWith(currentLevelConfig.prefix) ? 'var(--primary-dark)' : 'var(--text)',
                      }}>
                        {s.student_id}
                      </strong>
                    </td>
                    <td>{s.name}</td>
                    <td><span className="badge-pill" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>{s.section}</span></td>
                    <td>
                      <select
                        aria-label={`Attendance for ${s.name}`}
                        value={statusMap[s.student_id] || 'present'}
                        onChange={(e) => setStatusMap({ ...statusMap, [s.student_id]: e.target.value })}
                        style={{
                          fontWeight: 700,
                          color: statusMap[s.student_id] === 'present' ? '#16a34a' : '#ef4444',
                          borderColor: statusMap[s.student_id] === 'present' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                        }}
                      >
                        <option value="present">✓ Present</option>
                        <option value="absent">✕ Absent</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
