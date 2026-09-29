import { useCallback, useEffect, useState } from 'react';
import { Download, LayoutGrid, List, Printer } from 'lucide-react';
import { EmptyState } from '../../components/Ui';
import Logo from '../../components/Logo';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function StudentResults() {
  const { user } = useAuth();
  const [year, setYear] = useState(`E${user?.year || 1}`);
  const [sem, setSem] = useState('Sem1');
  const [type, setType] = useState('sem');
  const [rows, setRows] = useState([]);
  const [compact, setCompact] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/results', { params: { year_level: year, semester: sem, type } })
      .then((r) => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [year, sem, type]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('campus:data-changed', refresh);
    window.addEventListener('campus:reconnected', refresh);
    return () => { window.removeEventListener('campus:data-changed', refresh); window.removeEventListener('campus:reconnected', refresh); };
  }, [load]);

  const downloadCsv = () => {
    const header = 'Subject,Marks,Max,Grade,Status\n';
    const body = rows.map((r) => `${r.subject},${r.marks ?? ''},${r.max_marks ?? ''},${r.grade ?? ''},${r.result_status ?? ''}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `CampusOne-${year}-${sem}-${type}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="page-title">
        <h1>Results</h1>
        <p>E1–E4 · Semester and mid marks · download or print an official-style sheet</p>
      </div>

      <div className="panel no-print">
        <div className="filters">
          <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
            {['E1', 'E2', 'E3', 'E4'].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={sem} onChange={(e) => setSem(e.target.value)} aria-label="Semester">
            <option value="Sem1">Semester 1</option>
            <option value="Sem2">Semester 2</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Exam type">
            <option value="sem">Semester marks</option>
            <option value="mid">Mid marks</option>
          </select>
          <button className={`btn btn-sm ${compact ? 'btn-primary' : 'btn-outline'}`} type="button" onClick={() => setCompact(true)}><LayoutGrid size={14} /> Compact</button>
          <button className={`btn btn-sm ${!compact ? 'btn-primary' : 'btn-outline'}`} type="button" onClick={() => setCompact(false)}><List size={14} /> Detailed</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={downloadCsv}><Download size={14} /> Download</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => window.print()}><Printer size={14} /> Print</button>
        </div>
      </div>

      <div className="panel" id="results-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Logo size={36} />
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: 0 }}>{year} · {sem} · {type === 'sem' ? 'Semester Marks' : 'Mid Marks'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>CampusOne AI Result Statement</p>
          </div>
        </div>
        {loading && <div className="skeleton" style={{ height: 120 }} />}
        {!loading && rows.length === 0 && <EmptyState title="No results for this selection" hint="Try another year, semester, or exam type." />}
        {!loading && rows.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Marks</th>
                  {!compact && <th>Max</th>}
                  {!compact && <th>%</th>}
                  <th>Grade</th>
                  {!compact && <th>Grade points</th>}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const maxMarks = Number(r.max_marks);
                  const pct = Number.isFinite(Number(r.marks)) && maxMarks > 0 ? Math.round((Number(r.marks) / maxMarks) * 1000) / 10 : null;
                  const status = r.result_status || (pct == null ? '—' : pct >= 40 ? 'Pass' : 'Fail');
                  const pass = /pass|complete/i.test(status);
                  const gp = r.grade_points ?? r.grade_point;
                  return (
                    <tr key={r.id}>
                      <td>{r.subject}</td>
                      <td>{r.marks ?? '—'}</td>
                      {!compact && <td>{r.max_marks ?? '—'}</td>}
                      {!compact && <td>{pct ?? '—'}</td>}
                      <td><span className="badge-pill badge-approved">{r.grade}</span></td>
                      {!compact && <td>{gp ?? '—'}</td>}
                      <td><span className={`badge-pill ${pass ? 'badge-approved' : 'badge-rejected'}`}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
