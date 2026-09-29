import { prisma } from '../config/prisma.js';
import {
  getStudentProfile,
  serializeAttendance,
  serializeResult,
  gradeFor,
  gradePointsFor,
  refreshStudentCgpa,
} from '../services/mappers.js';
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
  const student = await getStudentProfile(req.user.id);
  const { year_level, semester, type } = req.query;
  const rawSemester = String(semester || '');
  const normalizedSemester = String(semester || '').replace(/^Sem/i, '');
  const semesterValues = [...new Set([rawSemester, normalizedSemester].filter(Boolean))];
  if (type !== 'mid') {
    const simulatedRows = await prisma.result.findMany({
      where: {
        studentId: student.student_id,
        ...(year_level ? { yearLevel: year_level } : {}),
        ...(semesterValues.length ? { semester: { in: semesterValues } } : {}),
        type: 'sem', id: { startsWith: 'sim_' },
      },
      orderBy: { subject: 'asc' },
    });
    if (simulatedRows.length) return res.json(simulatedRows.map(serializeResult));
    const courseRecords = await prisma.studentCourseRecord.findMany({
      where: {
        studentId: student.student_id,
        ...(normalizedSemester ? { semester: normalizedSemester } : {}),
      },
      include: { subject: true },
      orderBy: [{ semester: 'asc' }, { subject: { name: 'asc' } }],
    });
    if (courseRecords.length) {
      const level = `E${student.year || 1}`;
      if (year_level && year_level !== level) return res.json([]);
      return res.json(courseRecords.map((row) => ({
        id: row.id,
        student_id: row.studentId,
        subject_id: row.subjectId,
        year_level: level,
        semester: row.semester,
        type: 'sem',
        subject: row.subject.name,
        course_code: row.subject.code,
        marks: row.marks,
        max_marks: null,
        grade: row.grade,
        grade_points: row.gradePoint,
        credit_points: row.creditPoints,
        credits: row.credits,
        result_status: row.resultStatus,
        curriculum_scope: row.curriculumScope,
        source_status: row.sourceStatus,
        academic_year: row.academicYear,
      })));
    }
  }
  const rows = await prisma.result.findMany({
    where: {
      studentId: student.student_id,
      ...(year_level ? { yearLevel: year_level } : {}),
      ...(semesterValues.length ? { semester: { in: semesterValues } } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: { subject: 'asc' },
  });
  res.json(rows.map(serializeResult));
}

export async function aiResults(req, res) {
  const student = await getStudentProfile(req.user.id);
  const cgpaRows = await prisma.semesterCgpa.findMany({
    where: { studentId: student.student_id },
    orderBy: [{ yearLevel: 'asc' }, { semester: 'asc' }],
  });
  let trend = cgpaRows.map((r) => ({ label: `${r.yearLevel} ${r.semester}`, gpa: Math.round(r.gpa * 100) / 100 }));
  if (!trend.length) {
    const grouped = await prisma.result.groupBy({
      by: ['yearLevel', 'semester'],
      where: { studentId: student.student_id, type: 'sem' },
      _avg: { marks: true, maxMarks: true },
    });
    trend = grouped
      .sort((a, b) => `${a.yearLevel}${a.semester}`.localeCompare(`${b.yearLevel}${b.semester}`))
      .map((r) => ({
        label: `${r.yearLevel} ${r.semester}`,
        gpa: Math.round(((r._avg.marks || 0) / (r._avg.maxMarks || 100)) * 10 * 100) / 100,
      }));
  }
  const simulated = cgpaRows.some((row) => row.sourceStatus === 'SYNTHETIC RANDOM SIMULATION');
  const subjectGroups = await prisma.result.groupBy({
    by: ['subject'],
    where: { studentId: student.student_id, type: 'sem', ...(simulated ? { id: { startsWith: 'sim_' } } : {}) },
    _avg: { marks: true, maxMarks: true },
  });
  const subjects = subjectGroups
    .map((s) => ({
      subject: s.subject,
      percentage: Math.round(((s._avg.marks || 0) / (s._avg.maxMarks || 100)) * 1000) / 10,
    }))
    .sort((a, b) => b.percentage - a.percentage);
  res.json(buildInsights(student, trend, subjects));
}

export async function getAttendance(req, res) {
  if (req.user.role === 'student') {
    const student = await getStudentProfile(req.user.id);
    const rows = await prisma.attendance.findMany({
      where: { studentId: student.student_id },
      orderBy: { date: 'desc' },
    });
    const bySubject = {};
    const byDate = {};
    rows.forEach((r) => {
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
    return res.json({ records: rows.slice(0, 50).map(serializeAttendance), summary, overall, trend });
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
  const grouped = await prisma.attendance.groupBy({
    by: ['subject', 'status'],
    where: { studentId: student.student_id },
    _count: true,
  });
  const map = {};
  grouped.forEach((g) => {
    const n = typeof g._count === 'number' ? g._count : g._count?._all || 0;
    if (!map[g.subject]) map[g.subject] = { present: 0, total: 0 };
    map[g.subject].total += n;
    if (g.status === 'present') map[g.subject].present += n;
  });
  const summary = Object.entries(map).map(([subject, v]) => ({
    subject,
    percentage: Math.round((v.present / v.total) * 1000) / 10,
  }));
  const atRisk = summary.filter((s) => s.percentage < 75);
  const insight = atRisk.length === 0
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
  if (!targetStudent || !legacyAssignments.some((row) => row.classId === targetStudent.classId)) return res.status(404).json({ error: 'Student is not in one of your assigned classes for this subject.' });
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
