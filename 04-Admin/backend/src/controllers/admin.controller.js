import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { getStudentProfile } from '../services/mappers.js';

export async function listStudents(req, res) {
  const { dept, section } = req.query;
  const rows = await prisma.student.findMany({
    where: {
      ...(dept ? { deptCode: dept } : {}),
      ...(section ? { section } : {}),
    },
    include: { user: true },
    orderBy: { studentId: 'asc' },
  });
  res.json(rows.map((s) => ({
    ...s,
    student_id: s.studentId,
    dorm_no: s.dormNo,
    course: s.courseName,
    dept: s.deptCode,
    parent_name: s.parentName,
    parent_phone: s.parentPhone,
    name: s.user.name,
    email: s.user.email,
    photo: s.user.photo,
  })));
}

export async function adminStudents(req, res) {
  req.query = req.query || {};
  return listStudents(req, res);
}

export async function adminFaculty(req, res) {
  const rows = await prisma.faculty.findMany({
    include: { user: true },
    orderBy: { facultyId: 'asc' },
  });
  res.json(rows.map((f) => ({
    faculty_id: f.facultyId,
    dept: f.deptCode,
    designation: f.designation,
    mobile: f.mobile,
    subjects: f.subjectsText,
    name: f.user.name,
    email: f.user.email,
    photo: f.user.photo,
  })));
}

export async function facultyList(req, res) {
  const rows = await prisma.faculty.findMany({ include: { user: true } });
  res.json(rows.map((f) => ({
    faculty_id: f.facultyId,
    dept: f.deptCode,
    subjects: f.subjectsText,
    name: f.user.name,
  })));
}

export async function createStudent(req, res) {
  const { name, email, student_id, dorm_no, course, year, dept, parent_name, mobile, parent_phone, section } = req.body;
  const department = await prisma.department.findFirst({ where: { OR: [{ code: dept }, { name: dept }] } })
    || await prisma.department.create({ data: { name: dept || 'General', code: (dept || 'GEN').toUpperCase() } });
  const courseRow = await prisma.course.findFirst({ where: { departmentId: department.id } })
    || await prisma.course.create({ data: { name: course || 'B.Tech', code: 'BTECH', departmentId: department.id } });
  const yearLevel = `E${year || 1}`;
  const batch = await prisma.batch.findFirst({ where: { courseId: courseRow.id, yearLevel } })
    || await prisma.batch.create({ data: { name: `${yearLevel}-${department.code}`, yearLevel, courseId: courseRow.id } });
  const classRow = await prisma.class.findFirst({ where: { batchId: batch.id, section: section || 'A' } })
    || await prisma.class.create({ data: { section: section || 'A', batchId: batch.id } });
  const hash = await bcrypt.hash('Student@123', 10);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), password: hash, role: 'student', name },
  });
  await prisma.student.create({
    data: {
      userId: user.id,
      studentId: student_id,
      dormNo: dorm_no,
      year: Number(year || 1),
      parentName: parent_name,
      mobile,
      parentPhone: parent_phone,
      section: section || 'A',
      courseName: course || 'B.Tech',
      deptCode: department.code,
      departmentId: department.id,
      courseId: courseRow.id,
      classId: classRow.id,
    },
  });
  res.json({ message: 'Student created', password: 'Student@123' });
}

export async function createFaculty(req, res) {
  const { name, email, faculty_id, dept, designation, mobile, subjects } = req.body;
  const department = await prisma.department.findFirst({ where: { OR: [{ code: dept }, { name: dept }] } })
    || await prisma.department.create({ data: { name: dept || 'General', code: (dept || 'GEN').toUpperCase() } });
  const hash = await bcrypt.hash('Faculty@123', 10);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), password: hash, role: 'faculty', name },
  });
  await prisma.faculty.create({
    data: {
      userId: user.id,
      facultyId: faculty_id,
      designation: designation || 'Assistant Professor',
      mobile,
      subjectsText: subjects || '',
      deptCode: department.code,
      departmentId: department.id,
    },
  });
  res.json({ message: 'Faculty created', password: 'Faculty@123' });
}

export async function deleteStudent(req, res) {
  const s = await prisma.student.findUnique({ where: { studentId: req.params.studentId } });
  if (!s) return res.status(404).json({ error: 'Not found' });
  await prisma.user.delete({ where: { id: s.userId } });
  res.json({ ok: true });
}

export async function adminStats(_req, res) {
  const [students, faculty, pendingCerts, pendingOut, notifications] = await Promise.all([
    prisma.student.count(),
    prisma.faculty.count(),
    prisma.certificate.count({ where: { status: 'pending' } }),
    prisma.outpass.count({ where: { status: 'pending' } }),
    prisma.notification.count(),
  ]);
  res.json({ students, faculty, pendingCerts, pendingOut, notifications });
}

function countOf(value) {
  if (typeof value === 'number') return value;
  if (value && typeof value._all === 'number') return value._all;
  return 0;
}

export async function adminAnalytics(_req, res) {
  const depts = await prisma.student.groupBy({ by: ['deptCode'], _count: true });
  const att = await prisma.attendance.groupBy({ by: ['status'], _count: true });
  const present = countOf(att.find((a) => a.status === 'present')?._count);
  const total = att.reduce((s, a) => s + countOf(a._count), 0) || 1;
  const outTypes = await prisma.outpass.groupBy({ by: ['reasonType'], _count: true });
  const certs = await prisma.certificate.groupBy({ by: ['status'], _count: true });
  const mappedDepts = depts.map((d) => ({ dept: d.deptCode, c: countOf(d._count) }));
  const topDept = [...mappedDepts].sort((a, b) => b.c - a.c)[0];
  const pendingCerts = countOf(certs.find((c) => c.status === 'pending')?._count);
  const insights = [
    `Campus attendance currently averages ${Math.round((present / total) * 100)}%.`,
  ];
  if (topDept) insights.push(`${topDept.dept} has the largest student cohort (${topDept.c} students).`);
  insights.push(pendingCerts
    ? `${pendingCerts} certificate request(s) are waiting for review.`
    : 'No certificate backlog — all requests have been processed.');
  res.json({
    depts: mappedDepts,
    attendanceRate: Math.round((present / total) * 1000) / 10,
    outTypes: outTypes.map((o) => ({ reason_type: o.reasonType, c: countOf(o._count) })),
    certs: certs.map((c) => ({ status: c.status, c: countOf(c._count) })),
    insights,
  });
}

export async function departments(_req, res) {
  const rows = await prisma.department.findMany({ include: { _count: { select: { students: true, faculty: true } } } });
  res.json(rows);
}

export async function updateProfile(req, res) {
  const { name, mobile, photo, parent_phone, dorm_no } = req.body;
  if (name || photo) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(name ? { name } : {}), ...(photo ? { photo } : {}) },
    });
  }
  if (req.user.role === 'student') {
    await prisma.student.update({
      where: { userId: req.user.id },
      data: {
        ...(mobile ? { mobile } : {}),
        ...(parent_phone ? { parentPhone: parent_phone } : {}),
        ...(dorm_no ? { dormNo: dorm_no } : {}),
      },
    });
  }
  if (req.user.role === 'faculty' && mobile) {
    await prisma.faculty.update({ where: { userId: req.user.id }, data: { mobile } });
  }
  res.json({ message: 'Profile updated' });
}

export async function search(req, res) {
  const q = (req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ results: [] });
  const results = [];
  if (req.user.role === 'student') {
    const assignments = await prisma.assignment.findMany({ take: 50 });
    assignments.forEach((a) => {
      if (`${a.title} ${a.subject}`.toLowerCase().includes(q)) {
        results.push({ type: 'Assignment', title: a.title, to: '/student/assignments' });
      }
    });
    const notifs = await prisma.notification.findMany({
      where: { targetRole: { in: ['student', 'all'] } },
      take: 50,
    });
    notifs.forEach((n) => {
      if (`${n.title} ${n.body}`.toLowerCase().includes(q)) {
        results.push({ type: 'Notification', title: n.title, to: '/student/notifications' });
      }
    });
  } else if (req.user.role === 'faculty') {
    const students = await prisma.student.findMany({ include: { user: true }, take: 80 });
    students.forEach((s) => {
      if (`${s.user.name} ${s.studentId} ${s.deptCode}`.toLowerCase().includes(q)) {
        results.push({ type: 'Student', title: `${s.user.name} · ${s.studentId}`, to: '/faculty/attendance' });
      }
    });
  } else {
    const students = await prisma.student.findMany({ include: { user: true }, take: 80 });
    students.forEach((s) => {
      if (`${s.user.name} ${s.studentId} ${s.user.email}`.toLowerCase().includes(q)) {
        results.push({ type: 'Student', title: `${s.user.name} · ${s.studentId}`, to: '/admin/students' });
      }
    });
    const faculty = await prisma.faculty.findMany({ include: { user: true }, take: 40 });
    faculty.forEach((f) => {
      if (`${f.user.name} ${f.facultyId}`.toLowerCase().includes(q)) {
        results.push({ type: 'Faculty', title: `${f.user.name} · ${f.facultyId}`, to: '/admin/faculty' });
      }
    });
  }
  res.json({ results: results.slice(0, 8) });
}

export async function overview(req, res) {
  if (req.user.role === 'student') {
    const student = await getStudentProfile(req.user.id);
    const [assignments, submitted, pendingOut, notifs] = await Promise.all([
      prisma.assignment.count(),
      prisma.assignmentSubmission.count({ where: { studentId: student.student_id } }),
      prisma.outpass.count({ where: { studentId: student.student_id, status: 'pending' } }),
      prisma.notification.count({
        where: { OR: [{ targetRole: { in: ['student', 'all'] } }, { targetId: req.user.id }] },
      }),
    ]);
    return res.json({
      pendingAssignments: Math.max(assignments - submitted, 0),
      pendingOutpasses: pendingOut,
      notifications: notifs,
      student,
    });
  }
  if (req.user.role === 'faculty') {
    const [pendingOutpasses, assignments] = await Promise.all([
      prisma.outpass.count({ where: { status: 'pending' } }),
      prisma.assignment.count(),
    ]);
    return res.json({ pendingOutpasses, assignments });
  }
  res.json({});
}
