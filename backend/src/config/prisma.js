import { PrismaClient } from '../../generated/prisma-v2/index.js';

export const prisma = new PrismaClient();

let exGradesEnsured = false;

export async function ensureExGrades(client = prisma) {
  if (exGradesEnsured) return;
  exGradesEnsured = true;
  try {
    await client.$executeRawUnsafe(`
      UPDATE results
      SET grade = 'Ex'
      WHERE max_marks > 0 AND (marks / max_marks) >= 0.8999 AND grade IN ('A', 'A+', 'EX')
    `);
    await client.$executeRawUnsafe(`
      UPDATE student_course_records
      SET grade = 'Ex'
      WHERE grade = 'EX' OR (marks IS NOT NULL AND marks >= 89.99 AND grade IN ('A', 'A+'))
    `);
    await client.$executeRawUnsafe(`
      UPDATE grade_scales
      SET grade = 'Ex'
      WHERE grade = 'EX'
    `);
    await client.$executeRawUnsafe(`
      ALTER TABLE students ADD COLUMN IF NOT EXISTS semester INTEGER DEFAULT 1;
    `);
  } catch (err) {
    console.warn('Ex grades alignment notice:', err?.message || err);
  }
}

export async function dbHealth() {
  await prisma.$queryRaw`SELECT 1`;
  ensureExGrades().catch(() => {});
  return true;
}
