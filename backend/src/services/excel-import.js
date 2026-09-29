import XLSX from 'xlsx';

const text = (value) => value == null ? '' : String(value).trim();
const number = (value) => value === '' || value == null ? null : Number(value);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function records(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  return sheet ? XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true }) : [];
}

export function parseCampusWorkbook(buffer) {
  // Keep raw numerics. Some numeric columns in this source workbook carry date cell styles;
  // cellDates:true incorrectly turns those values (notably student rank) into JS Date objects.
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const students = records(workbook, 'Student_Master');
  const contacts = new Map(records(workbook, 'Student_Contact').map((r) => [text(r.student_id), r]));
  return {
    sheetNames: workbook.SheetNames,
    students: students.map((r) => ({ ...r, ...(contacts.get(text(r.student_id)) || {}) })),
    faculty: records(workbook, 'Faculty_Master'),
    departments: records(workbook, 'Department_Master'),
    branches: records(workbook, 'Branch_Master'),
    subjects: records(workbook, 'Subject_Master'),
    programs: records(workbook, 'Program_Master'),
    academicBatches: records(workbook, 'Batch_Master'),
    sections: records(workbook, 'Section_Master'),
    grades: records(workbook, 'Grade_Master'),
    academicRecords: records(workbook, 'Student_Academic_Record'),
    semesterResults: records(workbook, 'Semester_Result'),
    facultyAssignments: records(workbook, 'Faculty_Course_Assignment'),
    advisors: records(workbook, 'Student_Faculty_Advisor'),
    facultyLeaves: records(workbook, 'Faculty_Leave'),
  };
}

function summary(kind, rows, identifier, validate) {
  const seen = new Set();
  const emails = new Set();
  const errors = [];
  let duplicates = 0;
  let duplicateEmails = 0;
  for (const [index, row] of rows.entries()) {
    const key = text(row[identifier]);
    const rowErrors = validate(row);
    if (!key || seen.has(key.toLowerCase())) {
      duplicates += 1;
      rowErrors.push(!key ? `Missing ${identifier}` : `Duplicate ${identifier} in workbook`);
    }
    if (key) seen.add(key.toLowerCase());
    const emailKey = text(row.student_email || row.email).toLowerCase();
    if (emailKey && emails.has(emailKey)) { duplicates += 1; duplicateEmails += 1; rowErrors.push('Duplicate email in workbook'); }
    if (emailKey) emails.add(emailKey);
    if (rowErrors.length) errors.push({ sheet: kind, row: index + 2, key, errors: rowErrors });
  }
  return { total: rows.length, valid: rows.length - errors.length, invalid: errors.length, duplicates, duplicateEmails, errors: errors.slice(0, 250) };
}

export function validateCampusWorkbook(data) {
  const students = summary('Student_Master', data.students, 'student_id', (r) => {
    const errors = [];
    const id = text(r.student_id);
    const level = text(r.entry_level).toUpperCase();
    const expected = { E1: 'O24', E2: 'O23', E3: 'O22', E4: 'O21' }[level];
    if (!/^O2[1-4]\d{4}$/.test(id)) errors.push('Student ID must follow O24/O23/O22/O21 plus four digits');
    if (expected && !id.startsWith(expected)) errors.push(`Entry level ${level} expects IDs beginning ${expected}`);
    if (!text(r.student_name)) errors.push('Missing student_name');
    if (!text(r.department_code)) errors.push('Missing department_code');
    const email = text(r.student_email).toLowerCase();
    if (!email || !emailPattern.test(email)) errors.push('Missing or invalid student email');
    return errors;
  });
  const faculty = summary('Faculty_Master', data.faculty, 'faculty_id', (r) => {
    const errors = [];
    if (!text(r.faculty_name)) errors.push('Missing faculty_name');
    if (!text(r.department_code)) errors.push('Missing department_code');
    if (!emailPattern.test(text(r.email))) errors.push('Missing or invalid faculty email');
    return errors;
  });
  const syntheticRows = [...data.students, ...data.faculty].filter((r) => /synthetic|demonstration/i.test(text(r.data_status))).length;
  const unconfirmedBranches = data.branches.filter((r) => /requires user confirmation/i.test(text(r.confirmation_status))).length;
  const masterDepartmentCodes = new Set(data.departments.map((r) => text(r.department_code).toUpperCase()));
  const confirmationDepartments = [...new Map(data.faculty
    .filter((r) => !masterDepartmentCodes.has(text(r.department_code).toUpperCase()))
    .map((r) => [text(r.department_code).toUpperCase(), { code: text(r.department_code).toUpperCase(), name: text(r.department) }])).values()];
  const offerings = new Map();
  for (const row of data.subjects) {
    const key = [text(row.course_code).toUpperCase(), text(row.entry_level), text(row.semester)].join('|');
    if (!offerings.has(key)) offerings.set(key, new Set());
    offerings.get(key).add([text(row.course_category), text(row.credits), text(row.ltp)].join('|'));
  }
  const confirmationSubjects = [...offerings.entries()]
    .filter(([, variants]) => variants.size > 1)
    .map(([key]) => key.split('|')[0]);
  const synthetic = syntheticRows === data.students.length + data.faculty.length;
  const studentIds = new Set(data.students.map((r) => text(r.student_id)));
  const facultyIds = new Set(data.faculty.map((r) => text(r.faculty_id)));
  const subjectCodes = new Set(data.subjects.map((r) => text(r.course_code).toUpperCase()));
  const relationErrors = [];
  for (const [sheet, rows, idField, validIds] of [
    ['Student_Academic_Record', data.academicRecords, 'student_id', studentIds],
    ['Semester_Result', data.semesterResults, 'student_id', studentIds],
    ['Student_Faculty_Advisor', data.advisors, 'student_id', studentIds],
    ['Faculty_Course_Assignment', data.facultyAssignments, 'faculty_id', facultyIds],
    ['Faculty_Leave', data.facultyLeaves, 'faculty_id', facultyIds],
  ]) {
    for (const [index, row] of rows.entries()) {
      if (!validIds.has(text(row[idField]))) relationErrors.push({ sheet, row: index + 2, key: text(row[idField]), errors: [`Unknown ${idField} relationship`] });
    }
  }
  for (const [sheet, rows] of [['Student_Academic_Record', data.academicRecords], ['Faculty_Course_Assignment', data.facultyAssignments]]) {
    for (const [index, row] of rows.entries()) {
      if (!subjectCodes.has(text(row.course_code).toUpperCase())) relationErrors.push({ sheet, row: index + 2, key: text(row.course_code), errors: ['course_code is not present in Subject_Master'] });
    }
  }
  const studentYear = new Map(data.students.map((row) => [text(row.student_id), text(row.academic_year)]));
  const duplicateStats = {};
  const detectDuplicateKeys = (sheet, rows, keyOf, { block = true } = {}) => {
    const seen = new Set(); let duplicates = 0;
    for (const [index, row] of rows.entries()) {
      const key = keyOf(row);
      if (!key || key.includes('undefined')) continue;
      if (seen.has(key)) {
        duplicates += 1;
        if (block) relationErrors.push({ sheet, row: index + 2, key, errors: [`Duplicate relationship key: ${key}`] });
      }
      seen.add(key);
    }
    duplicateStats[sheet] = duplicates;
  };
  detectDuplicateKeys('Student_Academic_Record', data.academicRecords, (r) => [text(r.student_id), text(r.course_code), text(r.semester), studentYear.get(text(r.student_id))].join('|'));
  detectDuplicateKeys('Semester_Result', data.semesterResults, (r) => [text(r.student_id), text(r.semester), text(r.academic_year)].join('|'));
  detectDuplicateKeys('Faculty_Course_Assignment', data.facultyAssignments, (r) => [text(r.faculty_id), text(r.course_code), text(r.academic_year), text(r.semester)].join('|'), { block: false });
  detectDuplicateKeys('Student_Faculty_Advisor', data.advisors, (r) => [text(r.student_id), text(r.academic_year)].join('|'));
  detectDuplicateKeys('Faculty_Leave', data.facultyLeaves, (r) => text(r.leave_id));
  for (const [index, row] of data.semesterResults.entries()) {
    if (!Number.isFinite(Number(row.sgpa))) relationErrors.push({ sheet: 'Semester_Result', row: index + 2, key: text(row.student_id), errors: ['Missing or invalid SGPA'] });
  }
  const errorCount = students.errors.length + faculty.errors.length + relationErrors.length;
  return {
    sheetNames: data.sheetNames,
    students,
    faculty,
    departments: data.departments.length,
    branches: data.branches,
    branchesCount: data.branches.length,
    subjects: data.subjects.length,
    subjectOfferings: data.subjects.length,
    academicRecords: data.academicRecords.length,
    semesterResults: data.semesterResults.length,
    facultyAssignments: data.facultyAssignments.length,
    advisors: data.advisors.length,
    facultyLeaves: data.facultyLeaves.length,
    duplicateRows: duplicateStats,
    syntheticRows,
    synthetic,
    requiresConfirmationBranches: unconfirmedBranches,
    requiresConfirmationDepartments: confirmationDepartments,
    requiresConfirmationSubjects: [...new Set(confirmationSubjects)],
    importAllowed: errorCount === 0 && !synthetic && !unconfirmedBranches && !confirmationDepartments.length && !confirmationSubjects.length,
    errorCount,
    errors: [...students.errors, ...faculty.errors, ...relationErrors].slice(0, 500),
  };
}

export function isValidEmail(email) {
  return emailPattern.test(text(email));
}
