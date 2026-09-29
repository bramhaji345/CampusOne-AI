import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, BarChart3, Bell, BookOpenCheck, BrainCircuit, CalendarDays, Check, ClipboardCheck, GraduationCap, Menu, Network, ShieldCheck, Sparkles, UsersRound, X } from 'lucide-react';
import Logo from '../components/Logo';

const features = [
  { icon: <GraduationCap />, title: 'Student Management', text: 'Access academic information, attendance, results, schedules, and campus services from one place.' },
  { icon: <UsersRound />, title: 'Faculty Management', text: 'Manage student information, attendance, academic activities, communication, and course-related tasks.' },
  { icon: <BrainCircuit />, title: 'AI-Powered Intelligence', text: 'Use AI-powered analysis and predictions to surface meaningful academic insights and assistance.' },
  { icon: <ClipboardCheck />, title: 'Attendance Tracking', text: 'Monitor attendance records and understand student attendance patterns across subjects.' },
  { icon: <BarChart3 />, title: 'Results & CGPA Analytics', text: 'Review academic performance, results, CGPA trends, and useful performance insights.' },
  { icon: <Bell />, title: 'Smart Notifications', text: 'Receive important academic and campus updates through a centralized notification system.' },
  { icon: <ShieldCheck />, title: 'Outpass Management', text: 'Submit, review, approve, and track student outpass requests through a structured workflow.' },
  { icon: <Network />, title: 'Centralized Campus Platform', text: 'Bring campus activities and academic information together through one unified platform.' },
];

const roles = [
  { icon: <GraduationCap />, title: 'Student', description: 'A clearer view of your campus life and academic progress.', points: ['View attendance and results', 'Track CGPA and schedules', 'Submit outpass requests', 'Get notifications and AI insights'] },
  { icon: <BookOpenCheck />, title: 'Faculty', description: 'The right tools to keep teaching and academic work moving.', points: ['Manage class attendance', 'Monitor student performance', 'Access course information', 'Share updates and review insights'] },
  { icon: <UsersRound />, title: 'Admin', description: 'A connected view of the people and services across campus.', points: ['Manage users and academic data', 'Monitor campus activities', 'Coordinate notifications', 'Maintain centralized records'] },
];

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.unobserve(node); }
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`} style={{ '--reveal-delay': `${delay}ms` }}>{children}</div>;
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 8); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, []);
  const closeMenu = () => setMenuOpen(false);
  const steps = ['Login', 'Access campus data', 'Perform campus activities', 'AI analysis', 'Get insights', 'Make informed decisions'];

  return <div className="landing landing-v2 campus-landing">
    <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}><Logo /><button className="landing-menu-btn" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button><div className={`nav-links ${menuOpen ? 'open' : ''}`}><a href="#platform" onClick={closeMenu}>Platform</a><a href="#features" onClick={closeMenu}>Features</a><a href="#intelligence" onClick={closeMenu}>AI Intelligence</a><a href="#roles" onClick={closeMenu}>For campus</a><Link to="/login" className="btn btn-outline btn-sm" onClick={closeMenu}>Sign in</Link></div></nav>
    <main>
      <section className="campus-hero" id="platform"><div className="hero-atmosphere" aria-hidden="true"><span className="hero-beam beam-a" /><span className="hero-beam beam-b" /><span className="hero-glow glow-a" /><span className="hero-glow glow-b" /><span className="network-web" /><i className="network-node node-a" /><i className="network-node node-b" /><i className="network-node node-c" /><i className="network-node node-d" /><i className="network-node node-e" /></div>
        <div className="campus-hero-inner">
          <div className="hero-feature-floats hero-feature-floats-left" aria-label="Campus features"><div className="hero-float-card"><span className="hero-float-icon"><CalendarDays size={17} /></span><span><strong>Smart schedules</strong><small>Classes in sync</small></span></div><div className="hero-float-card"><span className="hero-float-icon"><BarChart3 size={17} /></span><span><strong>Live insights</strong><small>Progress at a glance</small></span></div></div>
          <Reveal className="campus-hero-copy"><div className="campus-ai-badge"><span><Sparkles size={14} /></span> AI-Powered Campus Intelligence</div><p className="campus-eyebrow">A more connected university</p><h1>CampusOne<span>AI</span></h1><h2>An Intelligent Campus Management Platform</h2><p className="campus-hero-description">Connect students, faculty, and administrators through one intelligent platform for academics, attendance, results, communication, and smarter campus management.</p><div className="hero-actions"><a href="#features" className="btn btn-outline">Explore CampusOneAI <ArrowDown size={16} /></a><Link to="/login" className="btn btn-primary">Get Started <ArrowRight size={16} /></Link></div><div className="hero-caption"><span className="online-indicator" />One intelligent system for your entire campus</div></Reveal>
          <div className="hero-feature-floats hero-feature-floats-right" aria-label="More campus features"><div className="hero-float-card"><span className="hero-float-icon"><UsersRound size={17} /></span><span><strong>One campus</strong><small>Every role connected</small></span></div><div className="hero-float-card"><span className="hero-float-icon"><BrainCircuit size={17} /></span><span><strong>AI assistance</strong><small>Guidance that helps</small></span></div></div>
        </div><a className="hero-scroll-cue" href="#features">Explore the platform <ArrowDown size={14} /></a>
      </section>

      <section className="campus-intro"><Reveal><p>One intelligent platform, bringing the everyday work of a university into focus.</p><div className="campus-marquee" aria-label="Campus areas"><div className="campus-marquee-track"><div className="campus-marquee-group"><span>ACADEMICS</span><span>ATTENDANCE</span><span>COMMUNICATION</span><span>CAMPUS SERVICES</span><span>STUDENT SUCCESS</span></div><div className="campus-marquee-group" aria-hidden="true"><span>ACADEMICS</span><span>ATTENDANCE</span><span>COMMUNICATION</span><span>CAMPUS SERVICES</span><span>STUDENT SUCCESS</span></div></div></div></Reveal></section>


      <section className="campus-section campus-feature-section" id="features"><Reveal><div className="campus-section-heading"><span className="section-kicker">One campus. Connected.</span><h2>Everything that keeps campus moving.</h2><p>Purpose-built tools give each member of your university a clearer way to stay informed and get things done.</p></div></Reveal><div className="campus-feature-grid">{features.map((feature, index) => <Reveal key={feature.title} delay={(index % 4) * 70} className="campus-feature-reveal"><article className="campus-feature-card"><div className="feature-icon-wrap">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.text}</p><span className="feature-index">0{index + 1}</span></article></Reveal>)}</div></section>

      <section className="campus-ai-section" id="intelligence"><div className="ai-section-aura" /><Reveal className="ai-section-inner"><div className="ai-section-copy"><span className="section-kicker"><BrainCircuit size={15} /> Campus intelligence</span><h2>Smarter Campus Decisions with AI</h2><p>CampusOneAI combines campus data with intelligent analysis to help students and faculty understand academic performance, identify trends, and make better-informed decisions.</p><div className="ai-question"><Sparkles size={15} /><span>Turn campus data into a clearer next step.</span></div></div><div className="ai-flow" aria-label="Student data flows through CampusOneAI analysis to actionable information"><div className="ai-flow-line" />{['Student Data', 'CampusOneAI', 'AI Analysis', 'Insights & Predictions', 'Actionable Information'].map((step, index) => <div className={`ai-flow-step flow-step-${index + 1}`} key={step}><span className="flow-node">{index === 1 ? <BrainCircuit size={16} /> : index === 0 ? <UsersRound size={15} /> : index === 4 ? <Check size={15} /> : <Sparkles size={14} />}</span><span>{step}</span>{index < 4 && <ArrowDown className="flow-arrow" size={14} />}</div>)}</div></Reveal></section>

      <section className="campus-section campus-roles-section" id="roles"><Reveal><div className="campus-section-heading"><span className="section-kicker">Designed around your role</span><h2>One Platform. Multiple Campus Roles.</h2><p>Each person gets the tools and information that help them move campus work forward.</p></div></Reveal><div className="campus-role-grid">{roles.map((role, index) => <Reveal key={role.title} delay={index * 100}><article className="campus-role-card"><div className="role-icon">{role.icon}</div><span className="role-label">0{index + 1} / {role.title}</span><h3>{role.title}</h3><p>{role.description}</p><ul>{role.points.map((point) => <li key={point}><Check size={14} />{point}</li>)}</ul><Link to="/login" className="role-link">Enter as {role.title.toLowerCase()} <ArrowRight size={15} /></Link></article></Reveal>)}</div></section>

      <section className="campus-workflow"><Reveal><div className="workflow-heading"><span className="section-kicker">From campus activity to clarity</span><h2>How CampusOneAI works</h2></div><div className="workflow-track">{steps.map((step, index) => <div className="workflow-step" key={step}><span className="workflow-number">0{index + 1}</span><strong>{step}</strong>{index < steps.length - 1 && <ArrowRight className="workflow-arrow" size={16} />}</div>)}</div></Reveal></section>

      <section className="campus-cta"><div className="cta-aura" /><Reveal><span className="section-kicker">A smarter way to move forward</span><h2>Experience a Smarter Campus</h2><p>CampusOneAI brings academics, communication, campus services, and intelligent insights together in one platform.</p><div className="hero-actions"><Link to="/login" className="btn btn-primary">Get Started <ArrowRight size={16} /></Link><a href="#platform" className="btn btn-outline">Explore Platform <ArrowDown size={15} /></a></div></Reveal></section>
    </main><footer className="landing-footer v2-footer campus-footer"><Logo /><p>© {new Date().getFullYear()} CampusOne AI. Built for connected campuses.</p><Link to="/login">Campus portal access</Link></footer>
  </div>;
}
