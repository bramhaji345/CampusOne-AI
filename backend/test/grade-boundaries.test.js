import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeFor, gradePointsFor, serializeResult } from '../src/services/mappers.js';
import { prisma } from '../src/config/prisma.js';

test('boundary values on 100-mark scale: 89 remains A, 90-100 becomes Ex', () => {
  // Boundary 89: Must remain under existing rule ('A' with 9 points)
  assert.equal(gradeFor(89, 100), 'A', 'Marks 89 must receive grade A');
  assert.equal(gradePointsFor(89, 100), 9, 'Marks 89 must receive grade point 9');

  // Boundary 90: Must receive Ex with 10 points
  assert.equal(gradeFor(90, 100), 'Ex', 'Marks 90 must receive grade Ex');
  assert.equal(gradePointsFor(90, 100), 10, 'Marks 90 must receive grade point 10');

  // Boundary 91: Must receive Ex
  assert.equal(gradeFor(91, 100), 'Ex', 'Marks 91 must receive grade Ex');
  assert.equal(gradePointsFor(91, 100), 10, 'Marks 91 must receive grade point 10');

  // Boundary 95: Must receive Ex
  assert.equal(gradeFor(95, 100), 'Ex', 'Marks 95 must receive grade Ex');
  assert.equal(gradePointsFor(95, 100), 10, 'Marks 95 must receive grade point 10');

  // Boundary 99: Must receive Ex
  assert.equal(gradeFor(99, 100), 'Ex', 'Marks 99 must receive grade Ex');
  assert.equal(gradePointsFor(99, 100), 10, 'Marks 99 must receive grade point 10');

  // Boundary 100: Must receive Ex
  assert.equal(gradeFor(100, 100), 'Ex', 'Marks 100 must receive grade Ex');
  assert.equal(gradePointsFor(100, 100), 10, 'Marks 100 must receive grade point 10');
});

test('existing grading rules for 89 and below remain unchanged', () => {
  assert.equal(gradeFor(85, 100), 'A');
  assert.equal(gradeFor(80, 100), 'A');
  assert.equal(gradeFor(79, 100), 'B');
  assert.equal(gradeFor(70, 100), 'B');
  assert.equal(gradeFor(69, 100), 'C');
  assert.equal(gradeFor(60, 100), 'C');
  assert.equal(gradeFor(59, 100), 'D');
  assert.equal(gradeFor(50, 100), 'D');

  assert.equal(gradePointsFor(85, 100), 9);
  assert.equal(gradePointsFor(75, 100), 8);
  assert.equal(gradePointsFor(65, 100), 7);
  assert.equal(gradePointsFor(55, 100), 6);
});

test('mid exam boundary values on 30-mark scale', () => {
  // 26/30 = 86.7% (< 90%) -> remains A (9 points)
  assert.equal(gradeFor(26, 30), 'A');
  assert.equal(gradePointsFor(26, 30), 9);

  // 27/30 = 90.0% (>= 90%) -> Ex (10 points)
  assert.equal(gradeFor(27, 30), 'Ex');
  assert.equal(gradePointsFor(27, 30), 10);

  // 28/30 = 93.3% -> Ex
  assert.equal(gradeFor(28, 30), 'Ex');
  assert.equal(gradePointsFor(28, 30), 10);

  // 30/30 = 100% -> Ex
  assert.equal(gradeFor(30, 30), 'Ex');
  assert.equal(gradePointsFor(30, 30), 10);
});

test('serializeResult normalizes grades to Ex for marks >= 90%', () => {
  const result90 = serializeResult({
    id: 'res_1', studentId: 'O240001', yearLevel: 'E1', semester: 'Sem1',
    type: 'sem', subject: 'Math', marks: 90, maxMarks: 100, grade: 'A', gradePoints: 9,
  });
  assert.equal(result90.grade, 'Ex');

  const result89 = serializeResult({
    id: 'res_2', studentId: 'O240001', yearLevel: 'E1', semester: 'Sem1',
    type: 'sem', subject: 'Physics', marks: 89, maxMarks: 100, grade: 'A', gradePoints: 9,
  });
  assert.equal(result89.grade, 'A');

  const resultMid27 = serializeResult({
    id: 'res_3', studentId: 'O240001', yearLevel: 'E1', semester: 'Sem1',
    type: 'mid', subject: 'Math', marks: 27, maxMarks: 30, grade: 'A', gradePoints: 9,
  });
  assert.equal(resultMid27.grade, 'Ex');
});

test('live database verification: no incorrect A grades for marks >= 90', async (t) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    t.skip('Database is not running at 127.0.0.1:5433, skipping live DB assertion');
    return;
  }
  const incorrectSemA = await prisma.result.count({
    where: { maxMarks: 100, marks: { gte: 90 }, grade: { in: ['A', 'A+'] } },
  });
  assert.equal(incorrectSemA, 0, 'Found incorrect A or A+ in results for marks >= 90');

  const incorrectMidA = await prisma.result.count({
    where: { maxMarks: 30, marks: { gte: 27 }, grade: { in: ['A', 'A+'] } },
  });
  assert.equal(incorrectMidA, 0, 'Found incorrect A or A+ in mid results for marks >= 27');

  const incorrectScrA = await prisma.studentCourseRecord.count({
    where: { marks: { gte: 90 }, grade: { in: ['A', 'A+'] } },
  });
  assert.equal(incorrectScrA, 0, 'Found incorrect A or A+ in course records for marks >= 90');

  // Confirm boundary 89 records still exist and have grade 'A'
  const boundary89Count = await prisma.result.count({
    where: { maxMarks: 100, marks: 89 },
  });
  const boundary89ACount = await prisma.result.count({
    where: { maxMarks: 100, marks: 89, grade: 'A' },
  });
  assert.ok(boundary89Count > 0, 'Should have records with 89 marks');
  assert.equal(boundary89Count, boundary89ACount, 'All 89 marks must retain grade A');

  // Check student records exist and remain intact
  const studentCount = await prisma.student.count();
  assert.ok(studentCount > 0, 'Students must exist in the database');
  const sampleStudent = await prisma.student.findFirst({ select: { cgpa: true } });
  assert.ok(sampleStudent.cgpa >= 0, 'Student CGPA must be a valid number');
});
