import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/Ui';
import api from '../../api';

const label = {
  pending: 'Requested',
  approved: 'Ready for Download',
  rejected: 'Rejected',
  review: 'Under Review',
};

export default function StudentCertificates() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ type: 'Bonafide', purpose: '' });
  const { toast } = useToast();

  const load = () => api.get('/certificates').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/certificates', form);
    toast('Certificate request submitted');
    setForm({ type: 'Bonafide', purpose: '' });
    load();
  };

  const download = (c) => {
    const blob = new Blob(
      [`CampusOne AI\n${c.type}\nStudent request ${c.id}\nPurpose: ${c.purpose}\nStatus: Approved\n`],
      { type: 'text/plain' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${c.type.replace(/\s+/g, '-')}.txt`;
    a.click();
  };

  return (
    <div>
      <div className="page-title">
        <h1>Certificate requests</h1>
        <p>Bonafide, study, character, and other official certificates</p>
      </div>
      <div className="grid-2">
        <div className="panel">
          <h3>New request</h3>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Bonafide</option>
                <option>Study Certificate</option>
                <option>Character Certificate</option>
                <option>Conduct Certificate</option>
                <option>Course Completion</option>
              </select>
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <textarea rows={3} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
            </div>
            <button className="btn btn-primary" type="submit">Submit request</button>
          </form>
        </div>
        <div className="panel">
          <h3>Track requests</h3>
          {list.length === 0 && <EmptyState title="No certificate requests yet." />}
          {list.map((c) => (
            <div key={c.id} className="notif-item" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4>{c.type}</h4>
                <span className={`badge-pill badge-${c.status === 'approved' ? 'approved' : c.status === 'rejected' ? 'rejected' : 'pending'}`}>
                  {label[c.status] || c.status}
                </span>
              </div>
              <p>{c.purpose}</p>
              {c.status === 'approved' && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => download(c)}>
                  <Download size={14} /> Download
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
