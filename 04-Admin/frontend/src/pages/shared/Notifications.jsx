import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/Ui';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', body: '', target_role: 'student', priority: 'normal' });

  const load = () => api.get('/notifications').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    toast('All notifications marked as read');
    load();
  };

  const create = async (e) => {
    e.preventDefault();
    await api.post('/notifications', form);
    toast('Notification sent');
    setForm({ title: '', body: '', target_role: 'student', priority: 'normal' });
    load();
  };

  const canCreate = user?.role === 'faculty' || user?.role === 'admin';
  const shown = list.filter((n) => {
    if (filter === 'unread') return !(n.read_by || []).includes(user?.id);
    if (filter === 'urgent') return n.priority === 'urgent' || n.priority === 'important';
    return true;
  });

  return (
    <div>
      <div className="page-title">
        <h1>Notifications</h1>
        <p>Exams, results, assignments, outpasses, and campus notices</p>
      </div>

      {canCreate && (
        <div className="panel">
          <h3>Create notification</h3>
          <form onSubmit={create}>
            <div className="form-group"><label>Subject</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label>Body</label><textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
            <div className="filters">
              {user.role === 'admin' && (
                <select value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })}>
                  <option value="student">Students</option>
                  <option value="faculty">Faculty</option>
                  <option value="all">All</option>
                </select>
              )}
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit">Send notification</button>
          </form>
        </div>
      )}

      <div className="filters">
        {['all', 'unread', 'urgent'].map((f) => (
          <button key={f} type="button" className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={markAll}>Mark all as read</button>
      </div>

      <div className="panel">
        {shown.length === 0 && <EmptyState title="No notifications available." hint="You're all caught up!" />}
        <div className="notif-list">
          {shown.map((n) => {
            const unread = !(n.read_by || []).includes(user?.id);
            return (
              <div key={n.id} className={`notif-item ${unread ? 'unread' : ''}`} onClick={() => markRead(n.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <h4>{n.title}</h4>
                  {n.priority && n.priority !== 'normal' && <span className={`badge-pill ${n.priority === 'urgent' ? 'badge-urgent' : 'badge-important'}`}>{n.priority}</span>}
                </div>
                <p>{n.body}</p>
                <p style={{ fontSize: 12, marginTop: 6 }}>{n.created_at}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
