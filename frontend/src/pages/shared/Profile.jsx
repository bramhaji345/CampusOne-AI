import { useState, useRef } from 'react';
import { Upload, Trash2, Camera, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const initial = user?.name?.charAt(0) || 'U';
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    mobile: user?.mobile || '',
    parent_phone: user?.parent_phone || '',
    photo: user?.photo || '',
  });

  const [previewPhoto, setPreviewPhoto] = useState(user?.photo || '');

  const toggleEdit = () => {
    if (!edit) {
      setForm({
        mobile: user?.mobile || '',
        parent_phone: user?.parent_phone || '',
        photo: user?.photo || '',
      });
      setPreviewPhoto(user?.photo || '');
    }
    setEdit((v) => !v);
  };

  // Optimize and process image selected from local storage or device gallery
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Please select an image file (PNG, JPG, WebP, GIF)');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      toast('Image exceeds 12MB limit. Please choose a smaller photo.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Standard avatar size: max 360x360 square to ensure lightweight (~25KB) high-quality payload
          const maxDim = 360;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Highly optimized JPEG at 0.80 quality
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.80);
          setForm((prev) => ({ ...prev, photo: optimizedDataUrl }));
          setPreviewPhoto(optimizedDataUrl);
          setIsProcessing(false);
          toast('Photo selected and optimized');
        } catch (err) {
          console.error('Canvas processing error:', err);
          setIsProcessing(false);
          toast('Could not optimize image. Please try a different photo format.');
        }
      };

      img.onerror = () => {
        setIsProcessing(false);
        toast('Unable to decode image file. Please use a PNG, JPG, or WebP photo.');
      };

      img.src = uploadEvent.target.result;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      toast('Error reading selected file');
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: '' }));
    setPreviewPhoto('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast('Photo removed');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        photo: form.photo,
        ...(user?.role === 'student' ? {
          mobile: form.mobile,
          parent_phone: form.parent_phone,
        } : {}),
        ...(user?.role === 'faculty' ? {
          mobile: form.mobile,
        } : {}),
      };

      const res = await api.patch('/profile', payload);
      if (res.data?.user) {
        setUser(res.data.user);
        try {
          localStorage.setItem('user_profile', JSON.stringify(res.data.user));
        } catch {}
      } else {
        const { data } = await api.get('/auth/me');
        setUser(data);
      }
      toast('Profile updated successfully');
      setEdit(false);
    } catch (err) {
      console.error('Save profile error:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update profile';
      toast(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-title">
        <h1>Profile</h1>
        <p>Campus identity. Academic fields are read-only.</p>
      </div>

      <div className="panel">
        <div className="profile-header">
          <div className="avatar" style={{ position: 'relative' }}>
            {previewPhoto || user?.photo ? (
              <img src={previewPhoto || user.photo} alt={user?.name || 'Profile'} />
            ) : (
              initial
            )}
            {edit && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile picture"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  border: 'none',
                  borderRadius: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  backdropFilter: 'blur(2px)',
                }}
              >
                <Camera size={26} strokeWidth={2.2} />
              </button>
            )}
          </div>
          <div>
            <h2>{user?.name}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            <span className="badge-pill badge-medical" style={{ marginTop: 8 }}>
              {user?.role}
            </span>
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
              <div className="info-item"><label>Mobile</label><p>{user.mobile || '—'}</p></div>
              <div className="info-item"><label>Parent name</label><p>{user.parent_name || '—'}</p></div>
              <div className="info-item"><label>Parent phone</label><p>{user.parent_phone || '—'}</p></div>
              <div className="info-item"><label>CGPA</label><p>{user.cgpa ?? '—'}</p></div>
            </>
          )}
          {user?.role === 'faculty' && (
            <>
              <div className="info-item"><label>Faculty ID</label><p>{user.faculty_id}</p></div>
              <div className="info-item"><label>Department</label><p>{user.dept}</p></div>
              <div className="info-item"><label>Designation</label><p>{user.designation}</p></div>
              <div className="info-item"><label>Mobile</label><p>{user.mobile || '—'}</p></div>
              <div className="info-item"><label>Subjects</label><p>{user.subjects || '—'}</p></div>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <div className="info-item"><label>Role</label><p>Campus Administrator</p></div>
              <div className="info-item"><label>Email</label><p>{user.email}</p></div>
              <div className="info-item"><label>Status</label><p>Active</p></div>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 18 }}
          onClick={toggleEdit}
        >
          {edit ? 'Cancel' : 'Edit profile'}
        </button>

        {edit && (
          <form onSubmit={save} style={{ marginTop: 20, maxWidth: 460 }}>
            {/* Hidden File Input for Local Storage / Gallery Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />

            {/* Profile Picture Upload Box */}
            <div
              className="form-group"
              style={{
                background: 'var(--bg-soft, #F5F4FC)',
                border: '1.5px dashed var(--border, #DCD8F0)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 16,
              }}
            >
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.86rem' }}>
                Profile Picture
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: 'var(--bg-elevated, #FFF)',
                    border: '1.5px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: 'var(--accent, #6366F1)',
                    flexShrink: 0,
                  }}
                >
                  {previewPhoto ? (
                    <img
                      src={previewPhoto}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    initial
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={isProcessing}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw size={14} className="spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Upload from Gallery / File
                        </>
                      )}
                    </button>

                    {previewPhoto && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={handleRemovePhoto}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.82rem',
                          color: 'var(--danger, #EF4444)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Choose a photo from your local storage or device gallery (JPG, PNG, WebP)
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile field (Student & Faculty) */}
            {user?.role !== 'admin' && (
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 4 }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="Enter contact number"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* Parent phone (Student only) */}
            {user?.role === 'student' && (
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 4 }}>
                  Parent Phone
                </label>
                <input
                  type="tel"
                  value={form.parent_phone}
                  onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                  placeholder="Enter parent's phone number"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving || isProcessing}
              style={{
                marginTop: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={2.4} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
