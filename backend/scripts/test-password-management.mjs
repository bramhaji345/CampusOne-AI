import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function runTest() {
  console.log(`=== RUNNING DEFAULT PASSWORD & SAMPLE DATA INTEGRITY TEST (${BASE_URL}) ===`);

  // 1. Authenticate as admin
  const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@campusone.demo', password: 'Admin@123', role: 'admin' })
  }).then(r => r.json());

  console.log('Admin authenticated:', Boolean(adminLogin.token));

  // Clean up any test records from prior runs
  await prisma.attendance.deleteMany({ where: { studentId: 'O249999' } });
  await prisma.result.deleteMany({ where: { studentId: 'O249999' } });
  await prisma.semesterCgpa.deleteMany({ where: { studentId: 'O249999' } });
  await prisma.student.deleteMany({ where: { studentId: 'O249999' } });
  await prisma.user.deleteMany({ where: { email: 'o249999@campusone.edu' } });

  await prisma.assignment.deleteMany({ where: { facultyId: 'FAC9999' } });
  await prisma.facultySubject.deleteMany({ where: { facultyId: 'FAC9999' } });
  await prisma.faculty.deleteMany({ where: { facultyId: 'FAC9999' } });
  await prisma.user.deleteMany({ where: { email: 'fac9999@campusone.edu' } });

  // 2. Admin creates student O249999
  const createStudentRes = await fetch(`${BASE_URL}/api/admin/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + adminLogin.token
    },
    body: JSON.stringify({
      name: 'Test Student',
      email: 'o249999@campusone.edu',
      student_id: 'o249999', // Lowercase test
      dept: 'CSE',
      year: 1,
      section: 'A'
    })
  }).then(r => r.json());

  console.log('Student created:', createStudentRes.student?.student_id, '| Password:', createStudentRes.temporaryPassword);
  if (createStudentRes.temporaryPassword !== 'O249999@123') {
    throw new Error(`Expected password O249999@123, got: ${createStudentRes.temporaryPassword}`);
  }

  // 3. Test Student Login with ID & password (uppercase)
  const studentLogin1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'O249999', password: 'O249999@123', role: 'student' })
  }).then(r => r.json());
  console.log('Student login with uppercase ID (O249999):', Boolean(studentLogin1.token));
  if (!studentLogin1.token) throw new Error('Student login failed with O249999');

  // 4. Test Student Login with lowercase ID
  const studentLogin2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'o249999', password: 'O249999@123', role: 'student' })
  }).then(r => r.json());
  console.log('Student login with lowercase ID (o249999):', Boolean(studentLogin2.token));
  if (!studentLogin2.token) throw new Error('Student login failed with o249999');

  // 5. Test Student Login with Email
  const studentLogin3 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'o249999@campusone.edu', password: 'O249999@123', role: 'student' })
  }).then(r => r.json());
  console.log('Student login with email:', Boolean(studentLogin3.token));
  if (!studentLogin3.token) throw new Error('Student login failed with email');

  // 6. Verify Sample Data Assigned to Student
  const results = await prisma.result.findMany({ where: { studentId: 'O249999' } });
  console.log('Assigned Results count:', results.length, '(SEM + MID)');
  if (results.length === 0) throw new Error('No results generated for student');

  const attendance = await prisma.attendance.findMany({ where: { studentId: 'O249999' } });
  console.log('Assigned Attendance records count:', attendance.length);
  if (attendance.length === 0) throw new Error('No attendance generated for student');

  const cgpa = await prisma.semesterCgpa.findMany({ where: { studentId: 'O249999' } });
  console.log('Assigned Semester CGPA:', cgpa[0]?.gpa);
  if (cgpa.length === 0) throw new Error('No CGPA record generated for student');

  // 7. Test Student Dashboard APIs for this new student!
  const resultsAiRes = await fetch(`${BASE_URL}/api/results/ai-analysis`, {
    headers: { Authorization: 'Bearer ' + studentLogin1.token }
  }).then(r => r.json());
  console.log('Student Dashboard results/ai-analysis trend length:', resultsAiRes.trend?.length);

  const attAiRes = await fetch(`${BASE_URL}/api/attendance/ai-analysis`, {
    headers: { Authorization: 'Bearer ' + studentLogin1.token }
  }).then(r => r.json());
  console.log('Student Dashboard attendance/ai-analysis percentage:', attAiRes.percentage);

  // 8. Admin creates faculty FAC9999
  const createFacultyRes = await fetch(`${BASE_URL}/api/admin/faculty`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + adminLogin.token
    },
    body: JSON.stringify({
      name: 'Dr. Test Professor',
      email: 'fac9999@campusone.edu',
      faculty_id: 'fac9999', // Lowercase test
      dept: 'CSE',
      designation: 'Assistant Professor'
    })
  }).then(r => r.json());

  console.log('Faculty created:', createFacultyRes.faculty?.faculty_id, '| Password:', createFacultyRes.temporaryPassword);
  if (createFacultyRes.temporaryPassword !== 'FAC9999@123') {
    throw new Error(`Expected password FAC9999@123, got: ${createFacultyRes.temporaryPassword}`);
  }

  // 9. Test Faculty Login with uppercase & lowercase ID
  const facultyLogin1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'FAC9999', password: 'FAC9999@123', role: 'faculty' })
  }).then(r => r.json());
  console.log('Faculty login with uppercase ID (FAC9999):', Boolean(facultyLogin1.token));
  if (!facultyLogin1.token) throw new Error('Faculty login failed with FAC9999');

  const facultyLogin2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fac9999', password: 'FAC9999@123', role: 'faculty' })
  }).then(r => r.json());
  console.log('Faculty login with lowercase ID (fac9999):', Boolean(facultyLogin2.token));
  if (!facultyLogin2.token) throw new Error('Faculty login failed with fac9999');

  // 10. Verify Sample Data Assigned to Faculty
  const facultySubjs = await prisma.facultySubject.findMany({ where: { facultyId: 'FAC9999' } });
  console.log('Assigned Faculty Subjects count:', facultySubjs.length);
  const facultyAssigns = await prisma.assignment.findMany({ where: { facultyId: 'FAC9999' } });
  console.log('Assigned Faculty Assignments count:', facultyAssigns.length);

  // 11. Test Reset Password
  const resetStudent = await fetch(`${BASE_URL}/api/admin/students/O249999/reset-password`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + adminLogin.token }
  }).then(r => r.json());
  console.log('Reset Student Password:', resetStudent.temporaryPassword);
  if (resetStudent.temporaryPassword !== 'O249999@123') throw new Error('Reset student password mismatch');

  const resetFaculty = await fetch(`${BASE_URL}/api/admin/faculty/FAC9999/reset-password`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + adminLogin.token }
  }).then(r => r.json());
  console.log('Reset Faculty Password:', resetFaculty.temporaryPassword);
  if (resetFaculty.temporaryPassword !== 'FAC9999@123') throw new Error('Reset faculty password mismatch');

  // Clean up test records
  await prisma.attendance.deleteMany({ where: { studentId: 'O249999' } });
  await prisma.result.deleteMany({ where: { studentId: 'O249999' } });
  await prisma.semesterCgpa.deleteMany({ where: { studentId: 'O249999' } });
  await prisma.student.deleteMany({ where: { studentId: 'O249999' } });
  await prisma.user.deleteMany({ where: { email: 'o249999@campusone.edu' } });

  await prisma.assignment.deleteMany({ where: { facultyId: 'FAC9999' } });
  await prisma.facultySubject.deleteMany({ where: { facultyId: 'FAC9999' } });
  await prisma.faculty.deleteMany({ where: { facultyId: 'FAC9999' } });
  await prisma.user.deleteMany({ where: { email: 'fac9999@campusone.edu' } });

  console.log('=== ALL TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL ===');
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
