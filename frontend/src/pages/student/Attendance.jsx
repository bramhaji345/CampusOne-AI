import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Sparkles } from 'lucide-react';
import { EmptyState } from '../../components/Ui';
import api from '../../api';

export default function StudentAttendance() {
  const [data, setData] = useState({ summary: [], records: [], overall: 0, trend: [] });
  const [insight, setInsight] = useState('');

  const load = () => {
    api.get('/attendance').then((r) => setData(r.data));
    api.get('/attendance/ai-analysis').then((r) => setInsight(r.data.insight));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div className="page-title">
        <h1>Attendance</h1>
        <p>Live after faculty confirmation · subject-wise status and 14-day trend</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="label">Overall</div><div className="value">{data.overall}%</div></div>
        {data.summary.slice(0, 3).map((s) => (
          <div className="stat-card" key={s.subject}>
            <div className="label">{s.subject}</div>
            <div className="value">{s.percentage}%</div>
          </div>
        ))}
      </div>

      {insight && (
        <div className="ai-card">
          <div className="ai-label"><Sparkles size={14} /> Smart Alert</div>
          <p>{insight}</p>
        </div>
      )}

      <div className="panel">
        <h3>Attendance trend</h3>
        {data.trend?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.trend}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="percentage" stroke="#3b6dff" fill="#3b6dff33" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyState title="Trend appears after classes are marked" />}
      </div>

      <div className="panel">
        <h3>Subject-wise attendance</h3>
        {data.summary.length === 0 && <EmptyState title="No attendance recorded yet" />}
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Subject</th><th>Attended</th><th>Missed</th><th>Total</th><th>%</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.summary.map((s) => (
                <tr key={s.subject}>
                  <td>{s.subject}</td>
                  <td>{s.present}</td>
                  <td>{s.missed ?? s.total - s.present}</td>
                  <td>{s.total}</td>
                  <td>
                    <div className="progress" style={{ width: 90, display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }}>
                      <span style={{ width: `${Math.min(s.percentage, 100)}%`, background: s.percentage >= 75 ? 'var(--success)' : 'var(--danger)' }} />
                    </div>
                    {s.percentage}%
                  </td>
                  <td><span className={`badge-pill ${s.percentage >= 75 ? 'badge-approved' : 'badge-urgent'}`}>{s.status || (s.percentage >= 75 ? 'Safe' : 'At risk')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3>Recent records</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Subject</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {data.records.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.subject}</td>
                  <td>{r.class_type}</td>
                  <td><span className={`badge-pill ${r.status === 'present' ? 'badge-approved' : 'badge-rejected'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
