import { PrismaClient } from '@prisma/client';

const neonUrl = process.env.DATABASE_URL || 'postgresql://campusone@127.0.0.1:5433/campusone?schema=public';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: neonUrl
    }
  }
});

async function audit() {
  try {
    const students = await prisma.student.count();
    const faculty = await prisma.faculty.count();
    const users = await prisma.user.count();
    const departments = await prisma.department.count();
    const branches = await prisma.branch.count();
    const subjects = await prisma.subject.count();
    const results = await prisma.result.count();
    const attendance = await prisma.attendance.count();
    const cgpa = await prisma.semesterCgpa.count();
    const timetable = await prisma.timetable.count();
    const assignments = await prisma.assignment.count();
    const sampleStudent = await prisma.student.findFirst({
      where: { studentId: 'O240001' },
      include: { user: true }
    });
    const sampleFaculty = await prisma.faculty.findFirst({
      where: { facultyId: 'FAC0001' },
      include: { user: true }
    });

    console.log('=== NEON PRODUCTION DATABASE INTEGRITY AUDIT ===');
    console.log('Students:            ', students);
    console.log('Faculty:             ', faculty);
    console.log('Users:               ', users);
    console.log('Departments:         ', departments);
    console.log('Branches:            ', branches);
    console.log('Subjects:            ', subjects);
    console.log('Results:             ', results);
    console.log('Attendance:          ', attendance);
    console.log('CGPA Records:        ', cgpa);
    console.log('Timetable Slots:     ', timetable);
    console.log('Assignments:         ', assignments);
    console.log('Sample Student (O240001):', sampleStudent ? { name: sampleStudent.user.name, email: sampleStudent.user.email, dept: sampleStudent.dept, year: sampleStudent.year } : 'NOT FOUND');
    console.log('Sample Faculty (FAC0001):', sampleFaculty ? { name: sampleFaculty.user.name, email: sampleFaculty.user.email, dept: sampleFaculty.dept } : 'NOT FOUND');

    const bcrypt = (await import('bcryptjs')).default;
    const sMatch = sampleStudent ? await bcrypt.compare('O240001@123', sampleStudent.user.password) : false;
    const fMatch = sampleFaculty ? await bcrypt.compare('FAC0001@123', sampleFaculty.user.password) : false;
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@campusone.demo' } });
    const aMatch = adminUser ? await bcrypt.compare('Admin@123', adminUser.password) : false;

    console.log('\n=== AUTHENTICATION INTEGRITY ON NEON ===');
    console.log('Student (O240001@123):', sMatch ? 'VALID ✅' : 'FAILED ❌');
    console.log('Faculty (FAC0001@123):', fMatch ? 'VALID ✅' : 'FAILED ❌');
    console.log('Admin (Admin@123):    ', aMatch ? 'VALID ✅' : 'FAILED ❌');
  } catch(err) {
    console.error('Audit Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

audit();
