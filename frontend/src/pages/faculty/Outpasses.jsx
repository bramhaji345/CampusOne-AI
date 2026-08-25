import { useEffect, useState } from 'react';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';
import { EmptyState } from '../../components/Ui';
import api from '../../api';

export default function FacultyOutpasses() {
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const load = () => api.get('/outpasses').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const review = async (id, status) => {
    const ok = await confirm({
      title: status === 'approved' ? 'Approve outpass?' : 'Reject outpass?',
      message: status === 'approved' ? 'The student will receive a QR code and a notification.' : 'The student will be notified of the rejection.',
      confirmLabel: status === 'approved' ? 'Approve' : 'Reject',
      danger: status === 'rejected',
    });
    if (!ok) return;
    await api.patch(`/outpasses/${id}`, { status });
    toast(status === 'approved' ? 'Outpass approved' : 'Outpass rejected');
    load();
  };

  return (
    <div>
      <div className="page-title">
        <h1>Outpass requests</h1>
        <p>Priority: Urgent → Medical → Event → Personal → Other</p>
      </div>
      <div className="panel">
        {list.length === 0 && <EmptyState title="No pending outpass requests." />}
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Student</th><th>Type</th><th>Reason</th><th>When</th><th>Destination</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} style={o.reason_type === 'urgent' ? { background: 'rgba(239,68,68,.06)' } : undefined}>
                  <td>{o.student_name || o.student_id}</td>
                  <td><span className={`badge-pill badge-${o.reason_type}`}>{o.reason_type}</span></td>
                  <td>{o.reason}</td>
                  <td>{o.from_date} {o.out_time || ''} → {o.return_time || o.to_date}</td>
                  <td>{o.destination || '—'}</td>
                  <td><span className={`badge-pill badge-${o.status === 'approved' ? 'approved' : o.status === 'rejected' ? 'rejected' : 'pending'}`}>{o.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setDetail(o)}>View</button>
                      {o.status === 'pending' && (
                        <>
                          <button type="button" className="btn btn-success btn-sm" onClick={() => review(o.id, 'approved')}>Approve</button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => review(o.id, 'rejected')}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Outpass details</h3>
            <p><strong>{detail.student_name}</strong> · {detail.reason_type}</p>
            <p style={{ color: 'var(--text-muted)' }}>{detail.reason}</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>{detail.from_date} {detail.out_time} – {detail.return_time} · {detail.destination}</p>
            {detail.extra && <p style={{ fontSize: 13 }}>{detail.extra}</p>}
            <button type="button" className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setDetail(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
