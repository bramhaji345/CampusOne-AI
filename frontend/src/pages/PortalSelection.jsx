import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
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
} from 'lucide-react';
import Logo from '../components/Logo';
import personStudent from '../assets/portals/person-student.png';
import personFaculty from '../assets/portals/person-faculty.png';
import personAdmin from '../assets/portals/person-admin.png';

const portals = [
  {
    role: 'student',
    title: 'Student Portal',
    description: 'Access your academic resources and track your progress',
    personImage: personStudent,
    buttonText: 'Enter Student Portal',
    path: '/login?role=student',
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
    description: 'Manage your teaching activities efficiently',
    personImage: personFaculty,
    buttonText: 'Enter Faculty Portal',
    path: '/login?role=faculty',
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
    description: 'Manage the entire system with complete control',
    personImage: personAdmin,
    buttonText: 'Enter Admin Portal',
    path: '/login?role=admin',
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

    const handleResize = () => {
      if (window.innerWidth > 960) {
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
      {/* Top Brand Bar */}
      <header className="portal-select-nav">
        <Link to="/" className="portal-nav-brand" title="CampusOne-AI Home">
          <Logo size={40} />
        </Link>
        <Link to="/" className="portal-nav-back">
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="portal-select-main">
        {/* Welcome Hero Banner: Matching exact reference image typography */}
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

        {/* 3 Portal Selection Cards: Crisp HTML, Vector Text, Side-by-Side Photo & Features */}
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
              <div
                className={`portal-selection-card portal-card-${p.role}`}
                onClick={() => handleSelect(p.path, p.role)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(p.path, p.role);
                  }
                }}
                aria-label={`Enter ${p.title}`}
              >
                {/* Header: Badge + Title + Description */}
                <div className="portal-card-header">
                  <div className={`portal-top-badge portal-top-badge-${p.role}`}>
                    {p.badgeIcon}
                  </div>
                  <div className="portal-card-header-text">
                    <h2 className={`portal-card-title portal-card-title-${p.role}`}>
                      {p.title}
                    </h2>
                    <p className={`portal-card-desc portal-card-desc-${p.role}`}>
                      {p.description}
                    </p>
                  </div>
                </div>

                {/* Body: Realistic Photo on Left + Features Box on Right */}
                <div className="portal-card-body">
                  <div className="portal-card-photo-box">
                    <img
                      src={p.personImage}
                      alt={`${p.title} Photograph`}
                      className="portal-card-photo"
                      loading="eager"
                      decoding="async"
                      width={534}
                      height={546}
                    />
                  </div>

                  <div className={`portal-card-features-box portal-card-features-${p.role}`}>
                    {p.features.map((feat) => (
                      <div key={feat.label} className="portal-feature-row">
                        <span className={`portal-feat-icon-box portal-feat-icon-box-${p.role}`}>
                          {feat.icon}
                        </span>
                        <span className="portal-feat-text">{feat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Interactive Action Button */}
                <div className="portal-card-footer">
                  <button
                    type="button"
                    className={`portal-interactive-btn portal-btn-${p.role}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(p.path, p.role);
                    }}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <span className="portal-btn-label">{p.buttonText}</span>
                    <ArrowRight size={16} strokeWidth={2.4} className="portal-btn-arrow" />
                  </button>
                </div>
              </div>
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
