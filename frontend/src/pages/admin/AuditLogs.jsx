import { useCallback, useEffect, useState } from 'react';
import api from '../../api';

export default function AuditLogs() {
  const [items, setItems] = useState([]);
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/audit-logs', { params: { page, limit: 50, entity } });
      setItems(data.items || []); setPages(data.pages || 1); setTotal(data.total || 0); setError('');
    } catch (err) { setError(err.response?.data?.error || 'Could not load audit history.'); }
  }, [page, entity]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('campus:data-changed', refresh);
    window.addEventListener('campus:reconnected', refresh);
    return () => { window.removeEventListener('campus:data-changed', refresh); window.removeEventListener('campus:reconnected', refresh); };
  }, [load]);

  return <div>
    <div className="page-title"><h1>Audit history</h1><p>Administrative changes are recorded with actor, time, source device, and before/after values.</p></div>
    {error && <div className="error-msg" role="alert">{error}</div>}
    <div className="panel">
      <div className="filters"><input aria-label="Filter by entity" placeholder="Filter entity (student, faculty, import…)" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} /><span className="muted">{total.toLocaleString()} records</span></div>
      <div className="table-wrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Old value</th><th>New value</th><th>Request</th></tr></thead><tbody>
        {items.map((item) => <tr key={item.id}>
          <td>{new Date(item.createdAt).toLocaleString()}</td><td>{item.user?.name || 'System'}<br /><small>{item.user?.email}</small></td><td>{item.action}</td><td>{item.entity} {item.entityId && <code>{item.entityId}</code>}</td>
          <td><pre className="audit-json">{item.oldValue ? JSON.stringify(item.oldValue) : '—'}</pre></td><td><pre className="audit-json">{item.newValue ? JSON.stringify(item.newValue) : '—'}</pre></td><td><small>{item.requestInfo || '—'}</small></td>
        </tr>)}
      </tbody></table></div>
      <div className="filters" style={{ justifyContent: 'space-between', marginTop: 12 }}><span className="muted">Page {page} of {pages}</span><div className="filters"><button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div></div>
    </div>
  </div>;
}
