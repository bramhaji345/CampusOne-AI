import { Inbox } from 'lucide-react';

export function EmptyState({ title, hint, action }) {
  return (
    <div className="empty">
      <Inbox size={28} style={{ marginBottom: 8, opacity: 0.6 }} />
      <p><strong>{title}</strong></p>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  );
}

export function SkeletonGrid({ n = 4 }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: n }).map((_, i) => (
        <div className="stat-card" key={i}>
          <div className="skeleton" style={{ width: '40%', marginBottom: 12 }} />
          <div className="skeleton" style={{ width: '70%', height: 22 }} />
        </div>
      ))}
    </div>
  );
}

export function CountUp({ value, suffix = '' }) {
  return <span>{value ?? '—'}{suffix}</span>;
}
