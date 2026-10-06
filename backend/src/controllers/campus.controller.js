import QRCode from 'qrcode';
import { prisma } from '../config/prisma.js';
import { localISODate } from '../services/dates.js';
import {
  getFacultyProfile,
  getStudentProfile,
  serializeAssignment,
  serializeNotification,
  serializeOutpass,
  serializeTimetable,
} from '../services/mappers.js';
import {
  getStudentAcademicLevel,
  isAcademicTermAuthorized,
} from '../services/academic-auth.js';
import { saveUploadedFile } from '../services/storage.service.js';

const PRIORITY = { urgent: 1, medical: 2, event: 3, personal: 4, other: 5 };

export async function listTimetable(req, res) {
  if (req.user.role === 'student') {
    const student = await getStudentProfile(req.user.id);
    const authLevel = getStudentAcademicLevel(student);
    const owner = `${student.dept}-${student.section}-E${authLevel.year}`;
    const rows = await prisma.timetable.findMany({
      where: { roleOwner: 'student', ownerId: { in: [owner, `${student.dept}-${student.section}`] } },
      include: {
        subjectRel: {
          include: { offerings: true },
        },
      },
      orderBy: { period: 'asc' },
    });
    const authorizedRows = rows.filter((r) => {
      if (!r.subjectRel) return true;
      const entryLevel = r.subjectRel.entryLevel || r.subjectRel.offerings?.[0]?.entryLevel;
      const semester = r.subjectRel.semester || r.subjectRel.offerings?.[0]?.semester;
      if (entryLevel && !isAcademicTermAuthorized(authLevel, entryLevel, semester)) {
        return false;
      }
      return true;
    });
    return res.json(authorizedRows.map(serializeTimetable));
  }
  if (req.user.role === 'faculty') {
    const faculty = await getFacultyProfile(req.user.id);
    const rows = await prisma.timetable.findMany({
      where: { roleOwner: 'faculty', ownerId: faculty.faculty_id },
      orderBy: { period: 'asc' },
    });
    return res.json(rows.map(serializeTimetable));
  }
  res.json([]);
}

export async function listAssignments(req, res) {
  if (req.user.role === 'student') {
    const student = await getStudentProfile(req.user.id);
    const list = await prisma.assignment.findMany({
      where: {
        OR: [
          { class: { students: { some: { studentId: student.student_id } } } },
          { classId: null },
        ],
      },
      orderBy: { dueDate: 'asc' },
      include: { submissions: { where: { studentId: student.student_id } } },
    });
    return res.json(list.map((a) => serializeAssignment(a, a.submissions[0] || null)));
  }
  if (req.user.role === 'faculty') {
    const faculty = await getFacultyProfile(req.user.id);
    const list = await prisma.assignment.findMany({
      where: { facultyId: faculty.faculty_id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(list.map((a) => serializeAssignment(a)));
  }
  const list = await prisma.assignment.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(list.map((a) => serializeAssignment(a)));
}

export async function createAssignment(req, res) {
  const faculty = await getFacultyProfile(req.user.id);
  const { title, description, subject, due_date } = req.body;
  const row = await prisma.assignment.create({
    data: {
      facultyId: faculty.faculty_id,
      title,
      description,
      subject,
      dueDate: due_date,
    },
  });
  await prisma.notification.create({
    data: {
      title: `New assignment: ${title}`,
      body: `${subject} assignment is due on ${due_date}. ${description || ''}`.slice(0, 400),
      senderId: req.user.id,
      targetRole: 'student',
      priority: 'important',
    },
  });
  res.json({ id: row.id, message: 'Assignment created' });
}

export async function submitAssignment(req, res) {
  const student = await getStudentProfile(req.user.id);
  let fileUrl = req.body.file_url || null;
  if (req.file) {
    const result = await saveUploadedFile(req.file, { type: 'document', folder: 'assignments' });
    fileUrl = result.url;
  }
  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId: req.params.id, studentId: student.student_id } },
    update: { fileUrl, submittedAt: new Date(), status: 'submitted' },
    create: {
      assignmentId: req.params.id,
      studentId: student.student_id,
      fileUrl,
      submittedAt: new Date(),
      status: 'submitted',
    },
  });
  res.json({ message: 'Assignment submitted' });
}

export async function assignmentSubmissions(req, res) {
  const rows = await prisma.assignmentSubmission.findMany({
    where: { assignmentId: req.params.id },
    include: { student: { include: { user: true } } },
  });
  res.json(rows.map((s) => ({
    id: s.id,
    assignment_id: s.assignmentId,
    student_id: s.studentId,
    file_url: s.fileUrl,
    submitted_at: s.submittedAt,
    status: s.status,
    student_name: s.student?.user?.name,
  })));
}

export async function listOutpasses(req, res) {
  if (req.user.role === 'student') {
    const student = await getStudentProfile(req.user.id);
    const rows = await prisma.outpass.findMany({
      where: { studentId: student.student_id },
      orderBy: { createdAt: 'desc' },
      include: { student: { include: { user: true } } },
    });
    return res.json(rows.map(serializeOutpass));
  }
  if (req.user.role === 'faculty') {
    const faculty = await getFacultyProfile(req.user.id);
    const rows = await prisma.outpass.findMany({
      where: { OR: [{ facultyId: faculty.faculty_id }, { status: 'pending' }] },
      include: { student: { include: { user: true } } },
    });
    rows.sort((a, b) => (PRIORITY[a.reasonType] || 9) - (PRIORITY[b.reasonType] || 9));
    return res.json(rows.map(serializeOutpass));
  }
  const rows = await prisma.outpass.findMany({
    include: { student: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rows.map(serializeOutpass));
}

export async function createOutpass(req, res) {
  const student = await getStudentProfile(req.user.id);
  const {
    reason, reason_type, from_date, to_date, faculty_id,
    destination = '', out_time = '', return_time = '', extra = '',
  } = req.body;
  const defaultFac = await prisma.faculty.findFirst({ where: { deptCode: student.dept } });
  const facultyId = faculty_id || defaultFac?.facultyId;
  const row = await prisma.outpass.create({
    data: {
      studentId: student.student_id,
      facultyId,
      reason,
      reasonType: reason_type || 'other',
      fromDate: from_date,
      toDate: to_date,
      destination,
      outTime: out_time,
      returnTime: return_time,
      extra,
    },
  });
  const fac = await prisma.faculty.findUnique({ where: { facultyId } });
  if (fac) {
    await prisma.notification.create({
      data: {
        title: 'New Outpass Request',
        body: `${student.name || 'A student'} requested an outpass (${reason_type}).`,
        senderId: req.user.id,
        targetRole: 'faculty',
        targetId: fac.userId,
        priority: reason_type === 'urgent' ? 'urgent' : 'normal',
      },
    });
  }
  res.json({ id: row.id, message: 'Outpass request submitted' });
}

export async function reviewOutpass(req, res) {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const op = await prisma.outpass.findUnique({ where: { id: req.params.id } });
  if (!op) return res.status(404).json({ error: 'Not found' });
  let qrCode = null;
  if (status === 'approved') qrCode = await QRCode.toDataURL(JSON.stringify({ ref: op.id }));
  await prisma.outpass.update({
    where: { id: op.id },
    data: { status, qrCode, reviewedAt: new Date() },
  });
  const student = await prisma.student.findUnique({ where: { studentId: op.studentId } });
  if (student) {
    await prisma.notification.create({
      data: {
        title: `Outpass ${status}`,
        body: status === 'approved'
          ? 'Your outpass was approved. Show the QR code at security.'
          : 'Your outpass request was rejected.',
        senderId: req.user.id,
        targetRole: 'student',
        targetId: student.userId,
      },
    });
  }
  res.json({ message: `Outpass ${status}`, qr_code: qrCode });
}

export async function scanOutpass(req, res) {
  const id = req.body.outpassId || req.body.ref;
  const op = await prisma.outpass.findUnique({
    where: { id },
    include: {
      student: { include: { user: true } },
      faculty: { include: { user: true } },
    },
  });
  if (!op) return res.status(404).json({ valid: false, error: 'Invalid QR / outpass not found' });
  const expired = op.toDate && op.toDate < localISODate();
  if (op.status !== 'approved' || expired) {
    return res.status(400).json({
      valid: false,
      message: expired ? 'INVALID / EXPIRED OUTPASS' : 'INVALID / NOT APPROVED',
      outpass: { id: op.id, status: op.status, student_name: op.student?.user?.name },
    });
  }
  await prisma.outpass.update({ where: { id: op.id }, data: { scannedAt: new Date() } });
  res.json({
    valid: true,
    message: 'VALID OUTPASS',
    outpass: {
      id: op.id,
      student_name: op.student?.user?.name,
      student_id: op.studentId,
      from_date: op.fromDate,
      to_date: op.toDate,
      out_time: op.outTime,
      return_time: op.returnTime,
      destination: op.destination,
      reason_type: op.reasonType,
      approved_by: op.faculty?.user?.name,
      status: op.status,
    },
  });
}

export async function listCertificates(req, res) {
  if (req.user.role === 'student') {
    const student = await getStudentProfile(req.user.id);
    const rows = await prisma.certificate.findMany({
      where: { studentId: student.student_id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(rows.map((c) => ({
      id: c.id, student_id: c.studentId, type: c.type, purpose: c.purpose, status: c.status, created_at: c.createdAt,
    })));
  }
  const rows = await prisma.certificate.findMany({
    include: { student: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rows.map((c) => ({
    id: c.id,
    student_id: c.studentId,
    type: c.type,
    purpose: c.purpose,
    status: c.status,
    created_at: c.createdAt,
    student_name: c.student?.user?.name,
    dept: c.student?.deptCode,
  })));
}

export async function createCertificate(req, res) {
  const student = await getStudentProfile(req.user.id);
  const row = await prisma.certificate.create({
    data: { studentId: student.student_id, type: req.body.type, purpose: req.body.purpose },
  });
  res.json({ id: row.id, message: 'Certificate request submitted' });
}

export async function reviewCertificate(req, res) {
  await prisma.certificate.update({
    where: { id: req.params.id },
    data: { status: req.body.status, reviewedAt: new Date() },
  });
  const cert = await prisma.certificate.findUnique({ where: { id: req.params.id } });
  const student = await prisma.student.findUnique({ where: { studentId: cert.studentId } });
  if (student) {
    await prisma.notification.create({
      data: {
        title: `Certificate ${req.body.status}`,
        body: `Your ${cert.type} request is now ${req.body.status}.`,
        senderId: req.user.id,
        targetRole: 'student',
        targetId: student.userId,
      },
    });
  }
  res.json({ message: `Certificate ${req.body.status}` });
}

export async function listNotifications(req, res) {
  const { role, id } = req.user;
  const rows = role === 'admin'
    ? await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } })
    : await prisma.notification.findMany({
      where: { OR: [{ targetRole: role }, { targetRole: 'all' }, { targetId: id }] },
      orderBy: { createdAt: 'desc' },
    });
  res.json(rows.map(serializeNotification));
}

export async function createNotification(req, res) {
  const { title, body, target_role = 'student', target_id = null, priority = 'normal' } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
  const row = await prisma.notification.create({
    data: {
      title,
      body,
      senderId: req.user.id,
      targetRole: target_role,
      targetId: target_id,
      priority,
    },
  });
  res.json({ id: row.id, message: 'Notification sent' });
}

export async function readAllNotifications(req, res) {
  const rows = await prisma.notification.findMany();
  await Promise.all(rows.map((n) => {
    const readBy = Array.isArray(n.readBy) ? n.readBy : [];
    if (readBy.includes(req.user.id)) return null;
    return prisma.notification.update({
      where: { id: n.id },
      data: { readBy: [...readBy, req.user.id] },
    });
  }));
  res.json({ ok: true });
}

export async function readNotification(req, res) {
  const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!n) return res.status(404).json({ error: 'Not found' });
  const readBy = Array.isArray(n.readBy) ? n.readBy : [];
  if (!readBy.includes(req.user.id)) {
    await prisma.notification.update({ where: { id: n.id }, data: { readBy: [...readBy, req.user.id] } });
  }
  res.json({ ok: true });
}

export async function deleteNotification(req, res) {
  await prisma.notification.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}
