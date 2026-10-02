import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { prisma } from '../src/config/prisma.js';

const SIMULATED = 'SYNTHETIC RANDOM SIMULATION';
const chunk = (rows, size = 1000) => Array.from({ length: Math.ceil(rows.length / size) }, (_, i) => rows.slice(i * size, (i + 1) * size));
const key = (...values) => `sim_${createHash('sha1').update(values.join('|')).digest('hex').slice(0, 32)}`;
const integer = (seed, min, max) => min + (parseInt(createHash('sha256').update(seed).digest('hex').slice(0, 8), 16) % (max - min + 1));
const grade = (points) => points >= 9.0 ? 'Ex' : points >= 8.0 ? 'A' : points >= 7.5 ? 'B+' : points >= 6.5 ? 'B' : points >= 5.5 ? 'C' : 'D';
const room = (branch, section, period) => `${branch}-${section}-${100 + period}`;
const slots = ['09:00-10:00', '10:00-11:00', '11:15-12:15', '12:15-13:15', '14:00-15:00', '15:00-16:00'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function dateForSession(weekdayIndex) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - 1);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() - 1);
  let remaining = weekdayIndex;
  while (remaining > 0) {
    date.setDate(date.getDate() - 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) remaining -= 1;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function createRows(model, rows, size = 1000) {
  for (const batch of chunk(rows, size)) {
    if (batch.length) await prisma[model].createMany({ data: batch, skipDuplicates: true });
  }
}

async function applyPasswords(accounts) {
  const values = [];
  for (let i = 0; i < accounts.length; i += 40) {
    values.push(...await Promise.all(accounts.slice(i, i + 40).map(async ({ userId, campusId }) => [
      userId,
      await bcrypt.hash(`${campusId}@123`, 10),
    ])));
  }
  for (const batch of chunk(values, 500)) {
    const params = batch.flat();
    const tuples = batch.map((_, i) => `($${i * 2 + 1}::text,$${i * 2 + 2}::text)`).join(',');
    await prisma.$executeRawUnsafe(
      `UPDATE users AS u SET password = v.password FROM (VALUES ${tuples}) AS v(id,password) WHERE u.id = v.id`,
      ...params,
    );
  }
}

async function main() {
  const students = await prisma.student.findMany({
    where: { sourceStatus: { contains: 'SYNTHETIC', mode: 'insensitive' }, active: true },
    include: { branch: true, user: { select: { id: true } } },
    orderBy: { studentId: 'asc' },
  });
  const faculty = await prisma.faculty.findMany({
    where: { active: true }, include: { user: { select: { id: true, name: true } } }, orderBy: { facultyId: 'asc' },
  });
  if (!students.length) throw new Error('No active synthetic source students are present.');

  const studentsByBranch = new Map();
  for (const student of students) {
    const branchCode = student.branch?.code;
    if (!branchCode) throw new Error(`Student ${student.studentId} has no branch.`);
    const k = `${branchCode}|${student.year}`;
    if (!studentsByBranch.has(k)) studentsByBranch.set(k, []);
    studentsByBranch.get(k).push(student);
  }

  const classGroups = [];
  for (const [groupKey, members] of studentsByBranch) {
    const [branchCode, yearString] = groupKey.split('|');
    const year = Number(yearString);
    const fourParallelSections = ['CS', 'EC'].includes(branchCode);
    const capacity = fourParallelSections ? 90 : 120;
    const sectionCount = fourParallelSections ? 4 : 1;
    if (members.length !== capacity * sectionCount) {
      throw new Error(`${branchCode} E${year} has ${members.length} students; ${sectionCount} section(s) of ${capacity} require ${capacity * sectionCount}.`);
    }
    const courseId = members[0].courseId;
    const course = await prisma.course.findUnique({ where: { id: courseId }, include: { department: true } });
    let batch = await prisma.batch.findFirst({ where: { courseId, yearLevel: `E${year}` } });
    if (!batch) batch = await prisma.batch.create({ data: { courseId, yearLevel: `E${year}`, name: `E${year}-${branchCode}` } });
    for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex += 1) {
      const section = `${branchCode}${fourParallelSections ? sectionIndex + 1 : year}`;
      const classroom = await prisma.class.upsert({
        where: { batchId_section: { batchId: batch.id, section } },
        update: {}, create: { batchId: batch.id, section },
      });
      const roster = members.slice(sectionIndex * capacity, (sectionIndex + 1) * capacity);
      for (const ids of chunk(roster.map((s) => s.studentId), 500)) {
        await prisma.student.updateMany({ where: { studentId: { in: ids } }, data: { section, classId: classroom.id, courseId, departmentId: course.departmentId, deptCode: branchCode, courseName: course.name } });
      }
      classGroups.push({ branchCode, year, section, classroom, roster, course });
    }
  }

  const branchCodes = [...new Set(classGroups.map((g) => g.branchCode))];
  const branchSubjects = new Map();
  const facultyByBranch = new Map();
  for (const branchCode of branchCodes) {
    branchSubjects.set(branchCode, await prisma.subject.findMany({
      where: { department: { code: branchCode } }, orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true },
    }));
    facultyByBranch.set(branchCode, faculty.filter((f) => f.deptCode === branchCode));
    if (!branchSubjects.get(branchCode)?.length) throw new Error(`No subjects exist for ${branchCode}.`);
    if (!facultyByBranch.get(branchCode)?.length) throw new Error(`No faculty exist for ${branchCode}.`);
  }

  const facultySubjectRows = [];
  const teachingRows = [];
  const assignments = [];
  const timetables = [];
  const studentClassSubjects = new Map();
  const subjectsByFaculty = new Map(faculty.map((f) => [f.facultyId, new Map()]));
  const facultySlotCount = new Map(faculty.map((f) => [f.facultyId, 0]));

  for (const group of classGroups) {
    const catalog = branchSubjects.get(group.branchCode);
    const start = ((group.year - 1) * 6) % catalog.length;
    const subjects = Array.from({ length: Math.min(6, catalog.length) }, (_, i) => catalog[(start + i) % catalog.length]);
    studentClassSubjects.set(group.classroom.id, subjects);
    const teachers = facultyByBranch.get(group.branchCode);
    const classTeacherEntries = [];
    for (const [subjectIndex, subject] of subjects.entries()) {
      const teacher = teachers[(group.year * 100 + Number(group.section.slice(-1)) * 10 + subjectIndex) % teachers.length];
      facultySubjectRows.push({ facultyId: teacher.facultyId, subjectId: subject.id, classId: group.classroom.id });
      classTeacherEntries.push({ subject, teacher });
      if (!subjectsByFaculty.has(teacher.facultyId)) subjectsByFaculty.set(teacher.facultyId, new Map());
      subjectsByFaculty.get(teacher.facultyId).set(subject.id, subject.name);
      const teacherSlot = facultySlotCount.get(teacher.facultyId) || 0;
      facultySlotCount.set(teacher.facultyId, teacherSlot + 1);
      const day = days[teacherSlot % days.length];
      const period = Math.floor(teacherSlot / days.length) % slots.length + 1;
      teachingRows.push({ group, subject, teacher, day, period });
      for (const semester of ['Sem1', 'Sem2']) {
        teachingRows.push({ courseAssignment: { facultyId: teacher.facultyId, subjectId: subject.id, academicYear: `${2022 + group.year}-${String(2023 + group.year).toString().slice(-2)}`, semester: semester.slice(-1), role: 'INSTRUCTOR', status: 'ACTIVE', sourceStatus: SIMULATED } });
      }
    }

    const ownerId = `${group.branchCode}-${group.section}-E${group.year}`;
    for (const [periodIndex, subject] of subjects.entries()) {
      for (const day of days) {
        timetables.push({
          id: key('student', ownerId, day, periodIndex + 1), classId: group.classroom.id, roleOwner: 'student', ownerId,
          day, period: periodIndex + 1, subject: subject.name, subjectId: subject.id,
          room: room(group.branchCode, group.section, periodIndex + 1), timeSlot: slots[periodIndex], classType: periodIndex >= 4 ? 'lab' : 'lecture',
        });
      }
    }

    for (const [index, entry] of classTeacherEntries.entries()) {
      const due = new Date(); due.setDate(due.getDate() + 7 + index * 5);
      const dueDate = due.toISOString().slice(0, 10);
      assignments.push({
        id: key('assignment', group.classroom.id, entry.subject.id), facultyId: entry.teacher.facultyId,
        classId: group.classroom.id, subjectId: entry.subject.id,
        title: `${entry.subject.name} practice`, description: `Synthetic practice assignment for ${group.section}, E${group.year}.`,
        subject: entry.subject.name, dueDate, fileUrl: null,
      });
    }
  }

  await createRows('facultySubject', facultySubjectRows);
  await createRows('facultyCourseAssignment', teachingRows.filter((r) => r.courseAssignment).map((r) => r.courseAssignment));
  for (const group of classGroups) {
    const ownerId = `${group.branchCode}-${group.section}-E${group.year}`;
    for (const row of timetables.filter((item) => item.ownerId === ownerId)) {
      const linked = teachingRows.find((t) => t.group?.classroom.id === group.classroom.id && t.subject.name === row.subject);
      row.facultyId = linked?.teacher.facultyId || null;
      row.facultyName = linked?.teacher ? faculty.find((f) => f.facultyId === linked.teacher.facultyId)?.user.name || null : null;
    }
  }
  await createRows('timetable', timetables);
  const facultyTimetableRows = teachingRows.filter((r) => r.group && r.subject && r.teacher).map((r) => {
    const facultyRow = faculty.find((f) => f.facultyId === r.teacher.facultyId);
    return {
      id: key('faculty', facultyRow.facultyId, r.group.classroom.id, r.subject.id),
      classId: r.group.classroom.id, facultyId: facultyRow.facultyId, subjectId: r.subject.id,
      roleOwner: 'faculty', ownerId: facultyRow.facultyId, day: r.day, period: r.period,
      subject: r.subject.name, room: room(r.group.branchCode, r.group.section, r.period),
      timeSlot: slots[(r.period - 1) % slots.length], facultyName: facultyRow.user.name,
      classType: 'lecture',
    };
  });
  await createRows('timetable', facultyTimetableRows);
  await createRows('assignment', assignments);

  const attendanceRows = [];
  const resultRows = [];
  const cgpaRows = [];
  const studentCgpa = [];
  const attendanceDates = Array.from({ length: 12 }, (_, i) => dateForSession(11 - i));
  for (const group of classGroups) {
    const subjects = studentClassSubjects.get(group.classroom.id);
    const classTeachers = teachingRows.filter((r) => r.group?.classroom.id === group.classroom.id);
    for (const student of group.roster) {
      for (const [subjectIndex, subject] of subjects.entries()) {
        const teacher = classTeachers[subjectIndex]?.teacher;
        if (teacher) {
          for (const [sessionIndex, date] of attendanceDates.entries()) {
            const present = integer(`${student.studentId}|${subject.id}|att|${sessionIndex}`, 0, 99) < 82;
            attendanceRows.push({
              studentId: student.studentId, subjectId: subject.id, facultyId: teacher.facultyId,
              subject: subject.name, classType: subjectIndex >= 4 ? 'lab' : 'lecture', date,
              status: present ? 'present' : 'absent',
            });
          }
        }
      }

      let gradePointTotal = 0;
      let gradePointCount = 0;
      for (let year = 1; year <= student.year; year += 1) {
        for (let semesterIndex = 0; semesterIndex < 2; semesterIndex += 1) {
          const semester = `Sem${semesterIndex + 1}`;
          const academicYear = `${2022 + year}-${String(2023 + year).slice(-2)}`;
          const catalog = branchSubjects.get(group.branchCode);
          const start = ((year - 1) * 6 + semesterIndex * 3) % catalog.length;
          const semesterSubjects = Array.from({ length: Math.min(6, catalog.length) }, (_, i) => catalog[(start + i) % catalog.length]);
          let termTotal = 0;
          for (const [subjectIndex, subject] of semesterSubjects.entries()) {
            const marks = integer(`${student.studentId}|${subject.id}|${year}|${semester}|sem`, 55, 99);
            const points = Math.min(10, Math.max(4, Math.round((marks / 10) * 10) / 10));
            gradePointTotal += points;
            gradePointCount += 1;
            termTotal += points;
            resultRows.push({
              id: key('result-sem', student.studentId, year, semester, subject.id), studentId: student.studentId,
              subjectId: subject.id, yearLevel: `E${year}`, semester, type: 'sem', subject: subject.name,
              marks, maxMarks: 100, grade: grade(points), gradePoints: points,
            });
            const midMarks = integer(`${student.studentId}|${subject.id}|${year}|${semester}|mid`, 16, 30);
            const midPoints = Math.min(10, Math.max(4, Math.round((midMarks / 30) * 10 * 10) / 10));
            resultRows.push({
              id: key('result-mid', student.studentId, year, semester, subject.id), studentId: student.studentId,
              subjectId: subject.id, yearLevel: `E${year}`, semester, type: 'mid', subject: subject.name,
              marks: midMarks, maxMarks: 30, grade: grade(midPoints), gradePoints: midPoints,
            });
          }
          cgpaRows.push({
            studentId: student.studentId, yearLevel: `E${year}`, semester,
            gpa: Number((gradePointTotal / gradePointCount).toFixed(2)), academicYear,
            totalCredits: 20, earnedCredits: 20, totalCreditPoints: Number(termTotal.toFixed(2)),
            cumulativeCredits: year * 40 + (semesterIndex + 1) * 20,
            cumulativeCreditPoints: Number((gradePointTotal * 20 / gradePointCount).toFixed(2)),
            academicStatus: 'Synthetic academic record', sourceStatus: SIMULATED,
          });
        }
      }
      studentCgpa.push({ studentId: student.studentId, cgpa: Number((gradePointTotal / gradePointCount).toFixed(2)) });
    }
  }

  await createRows('attendance', attendanceRows, 2500);
  await createRows('result', resultRows, 1500);
  await prisma.semesterCgpa.deleteMany({ where: { studentId: { in: students.map((s) => s.studentId) } } });
  await createRows('semesterCgpa', cgpaRows, 1500);
  for (const batch of chunk(studentCgpa, 500)) {
    const params = batch.flatMap((row) => [row.studentId, row.cgpa]);
    const tuples = batch.map((_, i) => `($${i * 2 + 1}::text,$${i * 2 + 2}::double precision)`).join(',');
    await prisma.$executeRawUnsafe(`UPDATE students AS s SET cgpa = v.cgpa FROM (VALUES ${tuples}) AS v(student_id,cgpa) WHERE s.student_id = v.student_id`, ...params);
  }

  const facultySubjects = await prisma.facultySubject.findMany({ where: { facultyId: { in: faculty.map((f) => f.facultyId) } }, include: { subject: { select: { name: true } } } });
  const subjectNames = new Map(faculty.map((f) => [f.facultyId, new Set()]));
  for (const row of facultySubjects) subjectNames.get(row.facultyId)?.add(row.subject.name);
  for (const [facultyId, names] of subjectNames) {
    await prisma.faculty.update({ where: { facultyId }, data: { subjectsText: [...names].join(', ') } });
  }

  const allStudents = await prisma.student.findMany({ select: { studentId: true, userId: true } });
  const allFaculty = await prisma.faculty.findMany({ select: { facultyId: true, userId: true } });
  const accounts = [
    ...allStudents.map((s) => ({ userId: s.userId, campusId: s.studentId })),
    ...allFaculty.map((f) => ({ userId: f.userId, campusId: f.facultyId })),
  ];
  await applyPasswords(accounts);
  console.log(JSON.stringify({
    status: 'complete', students: students.length, faculty: faculty.length,
    branches: branchCodes, classGroups: classGroups.length,
    classSizing: 'CS/EC: four 90-student sections per year; EE/ME/CE: one 120-student section per year',
    facultySubjectLinks: facultySubjectRows.length, assignments: assignments.length,
    studentTimetableRows: timetables.length, facultyTimetableRows: facultyTimetableRows.length,
    attendanceRows: attendanceRows.length, semesterAndMidResultRows: resultRows.length,
    cgpaHistoryRows: cgpaRows.length, passwords: 'InstitutionalID@123 (bcrypt hashed)',
  }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
