import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/Ui';
import api from '../../api';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function StudentOutpasses() {
  const [list, setList] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [form, setForm] = useState({
    reason: '',
    reason_type: 'event',
    from_date: today(),
    to_date: today(),
    destination: '',
    out_time: '16:00',
    return_time: '20:00',
    extra: '',
    faculty_id: 'FAC001',
  });
  const { toast } = useToast();

  const load = () => api.get('/outpasses').then((r) => setList(r.data));
  useEffect(() => {
    load();
    api.get('/faculty/list').then((r) => {
      setFaculty(r.data);
      if (r.data[0]) setForm((f) => ({ ...f, faculty_id: r.data[0].faculty_id }));
    }).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/outpasses', form);
    toast('Outpass request sent to faculty');
    setForm({ ...form, reason: '', extra: '' });
    load();
  };

  return (
    <div>
      <div className="page-title">
        <h1>Outpass requests</h1>
        <p>Submit → faculty reviews by priority → approved requests receive a gate QR</p>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>New request</h3>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Type</label>
              <select value={form.reason_type} onChange={(e) => setForm({ ...form, reason_type: e.target.value })}>
                <option value="urgent">Urgent</option>
                <option value="medical">Medical</option>
                <option value="event">Event</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Faculty reviewer</label>
              <select value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}>
                {faculty.map((f) => <option key={f.faculty_id} value={f.faculty_id}>{f.name} ({f.faculty_id})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="City hospital / home / event venue" />
            </div>
            <div className="filters">
              <div className="form-group" style={{ flex: 1 }}><label>Date</label><input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value, to_date: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Out time</label><input type="time" value={form.out_time} onChange={(e) => setForm({ ...form, out_time: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Return time</label><input type="time" value={form.return_time} onChange={(e) => setForm({ ...form, return_time: e.target.value })} /></div>
            </div>
            <div className="form-group">
              <label>Additional information</label>
              <textarea rows={2} value={form.extra} onChange={(e) => setForm({ ...form, extra: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit">Submit outpass</button>
          </form>
        </div>

        <div className="panel">
          <h3>My requests</h3>
          {list.length === 0 && <EmptyState title="No pending outpass requests." hint="Create one when you need to leave campus." />}
          {list.map((o) => (
            <div key={o.id} className="notif-item" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <h4>{o.reason_type}</h4>
                <span className={`badge-pill badge-${o.status === 'approved' ? 'approved' : o.status === 'rejected' ? 'rejected' : 'pending'}`}>{o.status}</span>
              </div>
              <p>{o.reason}</p>
              <p style={{ fontSize: 12 }}>{o.from_date} · {o.out_time || '—'} → {o.return_time || '—'} · {o.destination || 'Campus leave'}</p>
              {o.status === 'approved' && o.qr_code && (
                <div className="qr-box">
                  <img src={o.qr_code} alt="Outpass QR" />
                  <p style={{ fontSize: 13, marginTop: 8 }}>Show this QR at the security gate</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
