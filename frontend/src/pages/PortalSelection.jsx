import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Users,
  Shield,
  FileText,
  CalendarCheck,
  CalendarDays,
  TrendingUp,
  Bell,
  CheckSquare,
  UploadCloud,
  UserCheck,
  BookOpen,
  Settings,
  BarChart3,
  Database,
  Sparkles,
} from 'lucide-react';
import Logo from '../components/Logo';
import cardStudent from '../assets/portals/card-student-hi.png';
import cardFaculty from '../assets/portals/card-faculty-hi.png';
import cardAdmin from '../assets/portals/card-admin-hi.png';

const portals = [
  {
    role: 'student',
    title: 'Student Portal',
    cardImage: cardStudent,
    buttonText: 'Enter Student Portal',
    path: '/login?role=student',
    accentClass: 'portal-accent-student',
    badgeIcon: <GraduationCap size={22} strokeWidth={2.4} />,
    features: [
      { label: 'View Results', icon: <FileText size={12} strokeWidth={2.4} /> },
      { label: 'Check Attendance', icon: <CalendarCheck size={12} strokeWidth={2.4} /> },
      { label: 'View Timetable', icon: <CalendarDays size={12} strokeWidth={2.4} /> },
      { label: 'Track CGPA', icon: <TrendingUp size={12} strokeWidth={2.4} /> },
      { label: 'Get Notifications', icon: <Bell size={12} strokeWidth={2.4} /> },
    ],
  },
  {
    role: 'faculty',
    title: 'Faculty Portal',
    cardImage: cardFaculty,
    buttonText: 'Enter Faculty Portal',
    path: '/login?role=faculty',
    accentClass: 'portal-accent-faculty',
    badgeIcon: <Users size={22} strokeWidth={2.4} />,
    features: [
      { label: 'Mark Attendance', icon: <CheckSquare size={12} strokeWidth={2.4} /> },
      { label: 'Upload Results', icon: <UploadCloud size={12} strokeWidth={2.4} /> },
      { label: 'Manage Timetable', icon: <CalendarDays size={12} strokeWidth={2.4} /> },
      { label: 'Manage Students', icon: <Users size={12} strokeWidth={2.4} /> },
      { label: 'View Students', icon: <UserCheck size={12} strokeWidth={2.4} /> },
    ],
  },
  {
    role: 'admin',
    title: 'Admin Portal',
    cardImage: cardAdmin,
    buttonText: 'Enter Admin Portal',
    path: '/login?role=admin',
    accentClass: 'portal-accent-admin',
    badgeIcon: <Shield size={22} strokeWidth={2.4} />,
    features: [
      { label: 'Manage Users', icon: <Users size={12} strokeWidth={2.4} /> },
      { label: 'Manage Courses', icon: <BookOpen size={12} strokeWidth={2.4} /> },
      { label: 'System Settings', icon: <Settings size={12} strokeWidth={2.4} /> },
      { label: 'Reports & Analytics', icon: <BarChart3 size={12} strokeWidth={2.4} /> },
      { label: 'Manage Data & Backups', icon: <Database size={12} strokeWidth={2.4} /> },
    ],
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
    prefetchRole('student');

    // Lock body and html overflow on desktop to ensure page remains strictly unscrollable
    const handleResize = () => {
      if (window.innerWidth > 820) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleSelect = (portalPath, role) => {
    prefetchRole(role);
    navigate(portalPath);
  };

  return (
    <div className="portal-select-page unscrollable-page">
      {/* Top Brand Bar: Logo totally on Left, Back to Home totally on Right */}
      <header className="portal-select-nav">
        <Link to="/" className="portal-nav-brand" title="CampusOne-AI Home">
          <Logo size={40} />
        </Link>
        <Link to="/" className="portal-nav-back">
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Content Area: Fits perfectly in single screen without scrolling */}
      <main className="portal-select-main">
        {/* Welcome Hero Banner */}
        <section className="portal-hero-banner">
          <div className="portal-hero-kicker">
            <Sparkles size={13} strokeWidth={2.4} className="portal-kicker-sparkle" />
            <span>AI-POWERED CAMPUS MANAGEMENT</span>
          </div>
          <h1 className="portal-hero-title">
            Welcome to <span className="brand-gradient-text">CampusOne-AI</span>
          </h1>
          <p className="portal-hero-subtitle-main">
            Choose your portal to continue
          </p>
          <p className="portal-hero-subtitle-sub">
            Access the tools and insights designed for your role.
          </p>
        </section>

        {/* 3 Portal Selection Cards (Present Boxes with character art, sharp vectors & gradient buttons) */}
        <div
          className="portal-selection-grid"
          role="region"
          aria-label="Campus Portal Choices"
        >
          {portals.map((p, index) => (
            <div
              key={p.role}
              className={`portal-card-item portal-delay-${index}`}
              onMouseEnter={() => prefetchRole(p.role)}
            >
              <Link
                to={p.path}
                className={`portal-selection-card ${p.accentClass}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(p.path, p.role);
                }}
                aria-label={`Enter ${p.title}`}
              >
                {/* Visual Card Image Wrapper */}
                <div className="portal-card-visual-wrapper">
                  <img
                    src={p.cardImage}
                    alt=""
                    className="portal-card-img"
                    loading="eager"
                  />

                  {/* Top Badge & Portal Title (Vector SVG & Sharp Typography) */}
                  <div className="portal-card-header-overlay">
                    <div className={`portal-top-badge portal-top-badge-${p.role}`}>
                      {p.badgeIcon}
                    </div>
                    <h2 className={`portal-card-title portal-card-title-${p.role}`}>
                      {p.title}
                    </h2>
                  </div>

                  {/* Floating Feature Card with Vector Icons */}
                  <div className={`portal-feature-floating-box portal-feature-floating-box-${p.role}`}>
                    {p.features.map((feat) => (
                      <div key={feat.label} className="portal-feature-row">
                        <span className={`portal-feat-icon-box portal-feat-icon-box-${p.role}`}>
                          {feat.icon}
                        </span>
                        <span className="portal-feat-text">{feat.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Button Overlay */}
                  <div className={`portal-btn-overlay portal-btn-overlay-${p.role}`}>
                    <span className="portal-btn-label">{p.buttonText}</span>
                    <ArrowRight size={16} strokeWidth={2.4} className="portal-btn-arrow" />
                  </div>
                </div>

                {/* Accessible Screen Reader List */}
                <span className="sr-only">
                  {p.title}. Features: {p.features.map((f) => f.label).join(', ')}
                </span>
              </Link>
            </div>
          ))}
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
