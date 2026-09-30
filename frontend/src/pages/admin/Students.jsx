import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import CredentialModal from '../../components/CredentialModal';
import api from '../../api';

const emptyForm = { name: '', email: '', student_id: '', dorm_no: '', course: 'B.Tech', year: 1, dept: '', parent_name: '', mobile: '', parent_phone: '', section: 'A' };

export default function AdminStudents() {
  const [list, setList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [importReport, setImportReport] = useState(null);
  const [allowSynthetic, setAllowSynthetic] = useState(false);
  const [allowUnconfirmed, setAllowUnconfirmed] = useState(false);
  const [credentialModalData, setCredentialModalData] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/students', { params: { page, limit: 50, q: query, dept } });
      setList(data.items || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setError('');
    } catch (err) { setError(err.response?.data?.error || 'Could not load students.'); }
    finally { setLoading(false); }
  }, [page, query, dept]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/departments').then(({ data }) => {
      setDepartments(data);
      if (data.length) setForm((current) => ({ ...current, dept: current.dept || data[0].code }));
    }).catch(() => {});
  }, []);
  useEffect(() => {
    const refresh = (event) => { if (!event.detail?.entity || event.detail.entity === 'student' || event.detail.entity === 'campus') load(); };
    const reconnect = () => load();
    window.addEventListener('campus:data-changed', refresh);
    window.addEventListener('campus:reconnected', reconnect);
    return () => { window.removeEventListener('campus:data-changed', refresh); window.removeEventListener('campus:reconnected', reconnect); };
  }, [load]);
  useEffect(() => { const timer = setTimeout(() => { setPage(1); setQuery(q); }, 250); return () => clearTimeout(timer); }, [q]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (edit) {
        await api.put(`/admin/students/${encodeURIComponent(edit.student_id)}`, { ...form, expectedVersion: edit.version });
        toast('Student changes saved.');
      } else {
        const { data } = await api.post('/admin/students', form);
        setCredentialModalData({
          title: 'Account Created Successfully',
          name: data.student?.name || form.name,
          student_id: data.student?.student_id || form.student_id,
          email: data.student?.email || form.email,
          temporaryPassword: data.temporaryPassword,
          role: 'student',
          isReset: false,
        });
        toast('Student created successfully.');
      }
      setForm({ ...emptyForm, dept: departments[0]?.code || '' });
      setEdit(null);
      await load();
    } catch (err) { setError(err.response?.data?.error || 'Could not save student.'); }
  };

  const resetPassword = async (student) => {
    if (!window.confirm(`Reset password for student ${student.name} (${student.student_id})?\n\nA new temporary password will be generated.`)) return;
    setError('');
    try {
      const { data } = await api.post(`/admin/students/${encodeURIComponent(student.student_id)}/reset-password`);
      setCredentialModalData({
        title: 'Password Reset Successfully',
        name: data.student?.name || student.name,
        student_id: data.student?.student_id || student.student_id,
        email: data.student?.email || student.email,
        temporaryPassword: data.temporaryPassword,
        role: 'student',
        isReset: true,
      });
      toast(`Password reset for ${student.student_id}.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset student password.');
    }
  };

  const beginEdit = (student) => {
    setEdit(student);
    setForm({ ...emptyForm, name: student.name, email: student.email, student_id: student.student_id, dorm_no: student.dorm_no || '', course: student.course || 'B.Tech', year: student.year || 1, dept: student.dept, section: student.section || 'A', mobile: student.mobile || '', parent_name: student.parent_name || '', parent_phone: student.parent_phone || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deactivate = async (student) => {
    if (!window.confirm(`Deactivate ${student.name} (${student.student_id})?`)) return;
    try { await api.delete(`/admin/students/${encodeURIComponent(student.student_id)}`, { data: { expectedVersion: student.version } }); toast('Student deactivated.'); await load(); }
    catch (err) { setError(err.response?.data?.error || 'Could not deactivate student.'); }
  };

  const preview = async () => {
    if (!file) return;
    const body = new FormData(); body.append('file', file);
    try { const { data } = await api.post('/admin/import/preview', body); setImportReport(data); setAllowSynthetic(false); setAllowUnconfirmed(false); }
    catch (err) { setImportReport(err.response?.data?.report || null); setError(err.response?.data?.error || 'Could not preview the workbook.'); }
  };

  const downloadErrors = () => {
    if (!importReport?.errors?.length) return;
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = ['sheet,row,key,errors', ...importReport.errors.map((r) => [r.sheet, r.row, r.key, r.errors.join('; ')].map(escape).join(','))].join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'campus-import-errors.csv'; link.click(); URL.revokeObjectURL(link.href);
  };

  const importData = async () => {
    if (!file) return;
    const body = new FormData(); body.append('file', file); body.append('allowSynthetic', String(allowSynthetic)); body.append('allowUnconfirmedStructure', String(allowUnconfirmed));
    try {
      const { data } = await api.post('/admin/import', body);
      toast(`Import complete: ${data.studentsCreated} new students, ${data.studentsUpdated} updated; ${data.academicRecords} course records; ${data.facultyCreated} new faculty, ${data.facultyUpdated} updated.`);
      setImportReport(null); setFile(null); setAllowSynthetic(false); setAllowUnconfirmed(false); await load();
    } catch (err) { setError(err.response?.data?.error || 'Import failed.'); if (err.response?.data?.report) setImportReport(err.response.data.report); }
  };

  return (
    <div>
      <div className="page-title"><h1>Student management</h1><p>Search, filter, and manage student records from the central campus database.</p></div>
      {error && <div className="error-msg" role="alert">{error}</div>}
      <div className="panel">
        <h3>{edit ? `Edit ${edit.student_id}` : 'Add student'}</h3>
        <form onSubmit={submit} className="filters" style={{ alignItems: 'flex-end' }}>
          {['name', 'email', 'student_id', 'dorm_no', 'section', 'mobile', 'parent_name', 'parent_phone'].map((key) => (
            <div className="form-group" key={key} style={{ minWidth: 140 }}>
              <label htmlFor={`student-${key}`}>{key.replaceAll('_', ' ')}</label>
              <input id={`student-${key}`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={['name', 'email', 'student_id'].includes(key)} disabled={Boolean(edit && key === 'student_id')} />
            </div>
          ))}
          <div className="form-group"><label htmlFor="student-dept">Department</label><select id="student-dept" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} required><option value="">Select</option>{departments.map((d) => <option key={d.id} value={d.code}>{d.name} ({d.code})</option>)}</select></div>
          <div className="form-group"><label htmlFor="student-year">Entry level</label><select id="student-year" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>{[1, 2, 3, 4].map((year) => <option key={year} value={year}>E{year}</option>)}</select></div>
          <button className="btn btn-primary" type="submit">{edit ? 'Save changes' : 'Add student'}</button>
          {edit && <button className="btn btn-ghost" type="button" onClick={() => { setEdit(null); setForm({ ...emptyForm, dept: departments[0]?.code || '' }); }}>Cancel edit</button>}
        </form>
      </div>

      <div className="panel">
        <h3>Import workbook</h3>
        <p className="muted">Upload an Excel file to validate the student, faculty, department, branch, and subject sheets before importing.</p>
        <div className="filters">
          <input aria-label="Choose Excel workbook" type="file" accept=".xlsx,.xls" onChange={(e) => { setFile(e.target.files?.[0] || null); setImportReport(null); }} />
          <button className="btn btn-ghost" type="button" disabled={!file} onClick={preview}>Validate and preview</button>
        </div>
        {importReport && <div className="import-preview" style={{ marginTop: 16 }}>
          <div className="stats-grid">
            <div className="stat-card"><div className="label">Students</div><div className="value">{importReport.students?.total ?? 0}</div></div>
            <div className="stat-card"><div className="label">Faculty</div><div className="value">{importReport.faculty?.total ?? 0}</div></div>
            <div className="stat-card"><div className="label">Invalid rows</div><div className="value">{importReport.errorCount ?? 0}</div></div>
            <div className="stat-card"><div className="label">Needs confirmation</div><div className="value">{(importReport.requiresConfirmationBranches ?? 0) + (importReport.requiresConfirmationDepartments?.length ?? 0) + (importReport.requiresConfirmationSubjects?.length ?? 0)}</div></div>
          </div>
          <p className="muted">Related records found: {importReport.academicRecords?.toLocaleString() ?? 0} student-course rows, {importReport.semesterResults?.toLocaleString() ?? 0} semester results, {importReport.facultyAssignments ?? 0} course assignments, {importReport.advisors ?? 0} advisors, {importReport.facultyLeaves ?? 0} leave rows. Exact duplicate assignments to deduplicate: {importReport.duplicateRows?.Faculty_Course_Assignment ?? 0}.</p>
          <p className="muted">Worksheets detected: {(importReport.sheetNames || []).join(', ')}. Existing database: {importReport.database?.existingStudents ?? '—'} students, {importReport.database?.existingFaculty ?? '—'} faculty.</p>
          {importReport.synthetic && <label className="confirm-synthetic"><input type="checkbox" checked={allowSynthetic} onChange={(e) => setAllowSynthetic(e.target.checked)} /> This workbook is marked SYNTHETIC / DEMONSTRATION DATA. Import it as demonstration data into this database.</label>}
          {(importReport.requiresConfirmationBranches > 0 || importReport.requiresConfirmationDepartments?.length > 0 || importReport.requiresConfirmationSubjects?.length > 0) && <label className="confirm-synthetic"><input type="checkbox" checked={allowUnconfirmed} onChange={(e) => setAllowUnconfirmed(e.target.checked)} /> I reviewed the unconfirmed references: branch(es) {importReport.branches?.filter((branch) => /requires user confirmation/i.test(branch.confirmation_status || '')).map((branch) => branch.branch_code).join(', ') || 'none'}; department(s) {(importReport.requiresConfirmationDepartments || []).map((department) => department.code).join(', ') || 'none'}; subject code(s) {(importReport.requiresConfirmationSubjects || []).join(', ') || 'none'}. Keep these records marked REQUIRES CONFIRMATION.</label>}
          {importReport.errors?.length > 0 && <><button className="btn btn-ghost" type="button" onClick={downloadErrors}>Download error report</button><div className="table-wrap"><table><thead><tr><th>Sheet</th><th>Row</th><th>Key</th><th>Issues</th></tr></thead><tbody>{importReport.errors.slice(0, 20).map((item, index) => <tr key={`${item.sheet}-${item.row}-${index}`}><td>{item.sheet}</td><td>{item.row}</td><td>{item.key}</td><td>{item.errors.join('; ')}</td></tr>)}</tbody></table></div></>}
          <button className="btn btn-primary" type="button" disabled={Boolean(importReport.errorCount) || (importReport.synthetic && !allowSynthetic) || ((importReport.requiresConfirmationBranches > 0 || importReport.requiresConfirmationDepartments?.length > 0 || importReport.requiresConfirmationSubjects?.length > 0) && !allowUnconfirmed)} onClick={importData}>Import validated records</button>
        </div>}
      </div>

      <div className="panel">
        <div className="filters">
          <input aria-label="Search students" placeholder="Search name, ID, email, branch…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select aria-label="Filter department" value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }}><option value="all">All departments</option>{departments.map((d) => <option key={d.id} value={d.code}>{d.code}</option>)}</select>
          <span className="muted">{total.toLocaleString()} students</span>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Year</th><th>Section</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{list.map((s) => <tr key={s.student_id}>
            <td>{s.student_id}</td><td>{s.name}</td><td>{s.email}</td><td>{s.dept}</td><td>{s.year}</td><td>{s.section}</td><td>{s.active ? 'Active' : 'Inactive'}</td>
            <td><div className="filters">
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => beginEdit(s)}>Edit</button>
              {s.active && <button className="btn btn-ghost btn-sm" type="button" onClick={() => resetPassword(s)} title="Generate new temporary password">Reset Password</button>}
              {s.active && <button className="btn btn-ghost btn-sm" type="button" onClick={() => deactivate(s)}>Deactivate</button>}
            </div></td>
          </tr>)}</tbody>
        </table></div>
        {loading && <p className="muted">Loading…</p>}
        <div className="filters" style={{ justifyContent: 'space-between', marginTop: 12 }}><span className="muted">Page {page} of {pages}</span><div className="filters"><button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </div>
      <CredentialModal data={credentialModalData} onClose={() => setCredentialModalData(null)} />
    </div>
  );
}
