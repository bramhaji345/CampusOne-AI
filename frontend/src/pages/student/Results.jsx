import { useCallback, useEffect, useState } from 'react';
import { Download, LayoutGrid, List, Printer } from 'lucide-react';
import { EmptyState } from '../../components/Ui';
import Logo from '../../components/Logo';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

function gradeColor(grade) {
  if (!grade) return 'var(--text-muted)';
  const g = grade.toUpperCase();
  if (g === 'EX' || g === 'A+') return '#22c55e';
  if (g === 'A') return '#3b82f6';
  if (g === 'B+' || g === 'B') return '#a855f7';
  if (g === 'C') return '#f59e0b';
  if (g === 'D') return '#f97316';
  if (g === 'F' || g === 'FAIL') return '#ef4444';
  return 'var(--text-muted)';
}

export default function StudentResults() {
  const { user } = useAuth();
  const [year, setYear] = useState(`E${user?.year || 1}`);
  const [sem, setSem] = useState('1');
  const [type, setType] = useState('sem');
  const [rows, setRows] = useState([]);
  const [compact, setCompact] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cgpaData, setCgpaData] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/results', { params: { year_level: year, semester: sem, type } }),
      api.get('/results/ai-analysis'),
    ])
      .then(([r, a]) => {
        setRows(r.data);
        setCgpaData(a.data?.trend || []);
      })
      .catch(() => { setRows([]); })
      .finally(() => setLoading(false));
  }, [year, sem, type]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('campus:data-changed', refresh);
    window.addEventListener('campus:reconnected', refresh);
    return () => {
      window.removeEventListener('campus:data-changed', refresh);
      window.removeEventListener('campus:reconnected', refresh);
    };
  }, [load]);

  const downloadCsv = () => {
    const header = 'Subject,Code,Credits,Marks,Max,Grade,Grade Points,Status\n';
    const body = rows.map((r) =>
      `${r.subject},${r.course_code ?? ''},${r.credits ?? ''},${r.marks ?? ''},${r.max_marks ?? ''},${r.grade ?? ''},${r.grade_points ?? r.grade_point ?? ''},${r.result_status ?? ''}`
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `CampusOne-${year}-Sem${sem}-${type}.csv`;
    a.click();
  };

  // Get semester GPA from CGPA trend
  const semGpa = cgpaData.find((d) => {
    const semStr = String(sem).replace(/^Sem/i, '');
    return d.label === `${year} Sem${semStr}` || d.label === `${year} S${semStr}`;
  })?.gpa;

  return (
    <div>
      <div className="page-title">
        <h1>Results</h1>
        <p>E1–E4 · Semester and mid marks · Download or print an official-style sheet</p>
      </div>

      {/* Filters */}
      <div className="panel no-print">
        <div className="filters">
          <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
            {['E1', 'E2', 'E3', 'E4'].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={sem} onChange={(e) => setSem(e.target.value)} aria-label="Semester">
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
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

      {/* Results panel */}
      <div className="panel" id="results-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Logo size={36} />
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: 0 }}>{year} · Semester {sem} · {type === 'sem' ? 'Semester Marks' : 'Mid Marks'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {user?.name} · {user?.student_id} · {user?.dept} · Section {user?.section}
            </p>
          </div>
        </div>

        {semGpa != null && type === 'sem' && (
          <div style={{ marginBottom: 12, padding: '8px 14px', background: 'var(--bg-soft)', borderRadius: 8, display: 'flex', gap: 20, alignItems: 'center', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Semester GPA:</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: semGpa >= 8 ? '#22c55e' : semGpa >= 6 ? '#f59e0b' : '#ef4444' }}>
              {semGpa.toFixed(3)}
            </span>
          </div>
        )}

        {loading && <div className="skeleton" style={{ height: 120 }} />}
        {!loading && rows.length === 0 && (
          <EmptyState
            title="No results for this selection"
            hint="Try another year, semester, or exam type."
          />
        )}
        {!loading && rows.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {!compact && <th>Code</th>}
                  <th>Subject</th>
                  <th>Marks</th>
                  {!compact && <th>Max</th>}
                  {!compact && <th>%</th>}
                  {!compact && <th>Credits</th>}
                  <th>Grade</th>
                  {!compact && <th>GP</th>}
                  {!compact && <th>Credit Pts</th>}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const maxMarks = Number(r.max_marks) || (type === 'mid' ? 30 : 100);
                  const pct = Number.isFinite(Number(r.marks)) && maxMarks > 0
                    ? Math.round((Number(r.marks) / maxMarks) * 1000) / 10
                    : null;
                  const status = r.result_status || (pct == null ? '—' : pct >= 40 ? 'PASS' : 'FAIL');
                  const pass = /pass|complete/i.test(status);
                  const gp = r.grade_points ?? r.grade_point;
                  const creditPts = r.credit_points;
                  return (
                    <tr key={r.id}>
                      {!compact && <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.course_code ?? '—'}</td>}
                      <td style={{ fontWeight: 500 }}>{r.subject}</td>
                      <td style={{ fontWeight: 600 }}>{r.marks ?? '—'}</td>
                      {!compact && <td>{maxMarks}</td>}
                      {!compact && <td>{pct != null ? `${pct}%` : '—'}</td>}
                      {!compact && <td>{r.credits ?? '—'}</td>}
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: gradeColor(r.grade), background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
                          {r.grade ?? '—'}
                        </span>
                      </td>
                      {!compact && <td>{gp ?? '—'}</td>}
                      {!compact && <td>{creditPts ?? '—'}</td>}
                      <td>
                        <span className={`badge-pill ${pass ? 'badge-approved' : 'badge-rejected'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CGPA journey summary */}
      {cgpaData.length > 0 && (
        <div className="panel no-print cgpa-history-panel">
          <h3>CGPA journey (all semesters)</h3>
          <div className="cgpa-history-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cgpaData.map((item) => {
              const isSelected = item.label.startsWith(year);
              return (
                <div key={item.label} style={{
                  padding: '8px 14px', borderRadius: 10,
                  background: 'var(--bg-soft)',
                  border: isSelected ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                  textAlign: 'center', minWidth: 80,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.gpa >= 8 ? '#22c55e' : item.gpa >= 6 ? '#f59e0b' : '#ef4444' }}>
                    {item.gpa.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
