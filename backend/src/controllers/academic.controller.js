import { prisma } from '../config/prisma.js';
import {
  getStudentProfile,
  mapStudent,
  serializeAttendance,
  serializeResult,
  gradeFor,
  gradePointsFor,
  refreshStudentCgpa,
} from '../services/mappers.js';
import {
  getStudentAcademicLevel,
  isAcademicTermAuthorized,
  buildAuthorizedResultWhere,
  calculateAuthorizedStudentCgpa,
  filterAuthorizedAttendance,
  parseYearLevel,
} from '../services/academic-auth.js';
import { localISODate } from '../services/dates.js';

function buildInsights(student, trend, subjects) {
  const avg = trend.length ? trend.reduce((a, b) => a + b.gpa, 0) / trend.length : 0;
  const last = trend[trend.length - 1]?.gpa || 0;
  const prev = trend[trend.length - 2]?.gpa || last;
  const delta = Math.round((last - prev) * 100) / 100;
  const weakest = [...subjects].sort((a, b) => a.percentage - b.percentage).slice(0, 2);
  const strongest = [...subjects].sort((a, b) => b.percentage - a.percentage).slice(0, 2);
  const insights = [];
  if (trend.length >= 3 && trend.slice(-3).every((t, i, arr) => i === 0 || t.gpa >= arr[i - 1].gpa)) {
    insights.push('Your CGPA has improved consistently over the last three semesters.');
  } else if (delta > 0) {
    insights.push(`Your latest semester GPA rose by ${delta} points compared with the previous term.`);
  } else if (delta < 0) {
    insights.push(`Your latest semester GPA declined by ${Math.abs(delta)} points. Review weaker subjects early.`);
  }
  if (strongest[0]) insights.push(`Strongest subject: ${strongest[0].subject} (${strongest[0].percentage}%).`);
  if (weakest[0] && weakest[0].percentage < 75) {
    insights.push(`Focus extra revision on ${weakest.map((w) => w.subject).join(' and ')}.`);
  }
  const insight = insights.join(' ') || (avg >= 8.5
    ? 'Excellent academic trajectory. Maintain consistency and consider advanced electives.'
    : avg >= 7
      ? 'Solid performance with room to strengthen mid-semester scores for a higher CGPA.'
      : 'Focus on weaker subjects early. Attend labs regularly and use faculty office hours.');
  const recommendations = [];
  if (weakest[0]) recommendations.push(`Schedule weekly practice for ${weakest[0].subject}.`);
  if (avg < 8) recommendations.push('Use faculty office hours before the next mid assessment.');
  recommendations.push('Keep attendance above 75% in every subject to stay exam-eligible.');
  return {
    cgpa: student.cgpa,
    trend,
    subjects,
    insight,
    insights,
    recommendations,
    prediction: Math.min(10, Math.round((avg + Math.max(delta, 0) * 0.3 + 0.1) * 100) / 100),
    delta,
  };
}

export async function listResults(req, res) {
  // 1. Authenticated student is the sole source of authorization
  const student = await getStudentProfile(req.user.id);
  const authLevel = getStudentAcademicLevel(student);

  const { year_level, semester, type } = req.query;

  // 2. Build strictly authorized Prisma where conditions
  const where = buildAuthorizedResultWhere(authLevel, { year_level, semester, type });
  if (!where) {
    // Requested term is in the future or outside authorized boundary -> strictly blocked
    return res.json([]);
  }

  if (type !== 'mid') {
    // 3. Simulated results path (strictly filtered by authorized where)
    const simulatedRows = await prisma.result.findMany({
      where: {
        ...where,
        type: 'sem',
        id: { startsWith: 'sim_' },
      },
      orderBy: { subject: 'asc' },
    });
    if (simulatedRows.length) return res.json(simulatedRows.map(serializeResult));

    // 4. Try studentCourseRecord with strict academic authorization filtering
    const courseRecords = await prisma.studentCourseRecord.findMany({
      where: { studentId: student.student_id },
      include: { subject: { include: { offerings: true } } },
      orderBy: [{ semester: 'asc' }, { subject: { name: 'asc' } }],
    });

    const authorizedCourseRecords = courseRecords.filter((row) => {
      const entryLevel = row.subject?.entryLevel || row.subject?.offerings?.[0]?.entryLevel || `E${student.year}`;
      const sem = row.semester;
      if (!isAcademicTermAuthorized(authLevel, entryLevel, sem)) return false;

      if (year_level != null) {
        const reqY = parseYearLevel(year_level);
        const rowY = parseYearLevel(entryLevel);
        if (reqY !== rowY) return false;
      }
      if (semester != null && String(semester).trim() !== '') {
        const reqDigits = String(semester).replace(/\D/g, '');
        const rowDigits = String(sem).replace(/\D/g, '');
        if (reqDigits && rowDigits && reqDigits !== rowDigits) return false;
      }
      return true;
    });

    if (authorizedCourseRecords.length) {
      return res.json(authorizedCourseRecords.map((row) => {
        const level = row.subject?.entryLevel || `E${student.year || 1}`;
        return {
          id: row.id,
          student_id: row.studentId,
          subject_id: row.subjectId,
          year_level: level,
          semester: row.semester,
          type: 'sem',
          subject: row.subject?.name,
          course_code: row.subject?.code,
          marks: row.marks,
          max_marks: 100,
          grade: (row.marks != null && Number(row.marks) >= 90) || row.grade === 'EX' ? 'Ex' : row.grade,
          grade_points: row.gradePoint,
          credit_points: row.creditPoints,
          credits: row.credits,
          result_status: row.resultStatus,
          curriculum_scope: row.curriculumScope,
          source_status: row.sourceStatus,
          academic_year: row.academicYear,
        };
      }));
    }
  }

  // 5. Fall back to result table (mid marks, or non-simulated sem marks)
  const rows = await prisma.result.findMany({
    where,
    orderBy: { subject: 'asc' },
  });
  res.json(rows.map(serializeResult));
}

export async function aiResults(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { student: true },
  });
  if (!user?.student) return res.status(404).json({ error: 'Student profile not found' });
  const authLevel = getStudentAcademicLevel(user.student);

  // 1. Calculate authorized CGPA and trend strictly within authorized academic boundary (single execution)
  const { cgpa, trend } = await calculateAuthorizedStudentCgpa(user.student.studentId, authLevel);
  const student = mapStudent(user, user.student, cgpa);

  // 2. Aggregate subjects strictly within authorized results
  const resultWhere = buildAuthorizedResultWhere(authLevel, { type: 'sem' });
  let subjects = [];

  if (resultWhere) {
    const subjectGroups = await prisma.result.groupBy({
      by: ['subject'],
      where: resultWhere,
      _avg: { marks: true, maxMarks: true },
    });
    subjects = subjectGroups.map((s) => ({
      subject: s.subject,
      percentage: Math.round(((s._avg.marks || 0) / (s._avg.maxMarks || 100)) * 1000) / 10,
    })).sort((a, b) => b.percentage - a.percentage);
  }

  // Fallback to authorized course records if no result groups
  if (!subjects.length) {
    const courseRecords = await prisma.studentCourseRecord.findMany({
      where: { studentId: student.student_id },
      include: { subject: { include: { offerings: true } } },
    });
    const authorizedCr = courseRecords.filter((row) => {
      const entryLevel = row.subject?.entryLevel || row.subject?.offerings?.[0]?.entryLevel || `E${student.year}`;
      return isAcademicTermAuthorized(authLevel, entryLevel, row.semester);
    });

    const subMap = new Map();
    for (const r of authorizedCr) {
      const name = r.subject?.name || r.subjectId;
      if (!subMap.has(name)) subMap.set(name, { total: 0, count: 0 });
      const item = subMap.get(name);
      item.total += Number(r.marks || 0);
      item.count += 1;
    }
    subjects = [...subMap.entries()].map(([name, data]) => ({
      subject: name,
      percentage: Math.round((data.total / (data.count || 1)) * 10) / 10,
    })).sort((a, b) => b.percentage - a.percentage);
  }

  res.json(buildInsights({ ...student, cgpa }, trend, subjects));
}

export async function getAttendance(req, res) {
  if (req.user.role === 'student') {
    const student = await getStudentProfile(req.user.id);
    const authLevel = getStudentAcademicLevel(student);
    const rows = await prisma.attendance.findMany({
      where: { studentId: student.student_id },
      include: {
        subjectRel: {
          include: { offerings: true },
        },
      },
      orderBy: { date: 'desc' },
    });
    const authorizedRows = filterAuthorizedAttendance(rows, authLevel);

    if (!authorizedRows.length) {
      return res.json({
        records: [],
        summary: [],
        overall: 0,
        status: 'NOT_AVAILABLE',
        trend: [],
      });
    }

    const bySubject = {};
    const byDate = {};
    authorizedRows.forEach((r) => {
      if (!bySubject[r.subject]) bySubject[r.subject] = { present: 0, total: 0 };
      bySubject[r.subject].total++;
      if (r.status === 'present') bySubject[r.subject].present++;
      if (!byDate[r.date]) byDate[r.date] = { present: 0, total: 0 };
      byDate[r.date].total++;
      if (r.status === 'present') byDate[r.date].present++;
    });
    const summary = Object.entries(bySubject).map(([subject, v]) => ({
      subject,
      present: v.present,
      missed: v.total - v.present,
      total: v.total,
      percentage: Math.round((v.present / v.total) * 1000) / 10,
      status: v.present / v.total >= 0.75 ? 'Safe' : 'At risk',
    }));
    const overall = summary.length
      ? Math.round((summary.reduce((a, s) => a + s.percentage, 0) / summary.length) * 10) / 10
      : 0;
    const trend = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, v]) => ({ date, percentage: Math.round((v.present / v.total) * 1000) / 10 }));
    return res.json({ records: authorizedRows.slice(0, 50).map(serializeAttendance), summary, overall, trend });
  }
  if (req.user.role === 'faculty') {
    const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
    const date = req.query.date || localISODate();
    const rows = await prisma.attendance.findMany({
      where: {
        facultyId: faculty.facultyId,
        date,
        ...(req.query.subject ? { subject: req.query.subject } : {}),
      },
      include: { student: { include: { user: true } } },
    });
    return res.json(rows.map(serializeAttendance));
  }
  res.json([]);
}

export async function saveAttendance(req, res) {
  const today = localISODate();
  const { subject, class_type, records, date } = req.body;
  if (date && date !== today) {
    return res.status(400).json({ error: 'Attendance date is locked to the current server date' });
  }
  if (!subject || !class_type || !Array.isArray(records)) {
    return res.status(400).json({ error: 'subject, class_type and records required' });
  }
  const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
  if (!faculty) return res.status(403).json({ error: 'Faculty profile is required' });
  let subjectRow = await prisma.subject.findFirst({ where: { name: subject, departmentId: faculty.departmentId } });
  if (!subjectRow) return res.status(404).json({ error: 'Subject is not in the campus catalog' });
  const assignment = await prisma.facultyCourseAssignment.findFirst({
    where: { facultyId: faculty.facultyId, subjectId: subjectRow.id, status: 'ACTIVE' },
  });
  const legacyAssignments = await prisma.facultySubject.findMany({
    where: { facultyId: faculty.facultyId, subjectId: subjectRow.id },
    select: { classId: true },
  });
  if (!assignment && !legacyAssignments.length) return res.status(403).json({ error: 'You are not assigned to this subject' });
  const assignedClassIds = legacyAssignments.map((row) => row.classId);
  const validIds = new Set(
    (await prisma.student.findMany({
      where: { studentId: { in: records.map((r) => r.student_id).filter(Boolean) }, classId: { in: assignedClassIds } },
      select: { studentId: true },
    })).map((s) => s.studentId)
  );
  for (const r of records) {
    if (!validIds.has(r.student_id) || !['present', 'absent'].includes(r.status)) continue;
    await prisma.attendance.upsert({
      where: {
        studentId_subjectId_date_classType: {
          studentId: r.student_id,
          subjectId: subjectRow.id,
          date: today,
          classType: class_type,
        },
      },
      update: { status: r.status, facultyId: faculty.facultyId, subject },
      create: {
        studentId: r.student_id,
        subjectId: subjectRow.id,
        facultyId: faculty.facultyId,
        subject,
        classType: class_type,
        date: today,
        status: r.status,
      },
    });
  }
  res.json({ message: 'Attendance saved for today', date: today });
}

export async function aiAttendance(req, res) {
  const student = await getStudentProfile(req.user.id);
  const authLevel = getStudentAcademicLevel(student);
  const rows = await prisma.attendance.findMany({
    where: { studentId: student.student_id },
    include: {
      subjectRel: {
        include: { offerings: true },
      },
    },
  });
  const authorizedRows = filterAuthorizedAttendance(rows, authLevel);

  const map = {};
  authorizedRows.forEach((r) => {
    if (!map[r.subject]) map[r.subject] = { present: 0, total: 0 };
    map[r.subject].total += 1;
    if (r.status === 'present') map[r.subject].present += 1;
  });
  const summary = Object.entries(map).map(([subject, v]) => ({
    subject,
    percentage: Math.round((v.present / v.total) * 1000) / 10,
  }));
  const atRisk = summary.filter((s) => s.percentage < 75);
  const insight = summary.length === 0
    ? 'No attendance records available for current semester.'
    : atRisk.length === 0
      ? 'Attendance is healthy across subjects. Keep this consistency.'
      : `Attention needed in: ${atRisk.map((l) => l.subject).join(', ')}. Aim for 75%+ to stay eligible for exams.`;
  res.json({ summary, insight, atRisk });
}

export async function saveMidMarks(req, res) {
  const { student_id, year_level, semester, subject, marks, max_marks = 30 } = req.body;
  if (marks == null || Number(marks) < 0 || Number(marks) > Number(max_marks)) {
    return res.status(400).json({ error: `Marks must be between 0 and ${max_marks}` });
  }
  const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
  if (!faculty) return res.status(403).json({ error: 'Faculty profile is required' });
  const subjectRow = await prisma.subject.findFirst({ where: { name: subject, departmentId: faculty.departmentId } });
  if (!subjectRow) return res.status(404).json({ error: 'Subject is not in the campus catalog' });
  const assignment = await prisma.facultyCourseAssignment.findFirst({
    where: { facultyId: faculty.facultyId, subjectId: subjectRow.id, status: 'ACTIVE' },
  });
  const legacyAssignments = await prisma.facultySubject.findMany({
    where: { facultyId: faculty.facultyId, subjectId: subjectRow.id },
    select: { classId: true },
  });
  if (!assignment && !legacyAssignments.length) return res.status(403).json({ error: 'You are not assigned to this subject' });
  const targetStudent = await prisma.student.findUnique({ where: { studentId: student_id } });
  const isClassMatch = legacyAssignments.some((row) => row.classId === targetStudent?.classId);
  const isDeptMatch = targetStudent?.departmentId === faculty.departmentId || targetStudent?.deptCode === faculty.deptCode;
  if (!targetStudent || (!isClassMatch && !isDeptMatch && !assignment)) {
    return res.status(404).json({ error: 'Student is not in one of your assigned classes or department for this subject.' });
  }
  const existing = await prisma.result.findFirst({
    where: { studentId: student_id, yearLevel: year_level, semester, type: 'mid', subject },
  });
  const data = {
    marks: Number(marks),
    maxMarks: Number(max_marks),
    grade: gradeFor(marks, max_marks),
    gradePoints: gradePointsFor(marks, max_marks),
  };
  if (existing) await prisma.result.update({ where: { id: existing.id }, data });
  else {
    await prisma.result.create({
      data: {
        ...data,
        studentId: student_id,
        subjectId: subjectRow.id,
        yearLevel: year_level,
        semester,
        type: 'mid',
        subject,
      },
    });
  }
  await refreshStudentCgpa(student_id);
  if (targetStudent) {
    await prisma.notification.create({
      data: {
        title: 'Marks updated',
        body: `${subject} ${year_level} ${semester} mid marks have been published.`,
        senderId: req.user.id,
        targetRole: 'student',
        targetId: targetStudent.userId,
        priority: 'important',
      },
    });
  }
  res.json({ message: 'Mid marks saved' });
}
