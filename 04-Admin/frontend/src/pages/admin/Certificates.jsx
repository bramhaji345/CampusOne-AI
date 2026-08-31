import { useEffect, useState } from 'react';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/Ui';
import api from '../../api';

export default function AdminCertificates() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('all');
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const load = () => api.get('/certificates').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const review = async (id, status) => {
    const ok = await confirm({
      title: status === 'approved' ? 'Approve certificate?' : 'Reject certificate?',
      message: 'The student will see the new status immediately.',
      confirmLabel: status === 'approved' ? 'Approve' : 'Reject',
      danger: status === 'rejected',
    });
    if (!ok) return;
    await api.patch(`/certificates/${id}`, { status });
    toast(`Certificate ${status}`);
    load();
  };

  const rows = list.filter((c) => filter === 'all' || c.status === filter);

  return (
    <div>
      <div className="page-title"><h1>Certificate management</h1><p>Review, approve, reject, and mark certificates ready</p></div>
      <div className="filters">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button key={f} type="button" className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="panel">
        {rows.length === 0 && <EmptyState title="No certificate requests." />}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Type</th><th>Purpose</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.student_name || c.student_id}</td>
                  <td>{c.type}</td>
                  <td>{c.purpose}</td>
                  <td><span className={`badge-pill badge-${c.status === 'approved' ? 'approved' : c.status === 'rejected' ? 'rejected' : 'pending'}`}>{c.status === 'approved' ? 'Ready' : c.status}</span></td>
                  <td>
                    {c.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-success btn-sm" onClick={() => review(c.id, 'approved')}>Approve</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => review(c.id, 'rejected')}>Reject</button>
                      </div>
                    )}
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
