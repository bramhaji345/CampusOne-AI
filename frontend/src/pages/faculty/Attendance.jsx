import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/Ui';
import api from '../../api';

export default function FacultyAttendance() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const subjects = (user?.subjects || 'Data Structures').split(',').map((s) => s.trim());
  const [subject, setSubject] = useState(subjects[0]);
  const [classType, setClassType] = useState('lecture');
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  useEffect(() => {
    api.get('/students/list', { params: { dept: user?.dept || 'CSE' } }).then((r) => {
      setStudents(r.data);
      const map = {};
      r.data.forEach((s) => { map[s.student_id] = 'present'; });
      setStatusMap(map);
    });
  }, [user]);

  const save = async () => {
    const ok = await confirm({
      title: 'Confirm attendance',
      message: `Submit ${subject} (${classType}) for ${today}? This updates student records immediately. Duplicate submissions for today overwrite the same session.`,
      confirmLabel: 'Confirm Attendance',
    });
    if (!ok) return;
    const records = Object.entries(statusMap).map(([student_id, status]) => ({ student_id, status }));
    const { data } = await api.post('/attendance', { subject, class_type: classType, records });
    toast(`Attendance submitted successfully for ${data.date}`);
  };

  const presentCount = Object.values(statusMap).filter((v) => v === 'present').length;

  return (
    <div>
      <div className="page-title">
        <h1>Mark attendance</h1>
        <p>Date is locked to today ({today}) to prevent proxy / backdated marking</p>
      </div>
      <div className="panel">
        <div className="filters">
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>{subjects.map((s) => <option key={s}>{s}</option>)}</select>
          <select value={classType} onChange={(e) => setClassType(e.target.value)}>
            <option value="lecture">Lecture</option>
            <option value="lab">Lab</option>
          </select>
          <input type="date" value={today} disabled title="Cannot change — anti-proxy" />
          <button className="btn btn-primary" type="button" onClick={save}>Confirm Attendance</button>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: 13 }}>{presentCount} present · {students.length - presentCount} absent</p>
        {students.length === 0 && <EmptyState title="No students found for this class." />}
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Status</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student_id}>
                  <td>{s.student_id}</td>
                  <td>{s.name}</td>
                  <td>
                    <select value={statusMap[s.student_id] || 'present'} onChange={(e) => setStatusMap({ ...statusMap, [s.student_id]: e.target.value })}>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
