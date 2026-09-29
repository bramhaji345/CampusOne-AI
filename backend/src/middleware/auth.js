import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  try {
    const account = await prisma.user.findUnique({ where: { id: decoded.id }, select: { status: true, role: true } });
    if (!account || account.status !== 'active') return res.status(401).json({ error: 'Account is inactive or no longer available' });
    if (account.role !== decoded.role) return res.status(401).json({ error: 'Account permissions changed. Sign in again.' });
    req.user = decoded;
    next();
  } catch (error) { next(error); }
}

export function role(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
