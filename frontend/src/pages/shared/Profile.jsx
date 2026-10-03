import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const initial = user?.name?.charAt(0) || 'U';
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    mobile: user?.mobile || '',
    parent_phone: user?.parent_phone || '',
    photo: user?.photo || '',
  });

  const save = async (e) => {
    e.preventDefault();
    await api.patch('/profile', form);
    const { data } = await api.get('/auth/me');
    setUser(data);
    toast('Profile updated');
    setEdit(false);
  };

  return (
    <div>
      <div className="page-title">
        <h1>Profile</h1>
        <p>Campus identity. Academic fields are read-only.</p>
      </div>
      <div className="panel">
        <div className="profile-header">
          <div className="avatar">{user?.photo ? <img src={user.photo} alt="" /> : initial}</div>
          <div>
            <h2>{user?.name}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            <span className="badge-pill badge-medical" style={{ marginTop: 8 }}>{user?.role}</span>
          </div>
        </div>
        <div className="info-grid">
          {user?.role === 'student' && (
            <>
              <div className="info-item"><label>Student ID</label><p>{user.student_id}</p></div>
              <div className="info-item"><label>Course</label><p>{user.course}</p></div>
              <div className="info-item"><label>Year / Semester</label><p>Year {user.year} ({user.cohort || `E${user.year}`}) · Semester {user.semester || 1}</p></div>
              <div className="info-item"><label>Department</label><p>{user.dept}</p></div>
              <div className="info-item"><label>Section</label><p>{user.section}</p></div>
              <div className="info-item"><label>Dorm / Hostel</label><p>{user.dorm_no}</p></div>
              <div className="info-item"><label>Mobile</label><p>{user.mobile}</p></div>
              <div className="info-item"><label>Parent name</label><p>{user.parent_name}</p></div>
              <div className="info-item"><label>Parent phone</label><p>{user.parent_phone}</p></div>
              <div className="info-item"><label>CGPA</label><p>{user.cgpa}</p></div>
            </>
          )}
          {user?.role === 'faculty' && (
            <>
              <div className="info-item"><label>Faculty ID</label><p>{user.faculty_id}</p></div>
              <div className="info-item"><label>Department</label><p>{user.dept}</p></div>
              <div className="info-item"><label>Designation</label><p>{user.designation}</p></div>
              <div className="info-item"><label>Mobile</label><p>{user.mobile}</p></div>
              <div className="info-item"><label>Subjects</label><p>{user.subjects}</p></div>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <div className="info-item"><label>Role</label><p>Campus Administrator</p></div>
              <div className="info-item"><label>Email</label><p>{user.email}</p></div>
            </>
          )}
        </div>
        {user?.role !== 'admin' && (
          <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => setEdit((v) => !v)}>
            {edit ? 'Cancel' : 'Edit profile'}
          </button>
        )}
        {edit && (
          <form onSubmit={save} style={{ marginTop: 16, maxWidth: 420 }}>
            <div className="form-group"><label>Mobile</label><input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
            {user.role === 'student' && (
              <div className="form-group"><label>Parent phone</label><input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} /></div>
            )}
            <div className="form-group"><label>Photo URL</label><input value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} placeholder="https://…" /></div>
            <button className="btn btn-primary" type="submit">Save permitted fields</button>
          </form>
        )}
      </div>
    </div>
  );
}
