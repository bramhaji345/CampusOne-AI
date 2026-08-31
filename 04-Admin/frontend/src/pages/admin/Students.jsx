import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

export default function AdminStudents() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('all');
  const [form, setForm] = useState({
    name: '', email: '', student_id: '', dorm_no: '', course: 'B.Tech', year: 1, dept: 'CSE',
    parent_name: '', mobile: '', parent_phone: '', section: 'A',
  });
  const { toast } = useToast();

  const load = () => api.get('/admin/students').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/admin/students', form);
    toast('Student created (default password: Student@123)');
    load();
  };

  const filtered = useMemo(() => list.filter((s) => {
    const hay = `${s.name} ${s.student_id} ${s.email} ${s.dept}`.toLowerCase();
    const okQ = hay.includes(q.toLowerCase());
    const okD = dept === 'all' || s.dept === dept;
    return okQ && okD;
  }), [list, q, dept]);

  const depts = [...new Set(list.map((s) => s.dept))];

  return (
    <div>
      <div className="page-title"><h1>Student management</h1><p>Search, filter, and add student records</p></div>
      <div className="panel">
        <h3>Add student</h3>
        <form onSubmit={create} className="filters" style={{ alignItems: 'flex-end' }}>
          {['name', 'email', 'student_id', 'dorm_no', 'dept', 'section', 'mobile', 'parent_name', 'parent_phone'].map((k) => (
            <div className="form-group" key={k} style={{ minWidth: 140 }}>
              <label>{k.replace('_', ' ')}</label>
              <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={['name', 'email', 'student_id'].includes(k)} />
            </div>
          ))}
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
      </div>
      <div className="panel">
        <div className="filters">
          <input placeholder="Search name, ID, email…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="all">All departments</option>
            {depts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Year</th><th>Dorm</th><th>CGPA</th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.student_id}>
                  <td>{s.student_id}</td><td>{s.name}</td><td>{s.email}</td><td>{s.dept}</td><td>{s.year}</td><td>{s.dorm_no}</td><td>{s.cgpa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
