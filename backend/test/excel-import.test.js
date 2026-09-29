import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCampusWorkbook } from '../src/services/excel-import.js';

const fixture = () => ({
  sheetNames: ['Student_Master', 'Faculty_Master'],
  students: [{ student_id: 'O240001', entry_level: 'E1', student_name: 'Demo Student', department_code: 'CS', student_email: 's@example.edu', data_status: 'SYNTHETIC / DEMONSTRATION DATA', academic_year: '2024-25' }],
  faculty: [{ faculty_id: 'FAC001', faculty_name: 'Demo Faculty', department_code: 'CS', email: 'f@example.edu', data_status: 'SYNTHETIC / DEMONSTRATION DATA' }],
  departments: [{ department_code: 'CS' }], branches: [], subjects: [{ course_code: 'CS101', entry_level: 'E1', semester: '1', course_category: 'CORE', credits: 3, ltp: '3-0-0' }], programs: [], academicBatches: [], sections: [], grades: [],
  academicRecords: [], semesterResults: [], facultyAssignments: [], advisors: [], facultyLeaves: [],
});

test('validates identifiers and marks explicitly synthetic sources', () => {
  const report = validateCampusWorkbook(fixture());
  assert.equal(report.errorCount, 0);
  assert.equal(report.synthetic, true);
  assert.equal(report.importAllowed, false);
});

test('rejects malformed and duplicate IDs or emails', () => {
  const data = fixture();
  data.students.push({ ...data.students[0], student_email: 's@example.edu' });
  data.students.push({ ...data.students[0], student_id: 'not-campus-id', student_email: 'bad-email' });
  const report = validateCampusWorkbook(data);
  assert.ok(report.errorCount > 0);
  assert.equal(report.students.duplicateEmails, 1);
  assert.ok(report.students.errors.some((row) => row.errors.some((e) => e.includes('Duplicate student_id'))));
});

test('flags unconfirmed branches, missing department definitions, and conflicting subject variants', () => {
  const data = fixture();
  data.branches.push({ branch_code: 'EE', confirmation_status: 'REQUIRES USER CONFIRMATION' });
  data.faculty[0].department_code = 'MM';
  data.faculty[0].department = 'Mechanical Engineering';
  data.subjects.push({ ...data.subjects[0], course_category: 'ELECTIVE' });
  const report = validateCampusWorkbook(data);
  assert.equal(report.requiresConfirmationBranches, 1);
  assert.equal(report.requiresConfirmationDepartments[0].code, 'MM');
  assert.deepEqual(report.requiresConfirmationSubjects, ['CS101']);
});




test('routes realtime events only to matching roles or targeted accounts', async () => {
  const { subscribeEvents, publishEvent, connectedClients } = await import('../src/services/events.js');
  const createClient = (role, id) => {
    const chunks = [];
    let close;
    const req = { user: { role, id }, on(_event, callback) { close = callback; } };
    const res = { status() { return this; }, set() { return this; }, flushHeaders() {}, write(chunk) { chunks.push(chunk); } };
    subscribeEvents(req, res);
    return { chunks, close };
  };
  const admin = createClient('admin', 'a1');
  const faculty = createClient('faculty', 'f1');
  const student = createClient('student', 's1');
  const otherStudent = createClient('student', 's2');
  publishEvent({ type: 'student.updated', roles: ['admin', 'faculty'], userIds: ['s1'] });
  assert.equal(admin.chunks.length, 2);
  assert.equal(faculty.chunks.length, 2);
  assert.equal(student.chunks.length, 2);
  assert.equal(otherStudent.chunks.length, 1);
  admin.close(); faculty.close(); student.close(); otherStudent.close();
  assert.equal(connectedClients(), 0);
});




