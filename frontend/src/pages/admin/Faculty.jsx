import { useEffect, useState } from 'react';
import api from '../../api';

export default function AdminFaculty() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', faculty_id: '', dept: 'CSE', designation: 'Assistant Professor', mobile: '', subjects: '',
  });
  const [msg, setMsg] = useState('');

  const load = () => api.get('/admin/faculty').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/admin/faculty', form);
    setMsg('Faculty created (default password: Faculty@123)');
    load();
  };

  return (
    <div>
      <div className="page-title"><h1>Faculty Management</h1><p>View and add faculty</p></div>
      {msg && <div className="success-msg">{msg}</div>}
      <div className="panel">
        <h3>Add Faculty</h3>
        <form onSubmit={create} className="filters" style={{ alignItems: 'flex-end' }}>
          {Object.keys(form).map((k) => (
            <div className="form-group" key={k} style={{ minWidth: 150 }}>
              <label>{k.replace('_', ' ')}</label>
              <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={['name', 'email', 'faculty_id'].includes(k)} />
            </div>
          ))}
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Designation</th><th>Subjects</th></tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.faculty_id}>
                  <td>{f.faculty_id}</td>
                  <td>{f.name}</td>
                  <td>{f.email}</td>
                  <td>{f.dept}</td>
                  <td>{f.designation}</td>
                  <td>{f.subjects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
