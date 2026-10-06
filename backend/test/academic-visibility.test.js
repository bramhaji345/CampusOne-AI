import assert from 'assert';
import { prisma } from '../src/config/prisma.js';
import { getStudentProfile } from '../src/services/mappers.js';
import {
  getStudentAcademicLevel,
  isAcademicTermAuthorized,
  buildAuthorizedResultWhere,
} from '../src/services/academic-auth.js';
import * as academic from '../src/controllers/academic.controller.js';
import * as campus from '../src/controllers/campus.controller.js';

function mockReq(user, query = {}, body = {}, params = {}) {
  return { user, query, body, params };
}

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.data = payload;
      return res;
    },
  };
  return res;
}

async function run() {
  console.log('--- Running Academic Visibility Test ---');
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.log('Database is not running at 127.0.0.1:5433, skipping live DB assertion.');
    return;
  }
  // E2 Student (O230001, Yr 2, Sem 1 -> Cum 3)
  const e2User = await prisma.user.findFirst({ where: { student: { studentId: 'O230001' } } });
  assert.ok(e2User);

  const profile = await getStudentProfile(e2User.id);
  assert.strictEqual(profile.year, 2);
  assert.strictEqual(profile.cohort, 'E2');
  assert.strictEqual(profile.semester, 1);
  assert.strictEqual(profile.cumulative_semester, 3);

  // Results - all authorized
  const resResults = mockRes();
  await academic.listResults(mockReq(e2User, {}), resResults);
  for (const r of resResults.data) {
    const yr = Number(String(r.year_level).replace(/\D/g, '')) || 1;
    const sDigits = Number(String(r.semester).replace(/\D/g, '')) || 1;
    const cum = (sDigits >= 3 && sDigits <= 8) ? sDigits : ((yr - 1) * 2 + sDigits);
    assert.ok(cum <= 3, `Record ${r.subject} (${cum}) exceeds max allowed 3`);
  }

  // AI analysis - trend must have exactly 3 points
  const resAi = mockRes();
  await academic.aiResults(mockReq(e2User), resAi);
  assert.strictEqual(resAi.data.trend.length, 3);

  // Negative tests
  const resY3 = mockRes();
  await academic.listResults(mockReq(e2User, { year_level: 'E3' }), resY3);
  assert.strictEqual(resY3.data.length, 0);

  const resS4 = mockRes();
  await academic.listResults(mockReq(e2User, { year_level: 'E2', semester: 'Sem2' }), resS4);
  assert.strictEqual(resS4.data.length, 0);

  console.log('✔ Academic visibility and boundary enforcement verified');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
