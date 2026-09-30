import { useCallback, useEffect, useState } from 'react';
import CredentialModal from '../../components/CredentialModal';
import api from '../../api';

const blank = { name: '', email: '', faculty_id: '', dept: '', designation: '', mobile: '', subjects: '' };

export default function AdminFaculty() {
  const [list, setList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(blank);
  const [edit, setEdit] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [credentialModalData, setCredentialModalData] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/faculty', { params: { page, limit: 50, q: query } });
      setList(data.items || []); setPages(data.pages || 1); setTotal(data.total || 0); setError('');
    } catch (err) { setError(err.response?.data?.error || 'Could not load faculty.'); }
  }, [page, query]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/admin/departments').then(({ data }) => { setDepartments(data); if (data.length) setForm((f) => ({ ...f, dept: f.dept || data[0].code })); }).catch(() => {}); }, []);
  useEffect(() => {
    const refresh = (event) => { if (!event.detail?.entity || ['faculty', 'campus'].includes(event.detail.entity)) load(); };
    const reconnect = () => load();
    window.addEventListener('campus:data-changed', refresh); window.addEventListener('campus:reconnected', reconnect);
    return () => { window.removeEventListener('campus:data-changed', refresh); window.removeEventListener('campus:reconnected', reconnect); };
  }, [load]);

  const save = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      if (edit) {
        await api.put(`/admin/faculty/${encodeURIComponent(edit.faculty_id)}`, { ...form, expectedVersion: edit.version });
        setMessage('Faculty changes saved.');
      } else {
        const { data } = await api.post('/admin/faculty', form);
        setCredentialModalData({
          title: 'Account Created Successfully',
          name: data.faculty?.name || form.name,
          faculty_id: data.faculty?.faculty_id || form.faculty_id,
          email: data.faculty?.email || form.email,
          temporaryPassword: data.temporaryPassword,
          role: 'faculty',
          isReset: false,
        });
        setMessage('Faculty account created successfully.');
      }
      setForm({ ...blank, dept: departments[0]?.code || '' }); setEdit(null); await load();
    } catch (err) { setError(err.response?.data?.error || 'Could not save faculty.'); }
  };

  const resetPassword = async (faculty) => {
    if (!window.confirm(`Reset password for faculty ${faculty.name} (${faculty.faculty_id})?\n\nA new temporary password will be generated.`)) return;
    setError(''); setMessage('');
    try {
      const { data } = await api.post(`/admin/faculty/${encodeURIComponent(faculty.faculty_id)}/reset-password`);
      setCredentialModalData({
        title: 'Password Reset Successfully',
        name: data.faculty?.name || faculty.name,
        faculty_id: data.faculty?.faculty_id || faculty.faculty_id,
        email: data.faculty?.email || faculty.email,
        temporaryPassword: data.temporaryPassword,
        role: 'faculty',
        isReset: true,
      });
      setMessage(`Password reset for ${faculty.faculty_id}.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset faculty password.');
    }
  };

  const beginEdit = (faculty) => {
    setEdit(faculty);
    setForm({ name: faculty.name, email: faculty.email, faculty_id: faculty.faculty_id, dept: faculty.dept, designation: faculty.designation || '', mobile: faculty.mobile || '', subjects: faculty.subjects || '' });
  };
  const deactivate = async (faculty) => {
    if (!window.confirm(`Deactivate ${faculty.name} (${faculty.faculty_id})?`)) return;
    try { await api.delete(`/admin/faculty/${encodeURIComponent(faculty.faculty_id)}`, { data: { expectedVersion: faculty.version } }); await load(); }
    catch (err) { setError(err.response?.data?.error || 'Could not deactivate faculty.'); }
  };

  return (
    <div>
      <div className="page-title"><h1>Faculty management</h1><p>Search and manage faculty accounts and department assignments.</p></div>
      {message && <div className="success-msg" role="status">{message}</div>}{error && <div className="error-msg" role="alert">{error}</div>}
      <div className="panel">
        <h3>{edit ? `Edit ${edit.faculty_id}` : 'Add faculty'}</h3>
        <form onSubmit={save} className="filters" style={{ alignItems: 'flex-end' }}>
          {Object.keys(form).filter((key) => key !== 'dept').map((key) => <div className="form-group" key={key} style={{ minWidth: 150 }}>
            <label htmlFor={`faculty-${key}`}>{key.replaceAll('_', ' ')}</label>
            <input id={`faculty-${key}`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={['name', 'email', 'faculty_id'].includes(key)} disabled={Boolean(edit && key === 'faculty_id')} />
          </div>)}
          <div className="form-group"><label htmlFor="faculty-dept">Department</label><select id="faculty-dept" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} required><option value="">Select</option>{departments.map((d) => <option value={d.code} key={d.id}>{d.name} ({d.code})</option>)}</select></div>
          <button className="btn btn-primary" type="submit">{edit ? 'Save changes' : 'Add faculty'}</button>
          {edit && <button className="btn btn-ghost" type="button" onClick={() => { setEdit(null); setForm({ ...blank, dept: departments[0]?.code || '' }); }}>Cancel</button>}
        </form>
      </div>
      <div className="panel">
        <div className="filters"><input aria-label="Search faculty" placeholder="Search faculty ID, employee ID, name, email, department…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /><span className="muted">{total.toLocaleString()} faculty</span></div>
        <div className="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Designation</th><th>Subjects</th><th>Actions</th></tr></thead>
          <tbody>{list.map((f) => <tr key={f.faculty_id}><td>{f.faculty_id}</td><td>{f.name}</td><td>{f.email}</td><td>{f.dept}</td><td>{f.designation}</td><td>{f.subjects}</td><td><div className="filters"><button className="btn btn-ghost btn-sm" onClick={() => beginEdit(f)} type="button">Edit</button><button className="btn btn-ghost btn-sm" onClick={() => resetPassword(f)} type="button" title="Generate new temporary password">Reset Password</button><button className="btn btn-ghost btn-sm" onClick={() => deactivate(f)} type="button">Deactivate</button></div></td></tr>)}</tbody>
        </table></div>
        <div className="filters" style={{ justifyContent: 'space-between', marginTop: 12 }}><span className="muted">Page {page} of {pages}</span><div className="filters"><button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </div>
      <CredentialModal data={credentialModalData} onClose={() => setCredentialModalData(null)} />
    </div>
  );
}
