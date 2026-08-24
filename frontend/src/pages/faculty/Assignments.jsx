import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/Ui';
import api from '../../api';

export default function FacultyAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const subjects = (user?.subjects || 'DBMS').split(',').map((s) => s.trim());
  const [list, setList] = useState([]);
  const [subs, setSubs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: subjects[0],
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  const load = () => api.get('/assignments').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/assignments', form);
    toast('Assignment published to students');
    setForm({ ...form, title: '', description: '' });
    load();
  };

  const viewSubs = async (id) => {
    setOpenId(id);
    const { data } = await api.get(`/assignments/${id}/submissions`);
    setSubs(data);
  };

  return (
    <div>
      <div className="page-title">
        <h1>Assignments</h1>
        <p>Create work, set a deadline, and review student submissions</p>
      </div>
      <div className="grid-2">
        <div className="panel">
          <h3>Create assignment</h3>
          <form onSubmit={create}>
            <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label>Instructions</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
            <div className="form-group">
              <label>Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                {subjects.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Deadline</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            <button className="btn btn-primary" type="submit">Publish assignment</button>
          </form>
        </div>
        <div className="panel">
          <h3>Your assignments</h3>
          {list.length === 0 && <EmptyState title="No assignments yet." />}
          {list.map((a) => (
            <div key={a.id} className="notif-item" style={{ marginBottom: 8 }}>
              <h4>{a.title}</h4>
              <p>{a.subject} · Due {a.due_date}</p>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => viewSubs(a.id)}>View submissions</button>
              {openId === a.id && (
                <div style={{ marginTop: 10 }}>
                  {subs.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No submissions yet.</p>}
                  {subs.map((s) => (
                    <p key={s.id} style={{ fontSize: 13 }}>{s.student_name} · {s.status} · {s.submitted_at?.slice(0, 16)}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
