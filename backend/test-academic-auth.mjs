import assert from 'assert';
import {
  getStudentAcademicLevel,
  isAcademicTermAuthorized,
  buildAuthorizedResultWhere,
} from './src/services/academic-auth.js';

console.log('=== TESTING ACADEMIC AUTHORIZATION LOGIC ===\n');

// 1. E1 Student, Semester 1
const e1_s1 = getStudentAcademicLevel({ year: 1, semester: 1, studentId: 'O240001' });
assert.strictEqual(e1_s1.year, 1);
assert.strictEqual(e1_s1.currentTermSemester, 1);
assert.strictEqual(e1_s1.currentCumulativeSemester, 1);
assert.strictEqual(e1_s1.maxAllowedYear, 1);
assert.deepStrictEqual(e1_s1.authorizedYears, [1]);
assert.strictEqual(e1_s1.authorizedTerms.length, 1);
assert.strictEqual(e1_s1.authorizedTerms[0].yearLevel, 'E1');
assert.strictEqual(e1_s1.authorizedTerms[0].termSemester, 1);

// E1 S1 checks
assert.strictEqual(isAcademicTermAuthorized(e1_s1, 'E1', 'Sem1'), true);
assert.strictEqual(isAcademicTermAuthorized(e1_s1, 'E1', '1'), true);
assert.strictEqual(isAcademicTermAuthorized(e1_s1, 'E1', 'Sem2'), false, 'E1 S1 cannot see E1 S2');
assert.strictEqual(isAcademicTermAuthorized(e1_s1, 'E1', '2'), false);
assert.strictEqual(isAcademicTermAuthorized(e1_s1, 'E2', 'Sem1'), false, 'E1 cannot see E2');
assert.strictEqual(isAcademicTermAuthorized(e1_s1, 'E2', '1'), false);
assert.strictEqual(isAcademicTermAuthorized(e1_s1, 'E3', 'Sem1'), false, 'E1 cannot see E3');
assert.strictEqual(isAcademicTermAuthorized(e1_s1, 'E4', 'Sem1'), false, 'E1 cannot see E4');
assert.strictEqual(isAcademicTermAuthorized(e1_s1, null, '3'), false, 'E1 cannot see Sem 3');
console.log('✅ E1 Semester 1 test passed');

// 2. E1 Student, Semester 2
const e1_s2 = getStudentAcademicLevel({ year: 1, semester: 2, studentId: 'O240002' });
assert.strictEqual(e1_s2.currentTermSemester, 2);
assert.strictEqual(e1_s2.currentCumulativeSemester, 2);
assert.strictEqual(e1_s2.authorizedTerms.length, 2);
assert.strictEqual(isAcademicTermAuthorized(e1_s2, 'E1', 'Sem1'), true);
assert.strictEqual(isAcademicTermAuthorized(e1_s2, 'E1', 'Sem2'), true);
assert.strictEqual(isAcademicTermAuthorized(e1_s2, 'E2', 'Sem1'), false);
assert.strictEqual(isAcademicTermAuthorized(e1_s2, null, '3'), false);
console.log('✅ E1 Semester 2 test passed');

// 3. E2 Student, Semester 1 (Semester 3 overall)
const e2_s1 = getStudentAcademicLevel({ year: 2, semester: 1, studentId: 'O230001' });
assert.strictEqual(e2_s1.year, 2);
assert.strictEqual(e2_s1.currentTermSemester, 1);
assert.strictEqual(e2_s1.currentCumulativeSemester, 3);
assert.strictEqual(e2_s1.maxAllowedYear, 2);
assert.deepStrictEqual(e2_s1.authorizedYears, [1, 2]);
assert.strictEqual(e2_s1.authorizedTerms.length, 3); // E1-S1, E1-S2, E2-S1
assert.strictEqual(isAcademicTermAuthorized(e2_s1, 'E1', 'Sem1'), true);
assert.strictEqual(isAcademicTermAuthorized(e2_s1, 'E1', 'Sem2'), true);
assert.strictEqual(isAcademicTermAuthorized(e2_s1, 'E2', 'Sem1'), true);
assert.strictEqual(isAcademicTermAuthorized(e2_s1, 'E2', '1'), true);
assert.strictEqual(isAcademicTermAuthorized(e2_s1, 'E2', 'Sem2'), false, 'E2 S1 CANNOT see E2 S2!');
assert.strictEqual(isAcademicTermAuthorized(e2_s1, 'E2', '2'), false);
assert.strictEqual(isAcademicTermAuthorized(e2_s1, null, '4'), false, 'E2 S1 CANNOT see Sem 4!');
assert.strictEqual(isAcademicTermAuthorized(e2_s1, 'E3', 'Sem1'), false, 'E2 CANNOT see E3');
assert.strictEqual(isAcademicTermAuthorized(e2_s1, 'E4', 'Sem1'), false, 'E2 CANNOT see E4');
assert.strictEqual(isAcademicTermAuthorized(e2_s1, null, '5'), false, 'E2 CANNOT see Sem 5');
console.log('✅ E2 Semester 1 (Semester 3) test passed');

// 4. E2 Student, Semester 2 (Semester 4 overall)
const e2_s2 = getStudentAcademicLevel({ year: 2, semester: 2, studentId: 'O230002' });
assert.strictEqual(e2_s2.currentTermSemester, 2);
assert.strictEqual(e2_s2.currentCumulativeSemester, 4);
assert.strictEqual(e2_s2.authorizedTerms.length, 4);
assert.strictEqual(isAcademicTermAuthorized(e2_s2, 'E1', 'Sem1'), true);
assert.strictEqual(isAcademicTermAuthorized(e2_s2, 'E1', 'Sem2'), true);
assert.strictEqual(isAcademicTermAuthorized(e2_s2, 'E2', 'Sem1'), true);
assert.strictEqual(isAcademicTermAuthorized(e2_s2, 'E2', 'Sem2'), true);
assert.strictEqual(isAcademicTermAuthorized(e2_s2, 'E3', 'Sem1'), false, 'E2 CANNOT see E3');
assert.strictEqual(isAcademicTermAuthorized(e2_s2, null, '5'), false, 'E2 CANNOT see Sem 5');
console.log('✅ E2 Semester 2 (Semester 4) test passed');

// 5. E3 Student, Semester 1 (Semester 5 overall)
const e3_s1 = getStudentAcademicLevel({ year: 3, semester: 1, studentId: 'O220001' });
assert.strictEqual(e3_s1.year, 3);
assert.strictEqual(e3_s1.currentTermSemester, 1);
assert.strictEqual(e3_s1.currentCumulativeSemester, 5);
assert.strictEqual(isAcademicTermAuthorized(e3_s1, 'E1', 'Sem1'), true);
assert.strictEqual(isAcademicTermAuthorized(e3_s1, 'E2', 'Sem2'), true);
assert.strictEqual(isAcademicTermAuthorized(e3_s1, 'E3', 'Sem1'), true);
assert.strictEqual(isAcademicTermAuthorized(e3_s1, 'E3', 'Sem2'), false, 'E3 S1 CANNOT see E3 S2');
assert.strictEqual(isAcademicTermAuthorized(e3_s1, 'E4', 'Sem1'), false, 'E3 CANNOT see E4');
assert.strictEqual(isAcademicTermAuthorized(e3_s1, null, '6'), false);
assert.strictEqual(isAcademicTermAuthorized(e3_s1, null, '7'), false, 'E3 CANNOT see Sem 7');
console.log('✅ E3 Semester 1 (Semester 5) test passed');

// 6. E4 Student, Semester 1 (Semester 7 overall)
const e4_s1 = getStudentAcademicLevel({ year: 4, semester: 1, studentId: 'O210001' });
assert.strictEqual(e4_s1.year, 4);
assert.strictEqual(e4_s1.currentTermSemester, 1);
assert.strictEqual(e4_s1.currentCumulativeSemester, 7);
assert.strictEqual(isAcademicTermAuthorized(e4_s1, 'E4', 'Sem1'), true);
assert.strictEqual(isAcademicTermAuthorized(e4_s1, 'E4', 'Sem2'), false, 'E4 S1 CANNOT see E4 S2');
assert.strictEqual(isAcademicTermAuthorized(e4_s1, null, '8'), false);
console.log('✅ E4 Semester 1 (Semester 7) test passed');

// 7. E4 Student, Semester 2 (Semester 8 overall)
const e4_s2 = getStudentAcademicLevel({ year: 4, semester: 2, studentId: 'O210002' });
assert.strictEqual(e4_s2.currentTermSemester, 2);
assert.strictEqual(e4_s2.currentCumulativeSemester, 8);
assert.strictEqual(isAcademicTermAuthorized(e4_s2, 'E4', 'Sem1'), true);
assert.strictEqual(isAcademicTermAuthorized(e4_s2, 'E4', 'Sem2'), true);
console.log('✅ E4 Semester 2 (Semester 8) test passed');

// 8. Test Prisma Filter Builder
const filterE2S1 = buildAuthorizedResultWhere(e2_s1, { year_level: 'E2', semester: 'Sem1' });
assert.ok(filterE2S1 !== null, 'E2 S1 query must generate filter');
assert.strictEqual(filterE2S1.studentId, 'O230001');

const filterE2S2 = buildAuthorizedResultWhere(e2_s1, { year_level: 'E2', semester: 'Sem2' });
assert.strictEqual(filterE2S2, null, 'Unauthorized request must return null (blocked)');

const filterE2_E3 = buildAuthorizedResultWhere(e2_s1, { year_level: 'E3' });
assert.strictEqual(filterE2_E3, null, 'E3 request for E2 student must return null');

console.log('✅ Prisma filter builder tests passed');
console.log('\nALL ACADEMIC AUTHORIZATION LOGIC VERIFIED SUCCESSFULLY! 🚀');
