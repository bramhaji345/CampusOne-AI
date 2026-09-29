import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../generated/prisma-v2/index.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const prisma = new PrismaClient();

const FIRST = ['Aarav', 'Sneha', 'Vikram', 'Meera', 'Arjun', 'Diya', 'Rohan', 'Ananya', 'Kabir', 'Isha', 'Neel', 'Pooja', 'Aditya', 'Kavya', 'Rahul', 'Nisha', 'Yash', 'Tara', 'Kunal', 'Riya'];
const LAST = ['Patel', 'Iyer', 'Singh', 'Nair', 'Das', 'Sharma', 'Reddy', 'Khan', 'Gupta', 'Joshi', 'Mehta', 'Rao', 'Bose', 'Kapoor', 'Verma'];
const DEPTS = [
  { name: 'Computer Science', code: 'CSE' },
  { name: 'Electronics', code: 'ECE' },
  { name: 'Electrical', code: 'EEE' },
  { name: 'Mechanical', code: 'MECH' },
  { name: 'Civil', code: 'CIVIL' },
];
const SUBJECTS = {
  CSE: ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'AI Fundamentals'],
  ECE: ['Digital Electronics', 'VLSI', 'Signals and Systems', 'Communication Systems', 'Microprocessors'],
  EEE: ['Power Systems', 'Control Systems', 'Electrical Machines', 'Power Electronics', 'Circuits'],
  MECH: ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing', 'CAD'],
  CIVIL: ['Structural Analysis', 'Geotechnical', 'Surveying', 'Transportation', 'Concrete Technology'],
};
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = ['09:00-10:00', '10:00-11:00', '11:15-12:15', '13:15-14:15', '14:15-15:15'];

function pick(arr, i) { return arr[i % arr.length]; }
function grade(marks, max) {
  const r = marks / max;
  return r >= 0.9 ? 'A+' : r >= 0.8 ? 'A' : r >= 0.7 ? 'B' : r >= 0.6 ? 'C' : 'D';
}
function gp(marks, max) {
  const p = (marks / max) * 100;
  return p >= 90 ? 10 : p >= 80 ? 9 : p >= 70 ? 8 : p >= 60 ? 7 : p >= 50 ? 6 : 0;
}

async function chunkCreate(model, rows, size = 400) {
  for (let i = 0; i < rows.length; i += size) {
    await prisma[model].createMany({ data: rows.slice(i, i + size), skipDuplicates: true });
  }
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@campusone.demo' } });
  if (existing) {
    console.log('Database already seeded.');
    return;
  }

  const studentHash = await bcrypt.hash('Student@123', 10);
  const facultyHash = await bcrypt.hash('Faculty@123', 10);
  const adminHash = await bcrypt.hash('Admin@123', 10);

  const adminUser = await prisma.user.create({
    data: { email: 'admin@campusone.demo', password: adminHash, role: 'admin', name: 'Campus Admin' },
  });
  await prisma.admin.create({ data: { userId: adminUser.id } });

  const deptRows = {};
  for (const d of DEPTS) {
    deptRows[d.code] = await prisma.department.create({ data: d });
  }

  const courseRows = {};
  for (const d of DEPTS) {
    courseRows[d.code] = await prisma.course.create({
      data: { name: 'B.Tech', code: `BTECH-${d.code}`, departmentId: deptRows[d.code].id },
    });
  }

  const subjectRows = {};
  for (const [code, names] of Object.entries(SUBJECTS)) {
    subjectRows[code] = [];
    for (let i = 0; i < names.length; i++) {
      subjectRows[code].push(await prisma.subject.create({
        data: { name: names[i], code: `${code}${100 + i}`, departmentId: deptRows[code].id },
      }));
    }
  }

  const classMap = {};
  for (const d of DEPTS) {
    for (const yearLevel of ['E1', 'E2', 'E3', 'E4']) {
      const batch = await prisma.batch.create({
        data: { name: `${d.code}-${yearLevel}-2024`, yearLevel, courseId: courseRows[d.code].id },
      });
      for (const section of ['A', 'B']) {
        const cls = await prisma.class.create({ data: { section, batchId: batch.id } });
        classMap[`${d.code}-${yearLevel}-${section}`] = cls;
      }
    }
  }

  const facultyRecords = [];
  let facN = 1;
  for (const d of DEPTS) {
    const names = [
      ['Priya', 'Sharma', 'Associate Professor'],
      ['Rajesh', 'Kumar', 'Assistant Professor'],
      ['Anitha', 'Reddy', 'Professor'],
      ['Sanjay', 'Mehta', 'Assistant Professor'],
      ['Lakshmi', 'Iyer', 'Associate Professor'],
      ['Vivek', 'Nair', 'Assistant Professor'],
    ];
    for (const [fn, ln, des] of names) {
      const facultyId = `FAC${String(facN).padStart(3, '0')}`;
      const email = facN === 1 ? 'faculty@campusone.demo' : `${fn.toLowerCase()}.${ln.toLowerCase()}${facN}@campusone.demo`;
      const user = await prisma.user.create({
        data: { email, password: facultyHash, role: 'faculty', name: `Dr. ${fn} ${ln}` },
      });
      const fac = await prisma.faculty.create({
        data: {
          userId: user.id,
          facultyId,
          designation: des,
          mobile: `98${String(70000000 + facN).slice(-8)}`,
          subjectsText: SUBJECTS[d.code].slice(0, 3).join(','),
          deptCode: d.code,
          departmentId: deptRows[d.code].id,
        },
      });
      facultyRecords.push({ ...fac, name: user.name, dept: d.code });
      const cls = classMap[`${d.code}-E2-A`];
      for (const sub of subjectRows[d.code].slice(0, 3)) {
        await prisma.facultySubject.create({
          data: { facultyId: fac.facultyId, subjectId: sub.id, classId: cls.id },
        });
      }
      facN += 1;
    }
  }

  const demoFaculty = facultyRecords[0];
  const students = [];
  const studentUsers = [];
  for (let i = 0; i < 520; i++) {
    const dept = DEPTS[i % 5];
    const year = i === 0 ? 2 : (i % 4) + 1;
    const yearLevel = `E${year}`;
    const section = i % 2 === 0 ? 'A' : 'B';
    const fn = pick(FIRST, i);
    const ln = pick(LAST, Math.floor(i / 3));
    const studentId = `STU2024${String(i + 1).padStart(4, '0')}`;
    const email = i === 0 ? 'student@campusone.demo' : `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@campusone.demo`;
    studentUsers.push({
      email, password: studentHash, role: 'student', name: `${fn} ${ln}`,
      studentId, dept, year, yearLevel, section, i,
    });
  }

  for (let i = 0; i < studentUsers.length; i += 40) {
    const slice = studentUsers.slice(i, i + 40);
    const created = await Promise.all(slice.map((s) => prisma.user.create({
      data: { email: s.email, password: s.password, role: 'student', name: s.name },
    })));
    const studentData = created.map((user, idx) => {
      const meta = slice[idx];
      const cls = classMap[`${meta.dept.code}-${meta.yearLevel}-${meta.section}`];
      return {
        userId: user.id,
        studentId: meta.studentId,
        dormNo: `H-${100 + (meta.i % 400)}`,
        year: meta.year,
        parentName: `${pick(FIRST, meta.i + 7)} ${meta.name.split(' ')[1]}`,
        mobile: `91${String(20000000 + meta.i).padStart(8, '0')}`,
        parentPhone: `99${String(30000000 + meta.i).padStart(8, '0')}`,
        section: meta.section,
        courseName: 'B.Tech',
        deptCode: meta.dept.code,
        cgpa: 7 + ((meta.i * 17) % 25) / 10,
        departmentId: deptRows[meta.dept.code].id,
        courseId: courseRows[meta.dept.code].id,
        classId: cls.id,
      };
    });
    await prisma.student.createMany({ data: studentData });
    students.push(...studentData);
  }

  const demoStudent = students[0];
  const resultRows = [];
  const cgpaRows = [];
  for (const st of students) {
    const subjs = subjectRows[st.deptCode];
    const years = st.studentId === demoStudent.studentId ? ['E1', 'E2', 'E3', 'E4'] : [`E${st.year}`];
    for (const yl of years) {
      for (const sem of ['Sem1', 'Sem2']) {
        let gpaSum = 0;
        const types = st.studentId === demoStudent.studentId ? ['sem', 'mid'] : ['sem'];
        for (const type of types) {
          for (const sub of subjs.slice(0, 4)) {
            const max = type === 'mid' ? 30 : 100;
            const marks = type === 'mid' ? 18 + (st.year * 2 + sub.name.length) % 12 : 62 + (st.year * 5 + sub.code.length * 3 + yl.charCodeAt(1)) % 30;
            resultRows.push({
              studentId: st.studentId,
              subjectId: sub.id,
              yearLevel: yl,
              semester: sem,
              type,
              subject: sub.name,
              marks,
              maxMarks: max,
              grade: grade(marks, max),
              gradePoints: gp(marks, max),
            });
            if (type === 'sem') gpaSum += (marks / max) * 10;
          }
        }
        cgpaRows.push({
          studentId: st.studentId,
          yearLevel: yl,
          semester: sem,
          gpa: Math.round((gpaSum / 4) * 100) / 100,
        });
      }
    }
  }
  await chunkCreate('result', resultRows, 500);
  await chunkCreate('semesterCgpa', cgpaRows, 500);

  const attRows = [];
  const today = new Date();
  const dates = [];
  for (let d = 1; d <= 16; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0) continue;
    dates.push(date.toISOString().slice(0, 10));
  }
  for (const st of students) {
    const subjs = subjectRows[st.deptCode].slice(0, 3);
    const fac = facultyRecords.find((f) => f.deptCode === st.deptCode) || demoFaculty;
    for (const date of dates.slice(0, st.studentId === demoStudent.studentId ? 14 : 8)) {
      for (const sub of subjs) {
        attRows.push({
          studentId: st.studentId,
          subjectId: sub.id,
          facultyId: fac.facultyId,
          subject: sub.name,
          classType: 'lecture',
          date,
          status: (st.year + date.length + sub.name.length) % 7 === 0 ? 'absent' : 'present',
        });
      }
    }
  }
  await chunkCreate('attendance', attRows, 800);

  const tt = [];
  const cseClass = classMap['CSE-E2-A'];
  const cseSubs = subjectRows.CSE;
  DAYS.forEach((day, di) => {
    SLOTS.forEach((slot, pi) => {
      const sub = cseSubs[(di + pi) % cseSubs.length];
      const fac = facultyRecords[pi % 6];
      tt.push({
        classId: cseClass.id,
        facultyId: fac.facultyId,
        subjectId: sub.id,
        roleOwner: 'student',
        ownerId: 'CSE-A',
        day,
        period: pi + 1,
        subject: sub.name,
        room: `R-${100 + pi}`,
        timeSlot: slot,
        facultyName: fac.name,
        classType: pi === 4 ? 'lab' : 'lecture',
      });
      if (fac.facultyId === demoFaculty.facultyId) {
        tt.push({
          classId: cseClass.id,
          facultyId: fac.facultyId,
          subjectId: sub.id,
          roleOwner: 'faculty',
          ownerId: fac.facultyId,
          day,
          period: pi + 1,
          subject: sub.name,
          room: `R-${100 + pi}`,
          timeSlot: slot,
          facultyName: fac.name,
          classType: pi === 4 ? 'lab' : 'lecture',
        });
      }
    });
  });
  await prisma.timetable.createMany({ data: tt });

  const a1 = await prisma.assignment.create({
    data: {
      facultyId: demoFaculty.facultyId,
      classId: cseClass.id,
      subjectId: cseSubs[1].id,
      title: 'DBMS ER Diagram Assignment',
      description: 'Design an ER diagram for a campus management system.',
      subject: 'DBMS',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    },
  });
  await prisma.assignment.create({
    data: {
      facultyId: demoFaculty.facultyId,
      classId: cseClass.id,
      subjectId: cseSubs[4].id,
      title: 'AI Trend Analysis Report',
      description: 'Analyze CGPA trends using the CampusOne AI dashboard.',
      subject: 'AI Fundamentals',
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    },
  });
  await prisma.assignmentSubmission.create({
    data: { assignmentId: a1.id, studentId: demoStudent.studentId, status: 'submitted', submittedAt: new Date() },
  });

  await prisma.notification.createMany({
    data: [
      { title: 'Mid Semester Exams Schedule', body: 'Mid semester exams begin next Monday. Check Results for hall tickets.', senderId: adminUser.id, targetRole: 'student', priority: 'important' },
      { title: 'DBMS Assignment Uploaded', body: 'New assignment on ER diagrams has been posted. Due in 7 days.', senderId: facultyRecords[0].userId, targetRole: 'student' },
      { title: 'E2 Sem1 Results Published', body: 'Semester results for E2 Sem1 are now available.', senderId: adminUser.id, targetRole: 'student', priority: 'important' },
      { title: 'Faculty meeting', body: 'Department meeting on Friday at 4 PM.', senderId: adminUser.id, targetRole: 'faculty' },
    ],
  });

  await prisma.outpass.create({
    data: {
      studentId: demoStudent.studentId,
      facultyId: demoFaculty.facultyId,
      reason: 'Medical appointment at city hospital',
      reasonType: 'medical',
      fromDate: new Date().toISOString().slice(0, 10),
      toDate: new Date().toISOString().slice(0, 10),
      destination: 'City hospital',
      outTime: '16:00',
      returnTime: '19:00',
      status: 'pending',
    },
  });

  await prisma.certificate.create({
    data: {
      studentId: demoStudent.studentId,
      type: 'Bonafide',
      purpose: 'Bank education loan documentation',
      status: 'pending',
    },
  });

  await prisma.$executeRawUnsafe(`
    UPDATE students s
    SET cgpa = sub.avg
    FROM (
      SELECT student_id, ROUND(AVG(gpa)::numeric, 2)::float AS avg
      FROM semester_cgpa
      GROUP BY student_id
    ) sub
    WHERE s.student_id = sub.student_id
  `);

  console.log('Seed complete');
  console.log('  Student: student@campusone.demo / Student@123');
  console.log('  Faculty: faculty@campusone.demo / Faculty@123');
  console.log('  Admin:   admin@campusone.demo / Admin@123');
  console.log(`  Departments: ${DEPTS.length}, Faculty: ${facultyRecords.length}, Students: ${students.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
