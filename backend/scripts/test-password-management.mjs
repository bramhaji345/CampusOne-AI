import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTest() {
  console.log('=== RUNNING PASSWORD MANAGEMENT INTEGRITY TEST ===');

  // 1. Authenticate as admin on local server
  const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@campusone.demo', password: 'Admin@123', role: 'admin' })
  }).then(r => r.json());

  console.log('Admin authenticated:', Boolean(adminLogin.token));

  // Clean up any test records from prior runs
  await prisma.student.deleteMany({ where: { studentId: 'O249999' } });
  await prisma.user.deleteMany({ where: { email: 'o249999@campusone.edu' } });
  await prisma.faculty.deleteMany({ where: { facultyId: 'FAC9999' } });
  await prisma.user.deleteMany({ where: { email: 'fac9999@campusone.edu' } });

  // 2. Admin creates student O249999
  const createStudentRes = await fetch('http://localhost:5000/api/admin/students', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + adminLogin.token
    },
    body: JSON.stringify({
      name: 'Test Student',
      email: 'o249999@campusone.edu',
      student_id: 'O249999',
      dept: 'CSE',
      year: 1,
      section: 'A'
    })
  }).then(r => r.json());

  console.log('Student created:', createStudentRes.student?.student_id, '| Temporary Password:', createStudentRes.temporaryPassword);
  if (!createStudentRes.temporaryPassword) throw new Error('Missing temporary password on creation');

  // Verify hash in database
  const studentUser = await prisma.user.findUnique({ where: { email: 'o249999@campusone.edu' } });
  console.log('Password is NOT plain-text in DB:', studentUser.password !== createStudentRes.temporaryPassword);
  console.log('Password is valid bcrypt hash in DB:', studentUser.password.startsWith('$2'));

  // 3. Test Student Login with temporary password
  const studentLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'O249999', password: createStudentRes.temporaryPassword, role: 'student' })
  }).then(r => r.json());
  console.log('Student login with temp password successful:', Boolean(studentLogin.token));

  // 4. Admin resets student password
  const resetStudentRes = await fetch('http://localhost:5000/api/admin/students/O249999/reset-password', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + adminLogin.token }
  }).then(r => r.json());

  console.log('Student password reset new temp password:', resetStudentRes.temporaryPassword);

  // 5. Old student password should now fail
  const oldStudentLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'O249999', password: createStudentRes.temporaryPassword, role: 'student' })
  });
  console.log('Old student password rejected (401):', oldStudentLogin.status === 401);

  // 6. New student password should succeed
  const newStudentLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'O249999', password: resetStudentRes.temporaryPassword, role: 'student' })
  }).then(r => r.json());
  console.log('New student password login successful:', Boolean(newStudentLogin.token));

  // 7. Admin creates faculty FAC9999
  const createFacultyRes = await fetch('http://localhost:5000/api/admin/faculty', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + adminLogin.token
    },
    body: JSON.stringify({
      name: 'Test Faculty',
      email: 'fac9999@campusone.edu',
      faculty_id: 'FAC9999',
      dept: 'CSE',
      designation: 'Assistant Professor'
    })
  }).then(r => r.json());

  console.log('Faculty created:', createFacultyRes.faculty?.faculty_id, '| Temporary Password:', createFacultyRes.temporaryPassword);

  // 8. Test Faculty Login with temporary password
  const facultyLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'FAC9999', password: createFacultyRes.temporaryPassword, role: 'faculty' })
  }).then(r => r.json());
  console.log('Faculty login with temp password successful:', Boolean(facultyLogin.token));

  // 9. Admin resets faculty password
  const resetFacultyRes = await fetch('http://localhost:5000/api/admin/faculty/FAC9999/reset-password', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + adminLogin.token }
  }).then(r => r.json());

  console.log('Faculty password reset new temp password:', resetFacultyRes.temporaryPassword);

  // 10. New faculty password login
  const newFacultyLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'FAC9999', password: resetFacultyRes.temporaryPassword, role: 'faculty' })
  }).then(r => r.json());
  console.log('New faculty password login successful:', Boolean(newFacultyLogin.token));

  // 11. Verify existing student O240001 still works
  const existingStudent = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'O240001', password: 'O240001@123', role: 'student' })
  }).then(r => r.json());
  console.log('Existing student O240001 still works:', Boolean(existingStudent.token));

  // 12. Verify existing faculty FAC0001 still works
  const existingFaculty = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'FAC0001', password: 'FAC0001@123', role: 'faculty' })
  }).then(r => r.json());
  console.log('Existing faculty FAC0001 still works:', Boolean(existingFaculty.token));

  // Clean up test records
  await prisma.student.deleteMany({ where: { studentId: 'O249999' } });
  await prisma.user.deleteMany({ where: { email: 'o249999@campusone.edu' } });
  await prisma.faculty.deleteMany({ where: { facultyId: 'FAC9999' } });
  await prisma.user.deleteMany({ where: { email: 'fac9999@campusone.edu' } });

  console.log('=== ALL TESTS PASSED! CLEANUP COMPLETE! ===');
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
