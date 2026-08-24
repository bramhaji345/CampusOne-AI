import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, BarChart3, Bell, Brain, Calendar, ClipboardCheck, FileText,
  GraduationCap, QrCode, Shield, Sparkles, Users, Zap,
} from 'lucide-react';
import Logo from '../components/Logo';

const features = [
  { icon: <Brain size={20} />, title: 'AI Academic Insights', desc: 'CGPA trends, attendance risk alerts, and recommendations drawn from live campus data.' },
  { icon: <ClipboardCheck size={20} />, title: 'Live Attendance', desc: 'Faculty mark today only — no backdating. Students see subject-wise percentages immediately.' },
  { icon: <BarChart3 size={20} />, title: 'Results & Reports', desc: 'E1–E4 with Sem / Mid filters, compact or detailed views, plus download and print.' },
  { icon: <QrCode size={20} />, title: 'Smart Outpasses', desc: 'Priority review, digital QR at the gate, and a secure scanner for campus security.' },
  { icon: <FileText size={20} />, title: 'Assignments Hub', desc: 'Faculty publish work; students submit, replace before deadline, and track status.' },
  { icon: <Bell size={20} />, title: 'Campus Notifications', desc: 'Exams, results, and notices reach the right portal with unread counts and priority.' },
  { icon: <Calendar size={20} />, title: 'Personalized Timetable', desc: 'Weekly schedules with current and next class highlighting for students and faculty.' },
  { icon: <Award size={20} />, title: 'Certificate Requests', desc: 'Bonafide and other certificates requested by students, approved by administration.' },
];

const why = [
  ['One unified campus platform', 'Academics, attendance, and campus ops in a single login.'],
  ['Real-time information', 'Marks, attendance, and outpasses update as soon as they are confirmed.'],
  ['AI-powered insights', 'Trends and risk flags explained in plain language.'],
  ['Faster communication', 'Role-based notices instead of scattered emails and posters.'],
  ['Digital academic management', 'Paperless results, assignments, and certificates.'],
  ['Secure role-based access', 'No public signup — institutional credentials only.'],
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing">
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <Logo />
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#ai">AI</a>
          <a href="#portals">Portals</a>
          <a href="#about">About</a>
          <a href="#help">Help</a>
          <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
          <Link to="/login" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-grid" />
        <div className="hero-stage">
          <div className="hero-inner" style={{ textAlign: 'left', margin: 0 }}>
            <div className="kicker"><Sparkles size={14} /> CampusOne AI — One Smart Platform for Your Entire Campus</div>
            <h1>Smart Campus Management Powered by AI</h1>
            <p>
              CampusOne AI connects students, faculty, administration, and campus operations
              into one intelligent platform — attendance, results, outpasses, and insights included.
            </p>
            <div className="hero-actions" style={{ justifyContent: 'flex-start' }}>
              <Link to="/login" className="btn btn-primary">Get Started</Link>
              <Link to="/login" className="btn btn-outline">Login</Link>
            </div>
          </div>
          <div className="float-stack" aria-hidden="true">
            <div className="float-card a">
              <strong>CGPA trend</strong>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>E1 Sem1 → E2 Sem2</p>
              <div className="mini-bar"><span /></div>
            </div>
            <div className="float-card b">
              <strong>Attendance 86%</strong>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated after faculty confirm</p>
              <div className="mini-bar"><span style={{ width: '86%' }} /></div>
            </div>
            <div className="float-card c">
              <strong>Outpass approved</strong>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>QR ready for security scan</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-head">
          <h2>Built for every campus workflow</h2>
          <p>Premium tools for academics, communication, and campus movement — not a generic dashboard.</p>
        </div>
        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3 style={{ marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="portals" style={{ background: 'var(--bg-soft)' }}>
        <div className="section-head">
          <h2>Three portals. One campus.</h2>
          <p>No public signup. Each role uses college-issued credentials.</p>
        </div>
        <div className="portals-row">
          <div className="portal-card">
            <GraduationCap size={34} color="#3b6dff" />
            <h3>Students</h3>
            <p>Manage your entire academic and campus life from one place.</p>
            <p style={{ marginTop: 10, fontSize: 13 }}>Attendance · Results · CGPA · Timetable · Assignments · Outpasses · Certificates · AI analysis</p>
          </div>
          <div className="portal-card">
            <Users size={34} color="#6d5efc" />
            <h3>Faculty</h3>
            <p>Manage students, academics, attendance and communication efficiently.</p>
            <p style={{ marginTop: 10, fontSize: 13 }}>Attendance · Marks · Assignments · Notices · Outpass approval · Timetable</p>
          </div>
          <div className="portal-card">
            <Shield size={34} color="#4f46e5" />
            <h3>Administrators</h3>
            <p>Control and monitor campus operations through centralized analytics.</p>
            <p style={{ marginTop: 10, fontSize: 13 }}>Students · Faculty · Certificates · Notifications · Reports · AI insights</p>
          </div>
        </div>
      </section>

      <section className="section" id="ai">
        <div className="ai-banner">
          <div>
            <div className="ai-label" style={{ color: '#fff' }}><Sparkles size={16} /> AI-Powered Campus</div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: 12 }}>Understand campus data instantly</h2>
            <p style={{ opacity: 0.95, marginBottom: 16 }}>
              Insights are generated from real academic and attendance records — not random copy.
            </p>
            <ul>
              <li>CGPA trend analysis across E1–E4</li>
              <li>Attendance risk identification by subject</li>
              <li>Urgent outpass prioritization for faculty</li>
              <li>Administrative analytics in plain language</li>
            </ul>
          </div>
          <div className="ai-viz">
            <div className="chip">Smart Alert · Mathematics attendance below 75%</div>
            <div className="chip">AI Recommendation · Revise DBMS before the next mid</div>
            <div className="chip">Faculty Insight · 3 urgent outpasses waiting</div>
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="section-head">
          <h2>Why CampusOne AI</h2>
          <p>A connected campus ecosystem instead of disconnected spreadsheets.</p>
        </div>
        <div className="why-grid">
          {why.map(([t, d]) => (
            <div className="why-item" key={t}>
              <Zap size={16} color="#3b6dff" />
              <strong style={{ marginTop: 8 }}>{t}</strong>
              <span>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="help" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2>Need help?</h2>
          <p>Use college email to sign in. Password resets go to your institutional inbox. Support: support@campusone.demo</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Open the portal</Link>
        </div>
      </section>

      <footer className="landing-footer">
        © {new Date().getFullYear()} CampusOne AI — Intelligent Campus Portal
      </footer>
    </div>
  );
}
