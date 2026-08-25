import { useState } from 'react';
import { ScanLine } from 'lucide-react';
import api from '../../api';

export default function AdminScanner() {
  const [ref, setRef] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const scan = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    let id = ref.trim();
    try {
      const parsed = JSON.parse(id);
      id = parsed.ref || parsed.outpassId || id;
    } catch {
      /* plain id */
    }
    try {
      const { data } = await api.post('/outpasses/scan', { ref: id, outpassId: id });
      setResult(data);
    } catch (err) {
      setResult(err.response?.data || null);
      setError(err.response?.data?.message || err.response?.data?.error || 'Scan failed');
    }
  };

  const valid = result?.valid;

  return (
    <div>
      <div className="page-title">
        <h1>Security QR scanner</h1>
        <p>Scan or paste the outpass reference from the student QR. Personal details stay limited.</p>
      </div>
      <div className="panel" style={{ maxWidth: 520 }}>
        <form onSubmit={scan}>
          <div className="form-group">
            <label>Outpass reference</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder='{"ref":"..."} or UUID' required />
          </div>
          <button className="btn btn-primary" type="submit"><ScanLine size={16} /> Verify outpass</button>
        </form>
        {valid && <div className="scan-valid" style={{ marginTop: 16 }}>VALID OUTPASS</div>}
        {(result && !valid) || error ? <div className="scan-invalid" style={{ marginTop: 16 }}>{result?.message || error || 'INVALID / EXPIRED OUTPASS'}</div> : null}
        {result?.outpass && (
          <div className="info-grid" style={{ marginTop: 16 }}>
            <div className="info-item"><label>Student</label><p>{result.outpass.student_name || '—'}</p></div>
            <div className="info-item"><label>Outpass ID</label><p>{result.outpass.id}</p></div>
            <div className="info-item"><label>Approved by</label><p>{result.outpass.approved_by || '—'}</p></div>
            <div className="info-item"><label>Valid date</label><p>{result.outpass.from_date} → {result.outpass.to_date}</p></div>
            <div className="info-item"><label>Out time</label><p>{result.outpass.out_time || '—'}</p></div>
            <div className="info-item"><label>Return</label><p>{result.outpass.return_time || '—'}</p></div>
            <div className="info-item"><label>Status</label><p>{result.outpass.status}</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
