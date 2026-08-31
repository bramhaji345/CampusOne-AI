export default function Logo({ size = 40, withText = true }) {
  return (
    <div className="logo">
      <div className="logo-mark" style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}>
        <img src="/logo.jpg" alt="CampusOne AI" />
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
