import { GraduationCap, Sparkles } from 'lucide-react';

export default function Logo({ size = 40, withText = true }) {
  return (
    <div className="logo">
      <div className="logo-mark" style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}>
        <GraduationCap size={Math.round(size * 0.54)} strokeWidth={2.2} aria-hidden="true" />
        <Sparkles className="logo-spark" size={Math.round(size * 0.28)} strokeWidth={2.5} aria-hidden="true" />
      </div>
      {withText && (
        <div className="logo-text">
          <strong>CampusOne</strong>
          <span>AI</span>
        </div>
      )}
    </div>
  );
}
