export default function HelpPage() {
  const faqs = [
    ['How do I sign in?', 'Use your college-issued email and password. There is no public signup.'],
    ['I forgot my password.', 'On the login page choose Forgot password and enter your college email (@campusone.demo or @campusone.edu).'],
    ['How do outpasses work?', 'Students submit a request. Faculty reviews by priority (Urgent → Medical → Event). Approved requests generate a QR for security.'],
    ['Why can’t faculty change the attendance date?', 'The date is locked to today to reduce proxy and backdated marking.'],
    ['When do results update?', 'As soon as faculty uploads mid marks or administration publishes semester marks.'],
    ['Who sees my data?', 'Role-based access. Students only see their own records. Faculty see assigned classes. Admin has campus oversight.'],
  ];

  return (
    <div>
      <div className="page-title">
        <h1>Help Center</h1>
        <p>FAQs, module guides, and support</p>
      </div>
      <div className="panel">
        {faqs.map(([q, a]) => (
          <div key={q} className="notif-item" style={{ marginBottom: 10 }}>
            <h4>{q}</h4>
            <p>{a}</p>
          </div>
        ))}
      </div>
      <div className="panel">
        <h3>Contact</h3>
        <p style={{ color: 'var(--text-muted)' }}>Email <strong>support@campusone.demo</strong> or visit the admin office during working hours.</p>
      </div>
    </div>
  );
}
