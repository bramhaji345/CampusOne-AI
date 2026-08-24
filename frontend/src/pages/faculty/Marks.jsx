import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

export default function FacultyMarks() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const subjects = (user?.subjects || 'Data Structures').split(',').map((s) => s.trim());
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    student_id: '',
    year_level: 'E2',
    semester: 'Sem1',
    subject: subjects[0],
    marks: 20,
    max_marks: 30,
  });

  useEffect(() => {
    api.get('/students/list', { params: { dept: user?.dept || 'CSE' } }).then((r) => {
      setStudents(r.data);
      if (r.data[0]) setForm((f) => ({ ...f, student_id: r.data[0].student_id }));
    });
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (form.marks < 0 || form.marks > form.max_marks) {
      setError(`Marks must be between 0 and ${form.max_marks}`);
      return;
    }
    const ok = await confirm({ title: 'Upload marks?', message: 'Students will see these scores immediately.', confirmLabel: 'Submit marks' });
    if (!ok) return;
    try {
      await api.post('/results/mid', form);
      toast('Marks uploaded successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save marks');
    }
  };

  return (
    <div>
      <div className="page-title">
        <h1>Upload marks</h1>
        <p>Select exam type, validate scores, then publish to the student portal</p>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div className="panel" style={{ maxWidth: 560 }}>
        <form onSubmit={save}>
          <div className="form-group">
            <label>Student</label>
            <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
              {students.map((s) => <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>)}
            </select>
          </div>
          <div className="filters">
            <select value={form.year_level} onChange={(e) => setForm({ ...form, year_level: e.target.value })}>
              {['E1', 'E2', 'E3', 'E4'].map((y) => <option key={y}>{y}</option>)}
            </select>
            <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
              <option>Sem1</option>
              <option>Sem2</option>
            </select>
            <select value={form.exam} disabled>
              <option>Mid</option>
            </select>
          </div>
          <div className="form-group">
            <label>Subject</label>
            <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
              {subjects.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="filters">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Marks</label>
              <input type="number" min="0" max={form.max_marks} value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Max</label>
              <input type="number" min="1" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: Number(e.target.value) })} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">Submit marks</button>
        </form>
      </div>
    </div>
  );
}
