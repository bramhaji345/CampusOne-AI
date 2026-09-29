import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { getStudentProfile } from '../services/mappers.js';
import { randomBytes } from 'crypto';
import { audit } from '../services/audit.js';
import { publishEvent } from '../services/events.js';

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim()); }

async function getDepartment(code) {
  const department = await prisma.department.findFirst({ where: { OR: [{ code }, { name: code }] } });
  if (!department) {
    const error = new Error(`Department "${code || ''}" does not exist. Add/confirm the department before assigning it.`);
    error.status = 422;
    throw error;
  }
  return department;
}

export async function listStudents(req, res) {
  const { dept, section, subject } = req.query;
  let assignedClassIds;
  if (req.user.role === 'faculty') {
    const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
    if (!faculty) return res.status(403).json({ error: 'Faculty profile is required.' });
    const assignments = await prisma.facultySubject.findMany({
      where: { facultyId: faculty.facultyId, ...(subject ? { subject: { name: String(subject), departmentId: faculty.departmentId } } : {}) },
      select: { classId: true },
    });
    assignedClassIds = [...new Set(assignments.map((row) => row.classId))];
    if (!assignedClassIds.length) return res.json([]);
  }
  const rows = await prisma.student.findMany({
    where: {
      ...(assignedClassIds ? { classId: { in: assignedClassIds } } : {}),
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
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
  const q = String(req.query.q || '').trim();
  const dept = String(req.query.dept || '').trim();
  const where = {
    ...(dept && dept !== 'all' ? { deptCode: dept } : {}),
    ...(req.query.active === 'false' ? { active: false } : req.query.active === 'true' ? { active: true } : {}),
    ...(q ? { OR: [
      { studentId: { contains: q, mode: 'insensitive' } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { deptCode: { contains: q, mode: 'insensitive' } },
    ] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.student.findMany({ where, include: { user: true }, orderBy: { studentId: 'asc' }, skip: (page - 1) * limit, take: limit }),
    prisma.student.count({ where }),
  ]);
  res.json({ items: rows.map((s) => ({
    ...s, student_id: s.studentId, dorm_no: s.dormNo, course: s.courseName, dept: s.deptCode,
    parent_name: s.parentName, parent_phone: s.parentPhone, name: s.user.name,
    email: s.user.email, photo: s.user.photo,
  })), page, limit, total, pages: Math.ceil(total / limit) });
}

export async function adminFaculty(req, res) {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
  const q = String(req.query.q || '').trim();
  const where = q ? { OR: [
    { facultyId: { contains: q, mode: 'insensitive' } },
    { employeeId: { contains: q, mode: 'insensitive' } },
    { deptCode: { contains: q, mode: 'insensitive' } },
    { user: { name: { contains: q, mode: 'insensitive' } } },
    { user: { email: { contains: q, mode: 'insensitive' } } },
  ] } : {};
  const [rows, total] = await Promise.all([
    prisma.faculty.findMany({
      where, include: { user: true },
      orderBy: { facultyId: 'asc' },
      skip: (page - 1) * limit, take: limit,
    }),
    prisma.faculty.count({ where }),
  ]);
  res.json({ items: rows.map((f) => ({
    faculty_id: f.facultyId,
    employee_id: f.employeeId,
    version: f.version,
    active: f.active,
    dept: f.deptCode,
    designation: f.designation,
    mobile: f.mobile,
    subjects: f.subjectsText,
    name: f.user.name,
    email: f.user.email,
    photo: f.user.photo,
  })), page, limit, total, pages: Math.ceil(total / limit) });
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
  if (!name?.trim() || !validEmail(email) || !/^O2[1-4]\d{4}$/.test(student_id || '')) return res.status(400).json({ error: 'Provide a name, valid email, and institutional student ID (O24/O23/O22/O21 plus four digits).' });
  const department = await getDepartment(dept);
  const temporaryPassword = randomBytes(9).toString('base64url');
  const yearLevel = `E${Math.min(Math.max(Number(year || 1), 1), 4)}`;
  const created = await prisma.$transaction(async (tx) => {
    const courseRow = await tx.course.findFirst({ where: { departmentId: department.id, name: course || 'B.Tech' } })
      || await tx.course.create({ data: { name: course || 'B.Tech', code: `BTECH-${department.code}`, departmentId: department.id } });
    const batch = await tx.batch.findFirst({ where: { courseId: courseRow.id, yearLevel } })
      || await tx.batch.create({ data: { name: `${yearLevel}-${department.code}`, yearLevel, courseId: courseRow.id } });
    const classRow = await tx.class.upsert({ where: { batchId_section: { batchId: batch.id, section: section || 'A' } }, update: {}, create: { section: section || 'A', batchId: batch.id } });
    const user = await tx.user.create({ data: { email: email.trim().toLowerCase(), password: await bcrypt.hash(temporaryPassword, 10), role: 'student', name: name.trim() } });
    const student = await tx.student.create({ data: {
      userId: user.id, studentId: student_id.trim(), dormNo: dorm_no || null, year: Number(year || 1),
      parentName: parent_name || null, mobile: mobile || null, parentPhone: parent_phone || null,
      section: section || 'A', courseName: course || 'B.Tech', deptCode: department.code,
      departmentId: department.id, courseId: courseRow.id, classId: classRow.id,
    } });
    await audit(tx, req, { action: 'created', entity: 'student', entityId: student.studentId, newValue: { name: name.trim(), email: email.trim().toLowerCase(), dept: department.code } });
    return student;
  });
  publishEvent({ type: 'student.created', entity: 'student', entityId: created.studentId, action: 'created', roles: ['admin', 'faculty'] });
  res.status(201).json({ message: 'Student created. Share this temporary password securely; it will not be shown again.', temporaryPassword, version: created.version });
}

export async function createFaculty(req, res) {
  const { name, email, faculty_id, dept, designation, mobile, subjects } = req.body;
  if (!name?.trim() || !validEmail(email) || !faculty_id?.trim()) return res.status(400).json({ error: 'Provide a name, valid email, and faculty ID.' });
  const department = await getDepartment(dept);
  const temporaryPassword = randomBytes(9).toString('base64url');
  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email: email.trim().toLowerCase(), password: await bcrypt.hash(temporaryPassword, 10), role: 'faculty', name: name.trim() } });
    const faculty = await tx.faculty.create({ data: {
      userId: user.id, facultyId: faculty_id.trim(), designation: designation || 'Requires confirmation',
      mobile: mobile || null, subjectsText: subjects || '', deptCode: department.code, departmentId: department.id,
    } });
    await audit(tx, req, { action: 'created', entity: 'faculty', entityId: faculty.facultyId, newValue: { name: name.trim(), email: email.trim().toLowerCase(), dept: department.code } });
    return faculty;
  });
  publishEvent({ type: 'faculty.created', entity: 'faculty', entityId: created.facultyId, action: 'created', roles: ['admin', 'faculty'] });
  res.status(201).json({ message: 'Faculty created. Share this temporary password securely; it will not be shown again.', temporaryPassword, version: created.version });
}

export async function deleteStudent(req, res) {
  const s = await prisma.student.findUnique({ where: { studentId: req.params.studentId }, include: { user: true } });
  if (!s) return res.status(404).json({ error: 'Not found' });
  if (req.body.expectedVersion == null || Number(req.body.expectedVersion) !== s.version) return res.status(409).json({ error: 'This record changed since it was loaded. Refresh and try again.', version: s.version });
  await prisma.$transaction(async (tx) => {
    const changed = await tx.student.updateMany({ where: { id: s.id, version: s.version }, data: { active: false, version: { increment: 1 } } });
    if (!changed.count) { const error = new Error('This record changed since it was loaded.'); error.status = 409; throw error; }
    await tx.user.update({ where: { id: s.userId }, data: { status: 'inactive', version: { increment: 1 } } });
    await audit(tx, req, { action: 'deactivated', entity: 'student', entityId: s.studentId, oldValue: { active: s.active }, newValue: { active: false } });
  });
  publishEvent({ type: 'student.deleted', entity: 'student', entityId: s.studentId, action: 'deactivated', roles: ['admin', 'faculty'], userIds: [s.userId] });
  res.json({ ok: true });
}

export async function updateStudent(req, res) {
  const studentId = req.params.studentId;
  const current = await prisma.student.findUnique({ where: { studentId }, include: { user: true } });
  if (!current) return res.status(404).json({ error: 'Not found' });
  const expectedVersion = Number(req.body.expectedVersion);
  if (!Number.isInteger(expectedVersion)) return res.status(400).json({ error: 'expectedVersion is required to prevent stale edits.' });
  if (expectedVersion !== current.version) return res.status(409).json({ error: 'This record changed since it was loaded. Refresh and try again.', version: current.version });
  const body = req.body;
  if (body.email != null && !validEmail(body.email)) return res.status(400).json({ error: 'Invalid email address.' });
  const nextName = body.name == null ? current.user.name : String(body.name).trim();
  const nextEmail = body.email == null ? current.user.email : String(body.email).trim().toLowerCase();
  const studentData = {};
  for (const [input, field] of [['dorm_no', 'dormNo'], ['mobile', 'mobile'], ['parent_name', 'parentName'], ['parent_phone', 'parentPhone'], ['section', 'section']]) {
    if (body[input] !== undefined) studentData[field] = body[input] || null;
  }
  if (body.cgpa !== undefined) studentData.cgpa = Number(body.cgpa);
  if (body.active !== undefined) studentData.active = Boolean(body.active);
  if (body.year !== undefined) studentData.year = Number(body.year);
  if (body.dept !== undefined || body.year !== undefined || body.section !== undefined) {
    const department = body.dept === undefined ? await prisma.department.findUnique({ where: { id: current.departmentId } }) : await getDepartment(body.dept);
    const course = await prisma.course.findFirst({ where: { departmentId: department.id, name: current.courseName } })
      || await prisma.course.create({ data: { name: current.courseName, code: `BTECH-${department.code}`, departmentId: department.id } });
    const yearLevel = `E${Number(studentData.year ?? current.year)}`;
    const batch = await prisma.batch.findFirst({ where: { courseId: course.id, yearLevel } })
      || await prisma.batch.create({ data: { name: `${yearLevel}-${department.code}`, yearLevel, courseId: course.id } });
    const classroom = await prisma.class.upsert({
      where: { batchId_section: { batchId: batch.id, section: String(studentData.section ?? current.section).toUpperCase() } },
      update: {}, create: { batchId: batch.id, section: String(studentData.section ?? current.section).toUpperCase() },
    });
    Object.assign(studentData, { departmentId: department.id, deptCode: department.code, courseId: course.id, classId: classroom.id });
  }
  const nextVersion = current.version + 1;
  await prisma.$transaction(async (tx) => {
    const changed = await tx.student.updateMany({ where: { id: current.id, version: expectedVersion }, data: { ...studentData, version: { increment: 1 } } });
    if (!changed.count) { const error = new Error('This record changed since it was loaded.'); error.status = 409; throw error; }
    await tx.user.update({ where: { id: current.userId }, data: { name: nextName, email: nextEmail, status: studentData.active === false ? 'inactive' : 'active', version: { increment: 1 } } });
    await audit(tx, req, { action: 'updated', entity: 'student', entityId: studentId,
      oldValue: { name: current.user.name, email: current.user.email, dept: current.deptCode, section: current.section, active: current.active, version: current.version },
      newValue: { name: nextName, email: nextEmail, ...studentData, version: nextVersion },
    });
  });
  publishEvent({ type: 'student.updated', entity: 'student', entityId: studentId, action: 'updated', roles: ['admin', 'faculty'], userIds: [current.userId] });
  res.json({ ok: true, version: nextVersion });
}

export async function updateFaculty(req, res) {
  const current = await prisma.faculty.findUnique({ where: { facultyId: req.params.facultyId }, include: { user: true } });
  if (!current) return res.status(404).json({ error: 'Not found' });
  const expectedVersion = Number(req.body.expectedVersion);
  if (!Number.isInteger(expectedVersion)) return res.status(400).json({ error: 'expectedVersion is required to prevent stale edits.' });
  if (expectedVersion !== current.version) return res.status(409).json({ error: 'This record changed since it was loaded. Refresh and try again.', version: current.version });
  const { name, email, dept, designation, mobile, subjects, active } = req.body;
  if (email != null && !validEmail(email)) return res.status(400).json({ error: 'Invalid email address.' });
  const department = dept == null ? null : await getDepartment(dept);
  const values = {
    ...(designation !== undefined ? { designation } : {}),
    ...(mobile !== undefined ? { mobile: mobile || null } : {}),
    ...(subjects !== undefined ? { subjectsText: subjects || '' } : {}),
    ...(department ? { departmentId: department.id, deptCode: department.code } : {}),
    ...(active !== undefined ? { active: Boolean(active) } : {}),
  };
  const nextVersion = current.version + 1;
  await prisma.$transaction(async (tx) => {
    const changed = await tx.faculty.updateMany({ where: { id: current.id, version: expectedVersion }, data: { ...values, version: { increment: 1 } } });
    if (!changed.count) { const error = new Error('This record changed since it was loaded.'); error.status = 409; throw error; }
    await tx.user.update({ where: { id: current.userId }, data: {
      ...(name !== undefined ? { name } : {}), ...(email !== undefined ? { email: String(email).trim().toLowerCase() } : {}),
      ...(active !== undefined ? { status: active ? 'active' : 'inactive' } : {}), version: { increment: 1 },
    } });
    await audit(tx, req, { action: 'updated', entity: 'faculty', entityId: current.facultyId,
      oldValue: { name: current.user.name, email: current.user.email, dept: current.deptCode, designation: current.designation, active: current.active, version: current.version },
      newValue: { name: name ?? current.user.name, email: email ?? current.user.email, ...values, version: nextVersion },
    });
  });
  publishEvent({ type: 'faculty.updated', entity: 'faculty', entityId: current.facultyId, action: 'updated', roles: ['admin', 'faculty'], userIds: [current.userId] });
  res.json({ ok: true, version: nextVersion });
}

export async function deactivateFaculty(req, res) {
  const current = await prisma.faculty.findUnique({ where: { facultyId: req.params.facultyId }, include: { user: true } });
  if (!current) return res.status(404).json({ error: 'Not found' });
  if (Number(req.body.expectedVersion) !== current.version) return res.status(409).json({ error: 'This record changed since it was loaded. Refresh and try again.', version: current.version });
  await prisma.$transaction(async (tx) => {
    const changed = await tx.faculty.updateMany({ where: { id: current.id, version: current.version }, data: { active: false, version: { increment: 1 } } });
    if (!changed.count) { const error = new Error('This record changed since it was loaded.'); error.status = 409; throw error; }
    await tx.user.update({ where: { id: current.userId }, data: { status: 'inactive', version: { increment: 1 } } });
    await audit(tx, req, { action: 'deactivated', entity: 'faculty', entityId: current.facultyId, oldValue: { active: current.active }, newValue: { active: false } });
  });
  publishEvent({ type: 'faculty.deleted', entity: 'faculty', entityId: current.facultyId, action: 'deactivated', roles: ['admin', 'faculty'], userIds: [current.userId] });
  res.json({ ok: true });
}

export async function adminStats(_req, res) {
  const [students, faculty, pendingCerts, pendingOut, notifications] = await Promise.all([
    prisma.student.count({ where: { active: true } }),
    prisma.faculty.count({ where: { active: true } }),
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
  const depts = await prisma.student.groupBy({ by: ['deptCode'], where: { active: true }, _count: true });
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

export async function saveDepartment(req, res) {
  const id = req.params.departmentId;
  const code = String(req.body.code || '').trim().toUpperCase();
  const name = String(req.body.name || '').trim();
  if (!/^[A-Z0-9_-]{2,12}$/.test(code) || !name) return res.status(400).json({ error: 'A valid department code and name are required.' });
  const current = id ? await prisma.department.findUnique({ where: { id } }) : null;
  if (id && !current) return res.status(404).json({ error: 'Department not found.' });
  const values = { code, name, confirmationStatus: String(req.body.confirmationStatus || 'CONFIRMED'), sourceType: 'admin-maintained' };
  const row = await prisma.$transaction(async (tx) => {
    const saved = current
      ? await tx.department.update({ where: { id }, data: values })
      : await tx.department.create({ data: values });
    await audit(tx, req, { action: current ? 'updated' : 'created', entity: 'department', entityId: saved.id, oldValue: current, newValue: saved });
    return saved;
  });
  publishEvent({ type: `department.${current ? 'updated' : 'created'}`, entity: 'department', entityId: row.id, roles: ['admin', 'faculty'] });
  res.status(current ? 200 : 201).json(row);
}

export async function deleteDepartment(req, res) {
  const current = await prisma.department.findUnique({ where: { id: req.params.departmentId } });
  if (!current) return res.status(404).json({ error: 'Department not found.' });
  const linked = await prisma.department.findUnique({ where: { id: current.id }, include: { _count: { select: { courses: true, students: true, faculty: true, subjects: true, branches: true } } } });
  if (Object.values(linked._count).some(Boolean)) return res.status(409).json({ error: 'Department is in use. Reassign its records before deleting it.', references: linked._count });
  await prisma.$transaction(async (tx) => { await tx.department.delete({ where: { id: current.id } }); await audit(tx, req, { action: 'deleted', entity: 'department', entityId: current.id, oldValue: current }); });
  res.status(204).end();
}

export async function adminCourses(req, res) {
  const rows = await prisma.course.findMany({
    where: req.query.departmentId ? { departmentId: String(req.query.departmentId) } : {},
    include: { department: true, program: true, _count: { select: { students: true, batches: true } } },
    orderBy: [{ department: { code: 'asc' } }, { code: 'asc' }],
  });
  res.json(rows);
}

export async function saveCourse(req, res) {
  const id = req.params.courseId;
  const name = String(req.body.name || '').trim();
  const code = String(req.body.code || '').trim().toUpperCase();
  const departmentId = String(req.body.departmentId || '').trim();
  if (!name || !/^[A-Z0-9_-]{2,20}$/.test(code) || !departmentId) return res.status(400).json({ error: 'Course name, code, and department are required.' });
  const current = id ? await prisma.course.findUnique({ where: { id } }) : null;
  if (id && !current) return res.status(404).json({ error: 'Course not found.' });
  const data = { name, code, departmentId, programId: req.body.programId || null };
  const row = current
    ? await prisma.course.update({ where: { id }, data, include: { department: true } })
    : await prisma.course.create({ data, include: { department: true } });
  await prisma.$transaction((tx) => audit(tx, req, { action: current ? 'updated' : 'created', entity: 'course', entityId: row.id, oldValue: current, newValue: row }));
  publishEvent({ type: `course.${current ? 'updated' : 'created'}`, entity: 'course', entityId: row.id, roles: ['admin', 'faculty'] });
  res.status(current ? 200 : 201).json(row);
}

export async function deleteCourse(req, res) {
  const current = await prisma.course.findUnique({ where: { id: req.params.courseId }, include: { _count: { select: { students: true, batches: true } } } });
  if (!current) return res.status(404).json({ error: 'Course not found.' });
  if (current._count.students || current._count.batches) return res.status(409).json({ error: 'Course is in use. Reassign its students and classes before deleting it.', references: current._count });
  await prisma.$transaction(async (tx) => { await tx.course.delete({ where: { id: current.id } }); await audit(tx, req, { action: 'deleted', entity: 'course', entityId: current.id, oldValue: current }); });
  res.status(204).end();
}

export async function adminClasses(req, res) {
  const rows = await prisma.class.findMany({
    where: req.query.batchId ? { batchId: String(req.query.batchId) } : {},
    include: { batch: { include: { course: { include: { department: true } } } }, _count: { select: { students: true } } },
    orderBy: [{ batch: { yearLevel: 'asc' } }, { section: 'asc' }],
  });
  res.json(rows);
}

export async function saveClass(req, res) {
  const id = req.params.classId;
  const batchId = String(req.body.batchId || '').trim();
  const section = String(req.body.section || '').trim().toUpperCase();
  if (!batchId || !/^[A-Z0-9-]{1,12}$/.test(section)) return res.status(400).json({ error: 'Batch and section are required.' });
  const current = id ? await prisma.class.findUnique({ where: { id } }) : null;
  if (id && !current) return res.status(404).json({ error: 'Class not found.' });
  const saved = current
    ? await prisma.class.update({ where: { id }, data: { batchId, section } })
    : await prisma.class.create({ data: { batchId, section } });
  await prisma.$transaction((tx) => audit(tx, req, { action: current ? 'updated' : 'created', entity: 'class', entityId: saved.id, oldValue: current, newValue: saved }));
  publishEvent({ type: `class.${current ? 'updated' : 'created'}`, entity: 'class', entityId: saved.id, roles: ['admin', 'faculty'] });
  res.status(current ? 200 : 201).json(saved);
}

export async function deleteClass(req, res) {
  const current = await prisma.class.findUnique({ where: { id: req.params.classId }, include: { _count: { select: { students: true, facultySubjects: true, timetable: true, assignments: true } } } });
  if (!current) return res.status(404).json({ error: 'Class not found.' });
  if (Object.values(current._count).some(Boolean)) return res.status(409).json({ error: 'Class is in use. Reassign its students and activities before deleting it.', references: current._count });
  await prisma.$transaction(async (tx) => { await tx.class.delete({ where: { id: current.id } }); await audit(tx, req, { action: 'deleted', entity: 'class', entityId: current.id, oldValue: current }); });
  res.status(204).end();
}

export async function adminAuditLogs(req, res) {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
  const entity = String(req.query.entity || '').trim();
  const where = entity ? { entity: { equals: entity, mode: 'insensitive' } } : {};
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);
  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
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
