import assert from 'assert';
import { prisma } from './src/config/prisma.js';
import { signToken } from './src/middleware/auth.js';
import { getStudentProfile } from './src/services/mappers.js';
import {
  getStudentAcademicLevel,
  isAcademicTermAuthorized,
  buildAuthorizedResultWhere,
  calculateAuthorizedStudentCgpa,
  filterAuthorizedAttendance,
} from './src/services/academic-auth.js';
import * as academic from './src/controllers/academic.controller.js';
import * as campus from './src/controllers/campus.controller.js';
import * as admin from './src/controllers/admin.controller.js';

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

async function runTests() {
  console.log('====================================================');
  console.log('CAMPUSONE-AI ACADEMIC DATA VISIBILITY & SECURITY TEST');
  console.log('====================================================\n');

  const representativeStudents = [
    { studentId: 'O240001', expectedYear: 1, expectedSem: 1, maxCum: 1, label: 'E1 CSE' },
    { studentId: 'O240481', expectedYear: 1, expectedSem: 2, maxCum: 2, label: 'E1 ECE' },
    { studentId: 'O230001', expectedYear: 2, expectedSem: 1, maxCum: 3, label: 'E2 CSE' },
    { studentId: 'O230481', expectedYear: 2, expectedSem: 2, maxCum: 4, label: 'E2 ECE' },
    { studentId: 'O220801', expectedYear: 3, expectedSem: 1, maxCum: 5, label: 'E3 EEE' },
    { studentId: 'O220901', expectedYear: 3, expectedSem: 2, maxCum: 6, label: 'E3 Mechanical' },
    { studentId: 'O211001', expectedYear: 4, expectedSem: 1, maxCum: 7, label: 'E4 Civil' },
    { studentId: 'O210001', expectedYear: 4, expectedSem: 2, maxCum: 8, label: 'E4 CSE' },
  ];

  console.log('--- TEST 1: REPRESENTATIVE STUDENTS VALIDATION ---');
  for (const rep of representativeStudents) {
    const studentUser = await prisma.user.findFirst({
      where: { student: { studentId: rep.studentId } },
      include: { student: true },
    });
    assert.ok(studentUser, `Student user for ${rep.studentId} must exist`);

    const profile = await getStudentProfile(studentUser.id);
    assert.strictEqual(profile.student_id, rep.studentId);
    assert.strictEqual(profile.year, rep.expectedYear);
    assert.strictEqual(profile.cohort, `E${rep.expectedYear}`);
    assert.strictEqual(profile.semester, rep.expectedSem);
    assert.strictEqual(profile.cumulative_semester, rep.maxCum);
    assert.ok(typeof profile.cgpa === 'number', 'CGPA must be a valid number');

    const authLevel = getStudentAcademicLevel(profile);
    assert.strictEqual(authLevel.maxAllowedCumulativeSemester, rep.maxCum);

    // Call /api/results as this student (no params - all authorized)
    const reqResults = mockReq(studentUser, {});
    const resResults = mockRes();
    await academic.listResults(reqResults, resResults);
    const results = resResults.data;
    assert.ok(Array.isArray(results), 'Results must be an array');

    // Verify all returned results are <= max allowed cumulative semester
    for (const r of results) {
      const yr = Number(String(r.year_level).replace(/\D/g, '')) || 1;
      const sDigits = Number(String(r.semester).replace(/\D/g, '')) || 1;
      const cum = (sDigits >= 3 && sDigits <= 8) ? sDigits : ((yr - 1) * 2 + sDigits);
      assert.ok(
        cum <= rep.maxCum,
        `Result ${r.subject} (${r.year_level} ${r.semester}) cumulative ${cum} exceeds max allowed ${rep.maxCum} for ${rep.label}`
      );
    }

    // Call /api/results/ai-analysis
    const reqAi = mockReq(studentUser);
    const resAi = mockRes();
    await academic.aiResults(reqAi, resAi);
    const aiData = resAi.data;
    assert.ok(aiData.trend, 'AI analysis must return trend');
    assert.strictEqual(aiData.trend.length, rep.maxCum, `Trend must have exactly ${rep.maxCum} points for ${rep.label}`);

    for (const item of aiData.trend) {
      const yr = Number(String(item.yearLevel || item.label).match(/E([1-4])/)?.[1]) || 1;
      const semDigits = Number(String(item.semester || item.label).match(/Sem([1-8])/)?.[1]) || 1;
      const cum = (semDigits >= 3 && semDigits <= 8) ? semDigits : ((yr - 1) * 2 + semDigits);
      assert.ok(
        cum <= rep.maxCum,
        `AI Trend ${item.label} exceeds max allowed cumulative ${rep.maxCum} for ${rep.label}`
      );
    }

    // Call /api/attendance
    const reqAtt = mockReq(studentUser);
    const resAtt = mockRes();
    await academic.getAttendance(reqAtt, resAtt);
    const attData = resAtt.data;
    assert.ok(Array.isArray(attData.records), 'Attendance records must be an array');

    // Call /api/timetable
    const reqTt = mockReq(studentUser);
    const resTt = mockRes();
    await campus.listTimetable(reqTt, resTt);
    const ttData = resTt.data;
    assert.ok(Array.isArray(ttData), 'Timetable must be an array');

    console.log(`✅ [${rep.label}] ${rep.studentId}: Yr ${profile.year}, Cohort ${profile.cohort}, Sem ${profile.semester} (Cum ${profile.cumulative_semester}) — CGPA: ${profile.cgpa} — Trend points: ${aiData.trend.length}/${rep.maxCum} — ALL CHECKS PASSED`);
  }

  console.log('\n--- TEST 2: NEGATIVE & SECURITY TESTS ---');

  // Negative Test A: E1 attempts to request Year 2
  const e1User = await prisma.user.findFirst({ where: { student: { studentId: 'O240001' } } });
  const reqE1_Y2 = mockReq(e1User, { year_level: 'E2' });
  const resE1_Y2 = mockRes();
  await academic.listResults(reqE1_Y2, resE1_Y2);
  assert.strictEqual(resE1_Y2.data.length, 0, 'E1 requesting Year 2 must return empty array');
  console.log('✅ Negative Test: E1 attempts to request Year 2 → BLOCKED (0 records returned)');

  // Negative Test B: E1 attempts to request Semester 3
  const reqE1_S3 = mockReq(e1User, { semester: '3' });
  const resE1_S3 = mockRes();
  await academic.listResults(reqE1_S3, resE1_S3);
  assert.strictEqual(resE1_S3.data.length, 0, 'E1 requesting Semester 3 must return empty array');
  console.log('✅ Negative Test: E1 attempts to request Semester 3 → BLOCKED (0 records returned)');

  // Negative Test C: E1 in Sem 1 attempts to request Semester 2
  const reqE1_S2 = mockReq(e1User, { semester: '2' });
  const resE1_S2 = mockRes();
  await academic.listResults(reqE1_S2, resE1_S2);
  assert.strictEqual(resE1_S2.data.length, 0, 'E1 in Sem 1 requesting Semester 2 must return empty array');
  console.log('✅ Negative Test: E1 (in Sem 1) attempts to request Semester 2 → BLOCKED (0 records returned)');

  // Negative Test D: E2 attempts to request Year 3
  const e2User = await prisma.user.findFirst({ where: { student: { studentId: 'O230001' } } });
  const reqE2_Y3 = mockReq(e2User, { year_level: 'E3' });
  const resE2_Y3 = mockRes();
  await academic.listResults(reqE2_Y3, resE2_Y3);
  assert.strictEqual(resE2_Y3.data.length, 0, 'E2 requesting Year 3 must return empty array');
  console.log('✅ Negative Test: E2 attempts to request Year 3 → BLOCKED (0 records returned)');

  // Negative Test E: E2 in Sem 1 (Sem 3) attempts to request Semester 4 (Year 2 Sem 2)
  const reqE2_S4 = mockReq(e2User, { year_level: 'E2', semester: 'Sem2' });
  const resE2_S4 = mockRes();
  await academic.listResults(reqE2_S4, resE2_S4);
  assert.strictEqual(resE2_S4.data.length, 0, 'E2 (in Sem 1) requesting Year 2 Sem 2 must return empty array');
  console.log('✅ Negative Test: E2 (in S3) attempts to request Semester 4 → BLOCKED (0 records returned)');

  // Negative Test F: E2 attempts to request Semester 5
  const reqE2_S5 = mockReq(e2User, { semester: '5' });
  const resE2_S5 = mockRes();
  await academic.listResults(reqE2_S5, resE2_S5);
  assert.strictEqual(resE2_S5.data.length, 0, 'E2 requesting Semester 5 must return empty array');
  console.log('✅ Negative Test: E2 attempts to request Semester 5 → BLOCKED (0 records returned)');

  // Negative Test G: E3 attempts to request Year 4
  const e3User = await prisma.user.findFirst({ where: { student: { studentId: 'O220801' } } });
  const reqE3_Y4 = mockReq(e3User, { year_level: 'E4' });
  const resE3_Y4 = mockRes();
  await academic.listResults(reqE3_Y4, resE3_Y4);
  assert.strictEqual(resE3_Y4.data.length, 0, 'E3 requesting Year 4 must return empty array');
  console.log('✅ Negative Test: E3 attempts to request Year 4 → BLOCKED (0 records returned)');

  // Negative Test H: E3 in Sem 1 (Sem 5) attempts to request Semester 6 (Year 3 Sem 2)
  const reqE3_S6 = mockReq(e3User, { year_level: 'E3', semester: 'Sem2' });
  const resE3_S6 = mockRes();
  await academic.listResults(reqE3_S6, resE3_S6);
  assert.strictEqual(resE3_S6.data.length, 0, 'E3 (in Sem 1) requesting Year 3 Sem 2 must return empty array');
  console.log('✅ Negative Test: E3 (in S5) attempts to request Semester 6 → BLOCKED (0 records returned)');

  // Negative Test I: E3 attempts to request Semester 7
  const reqE3_S7 = mockReq(e3User, { semester: '7' });
  const resE3_S7 = mockRes();
  await academic.listResults(reqE3_S7, resE3_S7);
  assert.strictEqual(resE3_S7.data.length, 0, 'E3 requesting Semester 7 must return empty array');
  console.log('✅ Negative Test: E3 attempts to request Semester 7 → BLOCKED (0 records returned)');

  // Negative Test J: E4 in Sem 1 (Sem 7) attempts to request Semester 8 (Year 4 Sem 2)
  const e4User = await prisma.user.findFirst({ where: { student: { studentId: 'O211001' } } });
  const reqE4_S8 = mockReq(e4User, { year_level: 'E4', semester: 'Sem2' });
  const resE4_S8 = mockRes();
  await academic.listResults(reqE4_S8, resE4_S8);
  assert.strictEqual(resE4_S8.data.length, 0, 'E4 (in Sem 1) requesting Year 4 Sem 2 must return empty array');
  console.log('✅ Negative Test: E4 (in S7) attempts to request Semester 8 → BLOCKED (0 records returned)');

  // Negative Test K: IDOR - Student A passes Student B's student_id in query
  const reqIdor = mockReq(e1User, { student_id: 'O210001' });
  const resIdor = mockRes();
  await academic.listResults(reqIdor, resIdor);
  // Backend must ONLY return authenticated student (O240001)'s authorized results
  for (const r of resIdor.data) {
    assert.strictEqual(r.student_id, 'O240001', 'Backend must ignore student_id query parameter (IDOR protected)');
  }
  console.log('✅ Negative Test: Student A attempts to request Student B results via query param → BLOCKED (Only Student A records returned)');

  // Test Admin Access: Admin retains full access
  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  assert.ok(adminUser, 'Admin user must exist');
  const reqAdmin = mockReq(adminUser, { page: 1, limit: 10 });
  const resAdmin = mockRes();
  await admin.adminStudents(reqAdmin, resAdmin);
  assert.ok(resAdmin.data.items.length > 0, 'Admin must see student list');
  console.log('✅ Admin Access: Admin retains complete dataset access according to permissions');

  console.log('\n====================================================');
  console.log('ALL REPRESENTATIVE VALIDATIONS AND NEGATIVE TESTS PASSED! 🎉');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('TEST FAILED ❌:', err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
