import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/Ui';
import api from '../../api';

function statusOf(a) {
  if (a.submission) {
    const late = a.due_date && new Date(a.submission.submitted_at) > new Date(`${a.due_date}T23:59:59`);
    return late ? 'late' : (a.submission.status || 'submitted');
  }
  return 'pending';
}

export default function StudentAssignments() {
  const [list, setList] = useState([]);
  const { toast } = useToast();

  const load = () => api.get('/assignments').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (id, file, due) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.post(`/assignments/${id}/submit`, fd);
    toast(new Date() > new Date(`${due}T23:59:59`) ? 'Submitted (marked late)' : 'Assignment submitted successfully');
    load();
  };

  return (
    <div>
      <div className="page-title">
        <h1>Assignments</h1>
        <p>View faculty instructions, submit work, and replace a file before the deadline</p>
      </div>
      {list.length === 0 && <EmptyState title="No assignments yet." hint="New work from faculty will appear here." />}
      <div className="features-grid">
        {list.map((a) => {
          const st = statusOf(a);
          const past = a.due_date && new Date() > new Date(`${a.due_date}T23:59:59`);
          return (
            <div className="panel" key={a.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <h3>{a.title}</h3>
                <span className={`badge-pill badge-${st === 'pending' ? 'pending' : st === 'late' ? 'late' : 'submitted'}`}>{st}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>{a.description}</p>
              <p style={{ fontSize: 13 }}><strong>Subject:</strong> {a.subject}</p>
              <p style={{ fontSize: 13, marginBottom: 12 }}><strong>Deadline:</strong> {a.due_date}</p>
              {(!past || a.submission) && (
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                  {a.submission ? 'Replace submission' : 'Upload & Submit'}
                  <input type="file" hidden onChange={(e) => submit(a.id, e.target.files?.[0], a.due_date)} />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
