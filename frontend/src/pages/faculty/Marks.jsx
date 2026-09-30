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

export default function FacultyMarks() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const subjects = (user?.subjects || '').split(',').map((s) => s.trim()).filter(Boolean);
  const [students, setStudents] = useState([]);
  const [section, setSection] = useState('all');
  const [availableSections, setAvailableSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    student_id: '',
    year_level: 'E3',
    semester: 'Sem1',
    subject: subjects[0] || '',
    marks: 24,
    max_marks: 30,
  });

  const currentLevelConfig = ENTRY_LEVELS.find((l) => l.value === form.year_level) || ENTRY_LEVELS[2];

  // Fetch students whenever department, subject, year_level, or section changes
  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/students/list', {
      params: {
        dept: user?.dept,
        subject: form.subject,
        year_level: form.year_level,
        section: section !== 'all' ? section : undefined,
      },
    })
      .then((r) => {
        const data = r.data || [];
        setStudents(data);

        // Update selected student if previous one is not in this class
        if (data.length > 0) {
          const exists = data.some((s) => s.student_id === form.student_id);
          if (!exists) {
            setForm((f) => ({ ...f, student_id: data[0].student_id }));
          }
        } else {
          setForm((f) => ({ ...f, student_id: '' }));
        }

        // Available sections
        const sects = [...new Set(data.map((s) => s.section).filter(Boolean))].sort();
        if (sects.length > 0) setAvailableSections(sects);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [user, form.subject, form.year_level, section]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.student_id) {
      setError('Please select a student from the active class list');
      return;
    }
    if (form.marks < 0 || form.marks > form.max_marks) {
      setError(`Marks must be between 0 and ${form.max_marks}`);
      return;
    }
    const student = students.find((s) => s.student_id === form.student_id);
    const ok = await confirm({
      title: 'Upload Mid Marks?',
      message: `Publish ${form.marks}/${form.max_marks} in ${form.subject} (${form.year_level} ${form.semester}) for ${student?.name || form.student_id}? Student will see this score immediately.`,
      confirmLabel: 'Publish Marks',
    });
    if (!ok) return;

    try {
      await api.post('/results/mid', form);
      toast(`Mid marks saved for ${student?.name || form.student_id} (${form.marks}/${form.max_marks})`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save marks');
    }
  };

  const selectedStudent = students.find((s) => s.student_id === form.student_id);

  return (
    <div>
      <div className="page-title">
        <h1>Upload marks</h1>
        <p>Select student class/year level to load students matching that batch (E1 → O24, E2 → O23, E3 → O22, E4 → O21)</p>
      </div>

      {error && <div className="error-msg" role="alert">{error}</div>}

      <div className="panel" style={{ maxWidth: 640 }}>
        <form onSubmit={save}>
          {/* Class / Year Level Selector Box */}
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label htmlFor="marks-year-level" style={{ fontWeight: 700 }}>
              Class / Entry Level
            </label>
            <select
              id="marks-year-level"
              value={form.year_level}
              onChange={(e) => {
                const newLevel = e.target.value;
                setForm((f) => ({ ...f, year_level: newLevel }));
                setSection('all');
              }}
              style={{ fontWeight: 600, fontSize: 14, padding: '10px 12px' }}
            >
              {ENTRY_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          {availableSections.length > 0 && (
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="marks-section" style={{ fontWeight: 700 }}>Section Filter</label>
              <select id="marks-section" value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="all">All Sections in Class {form.year_level}</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>
          )}

          {/* Student Selector */}
          <div className="form-group" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <label htmlFor="marks-student" style={{ fontWeight: 700 }}>
                Student ({currentLevelConfig.prefix}xxxx)
              </label>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {students.length} students loaded in Class {form.year_level}
              </span>
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: 42 }} />
            ) : students.length === 0 ? (
              <EmptyState title={`No students found in Class ${form.year_level}`} hint="Try selecting another class or subject." />
            ) : (
              <select
                id="marks-student"
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                required
                style={{ fontFamily: 'monospace', fontWeight: 600 }}
              >
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.student_id} — {s.name} ({s.dept} · Sec {s.section})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedStudent && (
            <div style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              marginBottom: 14,
              fontSize: 13,
            }}>
              Selected: <strong>{selectedStudent.name}</strong> ({selectedStudent.student_id}) · Class {form.year_level} · Section {selectedStudent.section} · Current CGPA: {selectedStudent.cgpa ?? '—'}
            </div>
          )}

          {/* Semester and Exam Type */}
          <div className="filters" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="marks-semester" style={{ fontWeight: 700 }}>Semester</label>
              <select id="marks-semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                <option value="Sem1">Semester 1 (Sem1)</option>
                <option value="Sem2">Semester 2 (Sem2)</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="marks-exam" style={{ fontWeight: 700 }}>Assessment</label>
              <select id="marks-exam" disabled>
                <option>Mid Examination</option>
              </select>
            </div>
          </div>

          {/* Subject Selector */}
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label htmlFor="marks-subject" style={{ fontWeight: 700 }}>Subject</label>
            <select id="marks-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Marks & Max Marks */}
          <div className="filters" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="marks-obtained" style={{ fontWeight: 700 }}>Marks Scored</label>
              <input
                id="marks-obtained"
                type="number"
                min="0"
                max={form.max_marks}
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="marks-max" style={{ fontWeight: 700 }}>Maximum Marks</label>
              <input
                id="marks-max"
                type="number"
                min="1"
                value={form.max_marks}
                onChange={(e) => setForm({ ...form, max_marks: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={!form.student_id || loading} style={{ width: '100%' }}>
            Publish Mid Marks
          </button>
        </form>
      </div>
    </div>
  );
}
