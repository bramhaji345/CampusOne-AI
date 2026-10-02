import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { queryOne, run, queryAll } from './db.js';

export async function seedDatabase() {
  const existing = queryOne('SELECT id FROM users LIMIT 1');
  if (existing) return;

  const hash = await bcrypt.hash('password123', 10);

  // Admin
  const adminId = uuid();
  run(
    `INSERT INTO users (id, email, password, role, name, photo) VALUES (?, ?, ?, ?, ?, ?)`,
    [adminId, 'admin@campusone.edu', hash, 'admin', 'Campus Admin', null]
  );

  // Faculty
  const facultyUsers = [
    { name: 'Dr. Priya Sharma', email: 'priya.sharma@campusone.edu', facultyId: 'FAC001', dept: 'CSE', designation: 'Associate Professor', subjects: 'Data Structures,DBMS,AI Fundamentals' },
    { name: 'Prof. Rajesh Kumar', email: 'rajesh.kumar@campusone.edu', facultyId: 'FAC002', dept: 'CSE', designation: 'Assistant Professor', subjects: 'Operating Systems,Computer Networks' },
    { name: 'Dr. Anitha Reddy', email: 'anitha.reddy@campusone.edu', facultyId: 'FAC003', dept: 'ECE', designation: 'Professor', subjects: 'Digital Electronics,VLSI' },
  ];

  const facultyIds = {};
  for (const f of facultyUsers) {
    const uid = uuid();
    facultyIds[f.facultyId] = uid;
    run(`INSERT INTO users (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)`, [uid, f.email, hash, 'faculty', f.name]);
    run(
      `INSERT INTO faculty (user_id, faculty_id, dept, designation, mobile, subjects) VALUES (?, ?, ?, ?, ?, ?)`,
      [uid, f.facultyId, f.dept, f.designation, '9876543210', f.subjects]
    );
  }

  // Students
  const students = [
    { name: 'Aarav Patel', email: 'aarav.patel@campusone.edu', sid: 'STU2024001', dorm: 'H-101', course: 'B.Tech', year: 2, dept: 'CSE', parent: 'Ramesh Patel', mobile: '9123456780', parentPhone: '9988776655', section: 'A', cgpa: 8.4 },
    { name: 'Sneha Iyer', email: 'sneha.iyer@campusone.edu', sid: 'STU2024002', dorm: 'H-204', course: 'B.Tech', year: 2, dept: 'CSE', parent: 'Lakshmi Iyer', mobile: '9123456781', parentPhone: '9988776656', section: 'A', cgpa: 9.1 },
    { name: 'Vikram Singh', email: 'vikram.singh@campusone.edu', sid: 'STU2024003', dorm: 'H-112', course: 'B.Tech', year: 3, dept: 'CSE', parent: 'Balbir Singh', mobile: '9123456782', parentPhone: '9988776657', section: 'B', cgpa: 7.8 },
    { name: 'Meera Nair', email: 'meera.nair@campusone.edu', sid: 'STU2024004', dorm: 'H-301', course: 'B.Tech', year: 1, dept: 'ECE', parent: 'Suresh Nair', mobile: '9123456783', parentPhone: '9988776658', section: 'A', cgpa: 8.7 },
    { name: 'Arjun Das', email: 'arjun.das@campusone.edu', sid: 'STU2024005', dorm: 'H-118', course: 'B.Tech', year: 2, dept: 'CSE', parent: 'Pradeep Das', mobile: '9123456784', parentPhone: '9988776659', section: 'A', cgpa: 8.0 },
  ];

  for (const s of students) {
    const uid = uuid();
    run(`INSERT INTO users (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)`, [uid, s.email, hash, 'student', s.name]);
    run(
      `INSERT INTO students (user_id, student_id, dorm_no, course, year, dept, parent_name, mobile, parent_phone, section, cgpa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uid, s.sid, s.dorm, s.course, s.year, s.dept, s.parent, s.mobile, s.parentPhone, s.section, s.cgpa]
    );
  }

  // Results for first student across E1-E4
  const subjects = ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Mathematics', 'AI Fundamentals'];
  const yearLevels = ['E1', 'E2', 'E3', 'E4'];
  const semesters = ['Sem1', 'Sem2'];
  const types = ['sem', 'mid'];

  for (const student of students.slice(0, 3)) {
    for (const yl of yearLevels) {
      for (const sem of semesters) {
        for (const type of types) {
          subjects.forEach((subj, i) => {
            const marks = type === 'mid' ? 18 + Math.floor(Math.random() * 12) : 65 + Math.floor(Math.random() * 30);
            const max = type === 'mid' ? 30 : 100;
            const grade = marks / max >= 0.9 ? 'Ex' : marks / max >= 0.8 ? 'A' : marks / max >= 0.7 ? 'B' : marks / max >= 0.6 ? 'C' : 'D';
            run(
              `INSERT INTO results (id, student_id, year_level, semester, type, subject, marks, max_marks, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [uuid(), student.sid, yl, sem, type, subj, marks, max, grade]
            );
          });
        }
      }
    }
  }

  // Attendance
  const today = new Date();
  for (let d = 0; d < 20; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0) continue;
    const dateStr = date.toISOString().slice(0, 10);
    for (const student of students) {
      for (const subj of subjects.slice(0, 4)) {
        const status = Math.random() > 0.15 ? 'present' : 'absent';
        run(
          `INSERT INTO attendance (id, student_id, subject, class_type, date, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuid(), student.sid, subj, Math.random() > 0.3 ? 'lecture' : 'lab', dateStr, status, 'FAC001']
        );
      }
    }
  }

  // Timetable for students CSE A
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = ['09:00-10:00', '10:00-11:00', '11:15-12:15', '13:15-14:15', '14:15-15:15'];
  days.forEach((day, di) => {
    slots.forEach((slot, pi) => {
      const subj = subjects[(di + pi) % subjects.length];
      run(
        `INSERT INTO timetable (id, role_owner, owner_id, day, period, subject, room, time_slot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), 'student', 'CSE-A', day, pi + 1, subj, `R-${100 + pi}`, slot]
      );
      run(
        `INSERT INTO timetable (id, role_owner, owner_id, day, period, subject, room, time_slot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), 'faculty', 'FAC001', day, pi + 1, subj, `R-${100 + pi}`, slot]
      );
    });
  });

  // Assignments
  const a1 = uuid();
  const a2 = uuid();
  run(
    `INSERT INTO assignments (id, faculty_id, title, description, subject, due_date, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [a1, 'FAC001', 'DBMS ER Diagram Assignment', 'Design an ER diagram for a campus management system.', 'DBMS', new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), null]
  );
  run(
    `INSERT INTO assignments (id, faculty_id, title, description, subject, due_date, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [a2, 'FAC001', 'AI Trend Analysis Report', 'Analyze CGPA trends using basic ML concepts.', 'AI Fundamentals', new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10), null]
  );

  // Notifications
  run(
    `INSERT INTO notifications (id, title, body, sender_id, target_role, target_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuid(), 'Mid Semester Exams Schedule', 'Mid semester exams begin from next Monday. Check the results portal for hall tickets.', adminId, 'student', null]
  );
  run(
    `INSERT INTO notifications (id, title, body, sender_id, target_role, target_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuid(), 'DBMS Assignment Uploaded', 'New assignment on ER diagrams has been posted. Due in 7 days.', facultyIds.FAC001, 'student', null]
  );
  run(
    `INSERT INTO notifications (id, title, body, sender_id, target_role, target_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuid(), 'E2 Sem1 Results Published', 'Semester results for E2 Sem1 are now available for download.', adminId, 'student', null]
  );

  // Sample outpass
  run(
    `INSERT INTO outpasses (id, student_id, reason, reason_type, from_date, to_date, status, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuid(), 'STU2024001', 'Medical appointment at city hospital', 'medical', new Date().toISOString().slice(0, 10), new Date().toISOString().slice(0, 10), 'pending', 'FAC001']
  );

  console.log('Database seeded successfully');
  console.log('Demo credentials (password: password123):');
  console.log('  Student: aarav.patel@campusone.edu');
  console.log('  Faculty: priya.sharma@campusone.edu');
  console.log('  Admin:   admin@campusone.edu');
}
