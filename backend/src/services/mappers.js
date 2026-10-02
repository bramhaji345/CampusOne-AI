import { prisma } from '../config/prisma.js';

export function mapStudent(user, student) {
  if (!student) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    photo: user.photo,
    role: user.role,
    student_id: student.studentId,
    dorm_no: student.dormNo,
    course: student.courseName,
    year: student.year,
    dept: student.deptCode,
    parent_name: student.parentName,
    mobile: student.mobile,
    parent_phone: student.parentPhone,
    section: student.section,
    cgpa: student.cgpa,
  };
}

export function mapFaculty(user, faculty) {
  if (!faculty) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    photo: user.photo,
    role: user.role,
    faculty_id: faculty.facultyId,
    dept: faculty.deptCode,
    designation: faculty.designation,
    mobile: faculty.mobile,
    subjects: faculty.subjectsText,
  };
}

export async function getStudentProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true },
  });
  if (!user?.student) return null;
  return mapStudent(user, user.student);
}

export async function getFacultyProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { faculty: true },
  });
  if (!user?.faculty) return null;
  return mapFaculty(user, user.faculty);
}

export function serializeResult(r) {
  const marks = Number(r.marks);
  const max = Number(r.maxMarks || 100);
  const isEx = max > 0 && (marks / max) * 100 >= 90;
  const grade = isEx ? 'Ex' : (r.grade === 'EX' ? 'Ex' : r.grade);
  return {
    id: r.id,
    student_id: r.studentId,
    year_level: r.yearLevel,
    semester: r.semester,
    type: r.type,
    subject: r.subject,
    marks: r.marks,
    max_marks: r.maxMarks,
    grade,
    grade_points: r.gradePoints,
  };
}

export function serializeAttendance(a) {
  return {
    id: a.id,
    student_id: a.studentId,
    subject: a.subject,
    class_type: a.classType,
    date: a.date,
    status: a.status,
    faculty_id: a.facultyId,
    name: a.student?.user?.name,
  };
}

export function serializeOutpass(o) {
  return {
    id: o.id,
    student_id: o.studentId,
    faculty_id: o.facultyId,
    reason: o.reason,
    reason_type: o.reasonType,
    from_date: o.fromDate,
    to_date: o.toDate,
    destination: o.destination,
    out_time: o.outTime,
    return_time: o.returnTime,
    extra: o.extra,
    status: o.status,
    qr_code: o.qrCode,
    scanned_at: o.scannedAt,
    created_at: o.createdAt,
    reviewed_at: o.reviewedAt,
    student_name: o.student?.user?.name,
    dept: o.student?.deptCode,
    year: o.student?.year,
  };
}

export function serializeNotification(n) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    sender_id: n.senderId,
    target_role: n.targetRole,
    target_id: n.targetId,
    priority: n.priority,
    created_at: n.createdAt,
    read_by: Array.isArray(n.readBy) ? n.readBy : [],
  };
}

export function serializeAssignment(a, submission = null) {
  return {
    id: a.id,
    faculty_id: a.facultyId,
    title: a.title,
    description: a.description,
    subject: a.subject,
    due_date: a.dueDate,
    file_url: a.fileUrl,
    created_at: a.createdAt,
    submission: submission
      ? {
          id: submission.id,
          assignment_id: submission.assignmentId,
          student_id: submission.studentId,
          file_url: submission.fileUrl,
          submitted_at: submission.submittedAt,
          status: submission.status,
        }
      : null,
  };
}

export function serializeTimetable(t) {
  return {
    id: t.id,
    role_owner: t.roleOwner,
    owner_id: t.ownerId,
    day: t.day,
    period: t.period,
    subject: t.subject,
    room: t.room,
    time_slot: t.timeSlot,
    faculty_name: t.facultyName,
    class_type: t.classType,
  };
}

export function gradeFor(marks, max) {
  const pct = (Number(marks) / Number(max || 100)) * 100;
  if (pct >= 90) return 'Ex';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  return 'D';
}

export function gradePointsFor(marks, max) {
  const pct = (Number(marks) / Number(max || 100)) * 100;
  if (pct >= 90) return 10;
  if (pct >= 80) return 9;
  if (pct >= 70) return 8;
  if (pct >= 60) return 7;
  if (pct >= 50) return 6;
  return 0;
}

export async function refreshStudentCgpa(studentId) {
  const records = await prisma.semesterCgpa.findMany({ where: { studentId } });
  if (!records.length) return;
  const cgpa = Math.round((records.reduce((s, r) => s + r.gpa, 0) / records.length) * 100) / 100;
  await prisma.student.update({ where: { studentId }, data: { cgpa } });
  return cgpa;
}
