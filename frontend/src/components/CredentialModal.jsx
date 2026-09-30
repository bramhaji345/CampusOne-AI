import { useState } from 'react';

export default function CredentialModal({ data, onClose }) {
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);

  if (!data) return null;

  const isStudent = data.role === 'student' || data.student_id != null;
  const idLabel = isStudent ? 'Student ID' : 'Faculty ID';
  const idValue = data.student_id || data.faculty_id || data.id || '';
  const portalLabel = isStudent ? 'Student Portal' : 'Faculty Portal';

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(data.temporaryPassword || '');
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    } catch {
      // clipboard fallback
      const textArea = document.createElement('textarea');
      textArea.value = data.temporaryPassword || '';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const copyLoginDetails = async () => {
    const text = `CampusOne-AI Login Details\n\nName: ${data.name || ''}\n${idLabel}: ${idValue}\nEmail: ${data.email || ''}\nTemporary Password: ${data.temporaryPassword || ''}\n\nPortal: ${portalLabel}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDetails(true);
      setTimeout(() => setCopiedDetails(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedDetails(true);
      setTimeout(() => setCopiedDetails(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ zIndex: 1000 }}>
      <div
        className="modal"
        style={{
          maxWidth: 480,
          width: '92%',
          padding: '24px',
          borderRadius: '12px',
          background: 'var(--panel-bg, #1e293b)',
          color: 'var(--text, #f8fafc)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>🔑</div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            {data.title || (data.isReset ? 'Password Reset Successfully' : 'Account Created Successfully')}
          </h3>
        </div>

        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 16,
            fontSize: '0.9rem',
            lineHeight: '1.7',
          }}
        >
          <div><strong>Name:</strong> {data.name}</div>
          <div><strong>{idLabel}:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary, #38bdf8)' }}>{idValue}</span></div>
          <div><strong>Email:</strong> {data.email}</div>
          <div><strong>Portal:</strong> {portalLabel}</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Temporary Password:
          </label>
          <div
            style={{
              background: 'var(--input-bg, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: 8,
              padding: '12px 14px',
              fontFamily: 'monospace',
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#38bdf8',
              textAlign: 'center',
              userSelect: 'all',
              wordBreak: 'break-all',
            }}
          >
            {data.temporaryPassword}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1, minWidth: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={copyPassword}
          >
            {copiedPass ? '✓ Copied Password' : '📋 Copy Password'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, minWidth: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={copyLoginDetails}
          >
            {copiedDetails ? '✓ Copied Details' : '📄 Copy Login Details'}
          </button>
        </div>

        <div
          style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#facc15',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <span><strong>Save this temporary password.</strong> It will not be shown again.</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ minWidth: 100 }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
