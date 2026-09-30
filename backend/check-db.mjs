import { prisma } from './src/config/prisma.js';

async function main() {
  const [students, faculty, departments, branches, subjects, results, attendance, cgpa, timetable, assignments] = await Promise.all([
    prisma.student.count(),
    prisma.faculty.count(),
    prisma.department.count(),
    prisma.branch.count(),
    prisma.subject.count(),
    prisma.result.count(),
    prisma.attendance.count(),
    prisma.semesterCgpa.count(),
    prisma.timetable.count(),
    prisma.assignment.count(),
  ]);

  const studentSources = await prisma.student.groupBy({ by: ['sourceStatus'], _count: true });
  const facultySources = await prisma.faculty.groupBy({ by: ['sourceStatus'], _count: true });
  const studentsByYear = await prisma.student.groupBy({ by: ['year'], _count: true });
  const studentsByBranch = await prisma.student.groupBy({ by: ['deptCode'], _count: true });

  console.log('=== DATABASE OVERVIEW ===');
  console.log(JSON.stringify({
    students,
    faculty,
    departments,
    branches,
    subjects,
    results,
    attendance,
    cgpa,
    timetable,
    assignments,
    studentSources,
    facultySources,
    studentsByYear,
    studentsByBranch,
  }, null, 2));

  // Sample student per year
  for (const yr of [1, 2, 3, 4]) {
    const s = await prisma.student.findFirst({
      where: { year: yr, sourceStatus: { contains: 'SYNTHETIC' } },
      include: { user: true },
      orderBy: { studentId: 'asc' },
    });
    if (s) {
      console.log(`Year ${yr} Student: ${s.studentId} | ${s.user.name} | Dept: ${s.deptCode} | Section: ${s.section} | CGPA: ${s.cgpa} | Email: ${s.user.email}`);
    }
  }

  // Sample faculty
  const f = await prisma.faculty.findFirst({
    where: { sourceStatus: { contains: 'SYNTHETIC' } },
    include: { user: true },
    orderBy: { facultyId: 'asc' },
  });
  if (f) {
    console.log(`Faculty: ${f.facultyId} | ${f.user.name} | Dept: ${f.deptCode} | Designation: ${f.designation} | Email: ${f.user.email} | Subjects: ${f.subjectsText}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
