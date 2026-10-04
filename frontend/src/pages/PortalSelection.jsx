import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Logo from '../components/Logo';

const portals = [
  {
    role: 'student',
    title: 'Student Portal',
    tag: '01 / Academic',
    icon: GraduationCap,
    accentClass: 'accent-student',
    description:
      'View results, attendance, timetable, assignments and AI-powered academic insights.',
    highlights: ['Results & SGPA', 'Attendance', 'AI Insights'],
    path: '/login?role=student',
  },
  {
    role: 'faculty',
    title: 'Faculty Portal',
    tag: '02 / Instruction',
    icon: BookOpenCheck,
    accentClass: 'accent-faculty',
    description:
      'Manage classes, attendance, results, assignments and student information.',
    highlights: ['Class Attendance', 'Marks & Grades', 'Student Records'],
    path: '/login?role=faculty',
  },
  {
    role: 'admin',
    title: 'Admin Portal',
    tag: '03 / Governance',
    icon: ShieldCheck,
    accentClass: 'accent-admin',
    description:
      'Manage students, faculty, academics, branches and institutional data.',
    highlights: ['User Management', 'Academics', 'Audit Logs'],
    path: '/login?role=admin',
  },
];

export default function PortalSelection() {
  const navigate = useNavigate();

  // Opportunistic prefetching for fast subsequent navigation
  const prefetchRole = (role) => {
    try {
      if (role === 'student') import('./student/Dashboard');
      else if (role === 'faculty') import('./faculty/Dashboard');
      else if (role === 'admin') import('./admin/Dashboard');
    } catch {}
  };

  useEffect(() => {
    // Preload student chunk by default
    prefetchRole('student');
  }, []);

  const handleSelect = (portalPath, role) => {
    prefetchRole(role);
    navigate(portalPath);
  };

  return (
    <div className="portal-select-page">
      {/* Top Brand Bar */}
      <header className="portal-select-nav">
        <Link to="/" className="portal-nav-brand" title="Return to Landing Page">
          <Logo size={40} />
        </Link>
        <Link to="/" className="portal-nav-back">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Content Container */}
      <main className="portal-select-container">
        {/* Header Block */}
        <div className="portal-select-header">
          <div className="portal-kicker">
            <Sparkles size={14} />
            <span>AI-Powered Campus Management</span>
          </div>
          <h1 className="portal-title">
            Welcome to <span className="brand-gradient-text">CampusOne-AI</span>
          </h1>
          <p className="portal-subtitle">Choose your portal to continue</p>
          <p className="portal-supporting-text">
            Access the tools and insights designed for your role.
          </p>
        </div>

        {/* 3 Portal Selection Cards (Horizontal on Desktop) */}
        <div
          className="portal-cards-grid"
          role="region"
          aria-label="Campus Portal Choices"
        >
          {portals.map((p, index) => {
            const Icon = p.icon;
            return (
              <div
                key={p.role}
                className={`portal-card-wrapper portal-delay-${index}`}
                onMouseEnter={() => prefetchRole(p.role)}
              >
                <Link
                  to={p.path}
                  className={`portal-card ${p.accentClass}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(p.path, p.role);
                  }}
                  aria-label={`Enter ${p.title}`}
                >
                  <div className="portal-card-top">
                    <span className="portal-card-tag">{p.tag}</span>
                    <div className="portal-card-icon-wrap" aria-hidden="true">
                      <Icon size={26} strokeWidth={2.2} />
                    </div>
                  </div>

                  <div className="portal-card-body">
                    <h2 className="portal-card-title">{p.title}</h2>
                    <p className="portal-card-description">{p.description}</p>

                    <div className="portal-card-chips" aria-hidden="true">
                      {p.highlights.map((h) => (
                        <span key={h} className="portal-chip">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="portal-card-cta">
                    <span className="cta-label">Continue</span>
                    <span className="cta-arrow" aria-hidden="true">
                      <ArrowRight size={17} />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer Support Note */}
        <footer className="portal-select-footer">
          <p>
            Need help signing in?{' '}
            <Link to="/forgot-password" className="portal-link-secondary">
              Forgot your credentials?
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
