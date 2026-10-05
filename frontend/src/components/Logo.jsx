import logoGold from '../assets/logo-gold.png';

export default function Logo({ size = 40, withText = true, className = '' }) {
  return (
    <div className={`logo ${className}`.trim()}>
      <div
        className="logo-mark app-gold-logo"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img
          src={logoGold}
          alt="CampusOne AI"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
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
