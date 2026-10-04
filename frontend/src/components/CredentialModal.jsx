import { useState } from 'react';
import { AlertTriangle, Check, Copy, KeyRound, UserCheck, X } from 'lucide-react';

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
    <div className="credential-modal-backdrop" role="dialog" aria-modal="true">
      <div className="credential-modal-box">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -10 }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: 6, borderRadius: 8, display: 'inline-flex', color: 'var(--text-muted)' }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="credential-header">
          <div className="credential-icon-badge">
            <KeyRound size={26} />
          </div>
          <h3>
            {data.title || (data.isReset ? 'Password Reset Successfully' : 'Account Created Successfully')}
          </h3>
          <p>
            {data.isReset ? 'A new temporary password has been generated for this account.' : 'The account has been created with initial credentials below.'}
          </p>
        </div>

        <div className="credential-info-card">
          <div className="info-row">
            <span className="info-label">Full Name</span>
            <span className="info-value">{data.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{idLabel}</span>
            <span className="id-badge">{idValue}</span>
          </div>
          <div className="info-row">
            <span className="info-label">College Email</span>
            <span className="info-value">{data.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Assigned Portal</span>
            <span className="info-value">{portalLabel}</span>
          </div>
        </div>

        <div className="credential-pass-section">
          <div className="credential-pass-label">
            <span>Temporary Password</span>
            <span style={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 500, color: 'var(--text-muted)' }}>
              Click box to copy
            </span>
          </div>
          <div
            className="credential-pass-box"
            onClick={copyPassword}
            style={{ cursor: 'pointer' }}
            title="Click to copy password"
          >
            <span className="credential-pass-code">{data.temporaryPassword}</span>
            <span className="credential-pass-hint">
              {copiedPass ? '✓ Copied to clipboard!' : 'Click box to copy password'}
            </span>
          </div>
        </div>

        <div className="credential-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={copyPassword}
          >
            {copiedPass ? <Check size={16} /> : <Copy size={16} />}
            {copiedPass ? 'Password Copied' : 'Copy Password'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={copyLoginDetails}
          >
            {copiedDetails ? <Check size={16} /> : <UserCheck size={16} />}
            {copiedDetails ? 'Details Copied' : 'Copy All Details'}
          </button>
        </div>

        <div className="credential-warning">
          <AlertTriangle size={20} style={{ flexShrink: 0, color: '#d97706' }} />
          <div>
            <strong>Save this temporary password.</strong> The user must use this to sign in and will be prompted to choose a permanent password.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ minWidth: 100 }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
