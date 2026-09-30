import { prisma } from './src/config/prisma.js';
import bcrypt from 'bcryptjs';
import { signToken } from './src/middleware/auth.js';
import { getStudentProfile, getFacultyProfile } from './src/services/mappers.js';

async function testApi() {
  console.log('=== API & LOGIN INTEGRITY TEST ===');

  // 1. Test student login (O240001)
  const studentUser = await prisma.user.findFirst({
    where: { email: 'o240001@campusone.edu' },
    include: { student: true },
  });
  const sPassOk = await bcrypt.compare('O240001@123', studentUser.password);
  console.log(`Student login O240001@123: ${sPassOk ? 'SUCCESS' : 'FAILED'}`);
  const studentProfile = await getStudentProfile(studentUser.id);
  console.log('Student Profile:', JSON.stringify({
    name: studentProfile.name,
    id: studentProfile.student_id,
    dept: studentProfile.dept,
    year: studentProfile.year,
    section: studentProfile.section,
    cgpa: studentProfile.cgpa,
  }));

  // Check student results (sem & mid)
  const semResults = await prisma.result.count({ where: { studentId: 'O240001', type: 'sem' } });
  const midResults = await prisma.result.count({ where: { studentId: 'O240001', type: 'mid' } });
  console.log(`Student O240001 results: ${semResults} sem marks, ${midResults} mid marks`);

  // Check student attendance
  const attCount = await prisma.attendance.count({ where: { studentId: 'O240001' } });
  console.log(`Student O240001 attendance records: ${attCount}`);

  // Check student timetable
  const owner = `${studentProfile.dept}-${studentProfile.section}-E${studentProfile.year}`;
  const ttCount = await prisma.timetable.count({
    where: { roleOwner: 'student', ownerId: { in: [owner, `${studentProfile.dept}-${studentProfile.section}`] } },
  });
  console.log(`Student O240001 timetable slots (owner=${owner}): ${ttCount}`);

  // 2. Test Year 4 student (O210001) - check CGPA journey from E1 to E4
  const y4User = await prisma.user.findFirst({ where: { email: 'o210001@campusone.edu' }, include: { student: true } });
  const y4PassOk = await bcrypt.compare('O210001@123', y4User.password);
  console.log(`Year 4 Student login O210001@123: ${y4PassOk ? 'SUCCESS' : 'FAILED'}`);
  const y4Cgpa = await prisma.semesterCgpa.findMany({
    where: { studentId: 'O210001' },
    orderBy: [{ yearLevel: 'asc' }, { semester: 'asc' }],
  });
  console.log('O210001 CGPA Journey:');
  for (const c of y4Cgpa) {
    console.log(`  ${c.yearLevel} ${c.semester}: GPA ${c.gpa} (Cumulative: ${c.cumulativeCredits} credits)`);
  }

  // 3. Test faculty login (FAC0001)
  const facUser = await prisma.user.findFirst({
    where: { email: 'fac0001@campusone.edu' },
    include: { faculty: true },
  });
  const fPassOk = await bcrypt.compare('FAC0001@123', facUser.password);
  console.log(`Faculty login FAC0001@123: ${fPassOk ? 'SUCCESS' : 'FAILED'}`);
  const facProfile = await getFacultyProfile(facUser.id);
  console.log('Faculty Profile:', JSON.stringify({
    name: facProfile.name,
    id: facProfile.faculty_id,
    dept: facProfile.dept,
    designation: facProfile.designation,
    subjects: facProfile.subjects,
  }));

  // Check faculty students (students in their assigned classes)
  const assignments = await prisma.facultySubject.findMany({
    where: { facultyId: 'FAC0001' },
    select: { classId: true },
  });
  const assignedClassIds = [...new Set(assignments.map(r => r.classId))];
  const teachingStudents = await prisma.student.count({
    where: { classId: { in: assignedClassIds } },
  });
  console.log(`Faculty FAC0001 teaching students across ${assignedClassIds.length} classes: ${teachingStudents}`);

  // 4. Test admin login
  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  const aPassOk = await bcrypt.compare('Admin@123', adminUser.password);
  console.log(`Admin login Admin@123: ${aPassOk ? 'SUCCESS' : 'FAILED'}`);

  // 5. Test Year-Level Student ID prefixes (E1->O24, E2->O23, E3->O22, E4->O21)
  console.log('--- Year-Level Class ID Verification ---');
  for (const [lvl, yr, prefix] of [['E1', 1, 'O24'], ['E2', 2, 'O23'], ['E3', 3, 'O22'], ['E4', 4, 'O21']]) {
    const list = await prisma.student.findMany({ where: { year: yr }, take: 3, select: { studentId: true } });
    const allMatch = list.every(s => s.studentId.startsWith(prefix));
    console.log(`Class ${lvl} (Year ${yr}): sample IDs [${list.map(s => s.studentId).join(', ')}] — startsWith '${prefix}': ${allMatch ? 'VERIFIED' : 'FAILED'}`);
  }
}

testApi().catch(console.error).finally(() => prisma.$disconnect());
