import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { prisma } from '../config/prisma.js';
import { isCollegeEmail } from '../config/env.js';
import { signToken } from '../middleware/auth.js';
import { getFacultyProfile, getStudentProfile, mapFaculty, mapStudent } from '../services/mappers.js';

export async function login(req, res) {
  const { email, password, role: loginRole } = req.body;
  const identifier = String(email || '').trim();
  const role = String(loginRole || '').trim().toLowerCase();
  if (!identifier || !password || !role) {
    return res.status(400).json({ error: 'Campus email or ID, password and role required' });
  }
  if (!['student', 'faculty', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Choose a valid portal: student, faculty, or admin' });
  }

  let user = null;
  const isEmail = identifier.includes('@');

  // Direct fast-path indexed lookups
  if (!isEmail && role === 'student') {
    const student = await prisma.student.findFirst({
      where: { studentId: { equals: identifier, mode: 'insensitive' } },
      include: { user: true },
    });
    if (student?.user && student.user.status === 'active' && student.user.role === role) {
      user = { ...student.user, student, faculty: null };
    }
  } else if (!isEmail && role === 'faculty') {
    const faculty = await prisma.faculty.findFirst({
      where: { facultyId: { equals: identifier, mode: 'insensitive' } },
      include: { user: true },
    });
    if (faculty?.user && faculty.user.status === 'active' && faculty.user.role === role) {
      user = { ...faculty.user, faculty, student: null };
    }
  } else {
    user = await prisma.user.findFirst({
      where: { email: { equals: identifier, mode: 'insensitive' }, role, status: 'active' },
      include: { student: true, faculty: true },
    });
  }

  // Fallback for edge cases (e.g. entered email without @ or ID with unusual pattern)
  if (!user && role === 'student') {
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { studentId: { equals: identifier, mode: 'insensitive' } },
          { user: { email: { equals: identifier, mode: 'insensitive' } } },
        ],
      },
      include: { user: true },
    });
    if (student?.user && student.user.status === 'active' && student.user.role === role) {
      user = { ...student.user, student, faculty: null };
    }
  } else if (!user && role === 'faculty') {
    const faculty = await prisma.faculty.findFirst({
      where: {
        OR: [
          { facultyId: { equals: identifier, mode: 'insensitive' } },
          { user: { email: { equals: identifier, mode: 'insensitive' } } },
        ],
      },
      include: { user: true },
    });
    if (faculty?.user && faculty.user.status === 'active' && faculty.user.role === role) {
      user = { ...faculty.user, faculty, student: null };
    }
  }

  if (!user) return res.status(401).json({ error: 'Invalid credentials for this portal' });
  const ok = await bcrypt.compare(String(password), user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  let profile = { id: user.id, email: user.email, name: user.name, role: user.role, photo: user.photo };
  if (user.role === 'student' && user.student) profile = mapStudent(user, user.student);
  if (user.role === 'faculty' && user.faculty) profile = mapFaculty(user, user.faculty);
  res.json({ token, user: profile });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email || !isCollegeEmail(email)) {
    return res.status(400).json({ error: 'Please use your college email (@campusone.demo or @campusone.edu)' });
  }
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(404).json({ error: 'No account found with this college email' });

  const token = randomUUID();
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      email: user.email,
      token,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  res.json({
    message: 'Password reset link has been sent to your college email.',
    demoResetLink: `/reset-password?token=${token}`,
    demoNote: 'In production this is emailed. For demo, use the link below.',
  });
}

export async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.used) return res.status(400).json({ error: 'Invalid or expired reset token' });
  if (reset.expiresAt < new Date()) return res.status(400).json({ error: 'Reset token expired' });

  const hash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { email: reset.email }, data: { password: hash } }),
    prisma.passwordReset.update({ where: { token }, data: { used: true } }),
  ]);
  res.json({ message: 'Password updated successfully' });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { student: true, faculty: true },
  });
  if (!user || user.status !== 'active') return res.status(404).json({ error: 'User not found' });
  if (user.role === 'student' && user.student) return res.json(mapStudent(user, user.student));
  if (user.role === 'faculty' && user.faculty) return res.json(mapFaculty(user, user.faculty));
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, photo: user.photo });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const ok = await bcrypt.compare(currentPassword || '', user.password);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });
  res.json({ message: 'Password updated' });
}
