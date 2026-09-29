import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '../config/prisma.js';
import { audit } from '../services/audit.js';
import { publishEvent } from '../services/events.js';
import { isValidEmail, parseCampusWorkbook, validateCampusWorkbook } from '../services/excel-import.js';

const numberOrNull = (value) => value === '' || value == null || !Number.isFinite(Number(value)) ? null : Number(value);

function dateValue(value) {
  if (!value) return null;
  const date = value instanceof Date
    ? value
    : typeof value === 'number'
      ? new Date(Date.UTC(1899, 11, 30) + value * 24 * 60 * 60 * 1000)
      : new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function toLevel(value) {
  const match = String(value || '').match(/[1-4]/);
  return match ? `E${match[0]}` : 'E1';
}

async function previewRows(buffer) {
  const data = parseCampusWorkbook(buffer);
  const report = validateCampusWorkbook(data);
  const existingStudents = await prisma.student.count();
  const existingFaculty = await prisma.faculty.count();
  report.database = { existingStudents, existingFaculty };
  return { data, report };
}

export async function previewImport(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Choose an Excel workbook to preview.' });
  const { report } = await previewRows(req.file.buffer);
  res.json(report);
}

export async function importWorkbook(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Choose an Excel workbook to import.' });
  const { data, report } = await previewRows(req.file.buffer);
  const allowSynthetic = req.body.allowSynthetic === 'true';
  const allowUnconfirmedStructure = req.body.allowUnconfirmedStructure === 'true';
  if (report.errorCount) return res.status(422).json({ error: 'Workbook validation failed', report });
  if (report.synthetic && !allowSynthetic) {
    return res.status(409).json({ error: 'This workbook is explicitly marked synthetic/demo data. Confirm allowSynthetic to load it into this database.', report });
  }
  if ((report.requiresConfirmationBranches || report.requiresConfirmationDepartments?.length || report.requiresConfirmationSubjects?.length) && !allowUnconfirmedStructure) {
    return res.status(409).json({ error: 'The workbook contains branch, department, or subject structures marked or inferred as requiring confirmation. Review and explicitly confirm before importing.', report });
  }

  const result = await prisma.$transaction(async (tx) => {
    const departments = new Map();
    for (const row of data.departments) {
      const code = String(row.department_code || '').trim().toUpperCase();
      const name = String(row.department || '').trim();
      if (!code || !name) continue;
      const department = await tx.department.upsert({
        where: { code },
        update: { name, confirmationStatus: 'CONFIRMED', sourceType: 'Department_Master' },
        create: { code, name, confirmationStatus: 'CONFIRMED', sourceType: 'Department_Master' },
      });
      departments.set(code, department);
    }

    for (const missing of report.requiresConfirmationDepartments || []) {
      const department = await tx.department.upsert({
        where: { code: missing.code },
        update: { name: missing.name, confirmationStatus: 'REQUIRES CONFIRMATION', sourceType: 'Faculty_Master only' },
        create: { code: missing.code, name: missing.name, confirmationStatus: 'REQUIRES CONFIRMATION', sourceType: 'Faculty_Master only' },
      });
      departments.set(missing.code, department);
    }

    const programs = new Map();
    for (const row of data.programs) {
      const code = String(row.program_code || '').trim().toUpperCase();
      const name = String(row.program || '').trim();
      if (!code || !name) continue;
      const program = await tx.academicProgram.upsert({
        where: { code },
        update: { name, durationYears: Number(row.duration_years) || null, totalCredits: Number(row.total_credits) || null, sourceType: String(row.source_type || '').trim() || null },
        create: { code, name, durationYears: Number(row.duration_years) || null, totalCredits: Number(row.total_credits) || null, sourceType: String(row.source_type || '').trim() || null },
      });
      programs.set(code, program);
    }

    const academicBatches = new Map();
    for (const row of data.academicBatches) {
      const name = String(row.batch || '').trim();
      if (!name) continue;
      const years = name.match(/(20\d{2})\D+(\d{2}|20\d{2})/);
      const startYear = years ? Number(years[1]) : null;
      const endYear = years ? (Number(years[2]) < 100 ? Math.floor(startYear / 100) * 100 + Number(years[2]) : Number(years[2])) : null;
      const batch = await tx.academicBatch.upsert({
        where: { name },
        update: { description: String(row.batch_description || '').trim() || null, sourceType: String(row.source_type || '').trim() || null, syntheticUse: String(row.synthetic_use || '').trim() || null, startYear, endYear },
        create: { name, description: String(row.batch_description || '').trim() || null, sourceType: String(row.source_type || '').trim() || null, syntheticUse: String(row.synthetic_use || '').trim() || null, startYear, endYear },
      });
      academicBatches.set(name, batch);
    }

    for (const row of data.grades) {
      const grade = String(row.grade || '').trim();
      if (!grade) continue;
      await tx.gradeScale.upsert({
        where: { grade },
        update: { minimumMarks: numberOrNull(row.minimum_marks), maximumMarks: numberOrNull(row.maximum_marks), gradePoint: numberOrNull(row.grade_point), resultStatus: String(row.result_status || '').trim() || null },
        create: { grade, minimumMarks: numberOrNull(row.minimum_marks), maximumMarks: numberOrNull(row.maximum_marks), gradePoint: numberOrNull(row.grade_point), resultStatus: String(row.result_status || '').trim() || null },
      });
    }

    const branches = new Map();
    for (const row of data.branches) {
      const code = String(row.branch_code || '').trim().toUpperCase();
      const departmentCode = String(row.department_code || '').trim().toUpperCase();
      const department = departments.get(departmentCode);
      if (!code || !department) continue;
      const branch = await tx.branch.upsert({
        where: { code },
        update: {
          name: String(row.branch || '').trim(),
          departmentId: department.id,
          confirmationStatus: String(row.confirmation_status || 'CONFIRMED').trim(),
          sourceType: String(row.source_type || '').trim() || null,
        },
        create: {
          code,
          name: String(row.branch || '').trim(),
          departmentId: department.id,
          confirmationStatus: String(row.confirmation_status || 'CONFIRMED').trim(),
          sourceType: String(row.source_type || '').trim() || null,
        },
      });
      branches.set(code, branch);
    }

    const subjectCache = new Map();
    const subjectMeta = new Map(data.subjects.map((row) => [String(row.course_code || '').trim().toUpperCase(), row]));
    const confirmationSubjectCodes = new Set(report.requiresConfirmationSubjects || []);
    for (const row of data.subjects) {
      const code = String(row.course_code || '').trim().toUpperCase();
      const departmentCode = String(row.department_code || row.branch_code || 'CS').trim().toUpperCase();
      const department = departments.get(departmentCode) || departments.values().next().value;
      if (!code || !department) continue;
      const values = {
        name: String(row.course_name || '').trim() || code,
        entryLevel: null, semester: null, category: null, ltp: null, credits: null, sourceDocument: null,
        curriculumScope: 'Detailed structure is preserved in subject_offerings.',
        sourceType: 'Subject_Master',
        confirmationStatus: confirmationSubjectCodes.has(code) ? 'REQUIRES CONFIRMATION' : 'CONFIRMED',
      };
      const subject = await tx.subject.upsert({
        where: { code_departmentId: { code, departmentId: department.id } },
        update: values,
        create: { code, departmentId: department.id, ...values },
      });
      subjectCache.set(`${department.code}:${code}`, subject);
    }

    const ensureSubject = async (codeValue, department, fallback = {}) => {
      const code = String(codeValue || '').trim().toUpperCase();
      if (!code || !department) return null;
      const key = `${department.code}:${code}`;
      if (subjectCache.has(key)) return subjectCache.get(key);
      const source = subjectMeta.get(code) || fallback;
      const scope = String(fallback.curriculum_scope || source.curriculum_scope || '').trim() || null;
      const needsConfirmation = department.confirmationStatus === 'REQUIRES CONFIRMATION' ||
        department.code !== 'CS' || /requires/i.test(scope || '') || confirmationSubjectCodes.has(code);
      const details = {
        name: String(fallback.course_name || source.course_name || code).trim(),
        entryLevel: String(source.entry_level || '').trim() || null,
        semester: String(fallback.semester || source.semester || '').trim() || null,
        category: String(fallback.course_category || source.course_category || '').trim() || null,
        ltp: String(fallback.ltp || source.ltp || '').trim() || null,
        credits: numberOrNull(fallback.credits ?? source.credits),
        sourceDocument: String(source.source_document || '').trim() || null,
        curriculumScope: scope,
        sourceType: String(source.source_type || '').trim() || null,
        confirmationStatus: needsConfirmation ? 'REQUIRES CONFIRMATION' : 'CONFIRMED',
      };
      const record = await tx.subject.upsert({
        where: { code_departmentId: { code, departmentId: department.id } },
        update: details,
        create: { code, departmentId: department.id, ...details },
      });
      subjectCache.set(key, record);
      return record;
    };

    const subjectOfferings = [];
    for (const row of data.subjects) {
      const department = departments.get(String(row.department_code || 'CS').trim().toUpperCase()) || departments.get('CS');
      const subject = await ensureSubject(row.course_code, department, row);
      if (!subject) continue;
      subjectOfferings.push({
        subjectId: subject.id,
        entryLevel: String(row.entry_level || '').trim(),
        semester: String(row.semester || '').trim(),
        category: String(row.course_category || '').trim(),
        ltp: String(row.ltp || '').trim() || null,
        credits: numberOrNull(row.credits),
        sourceDocument: String(row.source_document || '').trim() || null,
        sourceType: String(row.source_type || '').trim() || null,
        curriculumScope: String(row.curriculum_scope || '').trim() || null,
        confirmationStatus: /requires/i.test(String(row.curriculum_scope || '')) || confirmationSubjectCodes.has(String(row.course_code).trim().toUpperCase()) ? 'REQUIRES CONFIRMATION' : 'CONFIRMED',
        sourceStatus: 'workbook-source',
      });
    }
    for (let start = 0; start < subjectOfferings.length; start += 1000) {
      await tx.subjectOffering.createMany({ data: subjectOfferings.slice(start, start + 1000), skipDuplicates: true });
    }

    let studentsCreated = 0;
    let studentsUpdated = 0;
    let facultyCreated = 0;
    let facultyUpdated = 0;
    for (const row of data.students) {
      const studentId = String(row.student_id).trim();
      const email = String(row.student_email).trim().toLowerCase();
      const name = String(row.student_name).trim();
      const deptCode = String(row.department_code).trim().toUpperCase();
      const department = departments.get(deptCode);
      if (!department || !isValidEmail(email)) throw new Error(`Student ${studentId} has an unresolved department or invalid email`);
      const courseName = String(row.program || 'B.Tech').trim();
      const courseCode = String(row.program_code || 'BTECH').trim().toUpperCase();
      const course = await tx.course.upsert({
        where: { code_departmentId: { code: courseCode, departmentId: department.id } },
        update: { name: courseName, programId: programs.get(String(row.program_code || '').trim().toUpperCase())?.id || null },
        create: { code: courseCode, name: courseName, departmentId: department.id, programId: programs.get(String(row.program_code || '').trim().toUpperCase())?.id || null },
      });
      const yearLevel = toLevel(row.entry_level);
      let batch = await tx.batch.findFirst({ where: { courseId: course.id, yearLevel } });
      if (!batch) batch = await tx.batch.create({ data: { name: `${yearLevel}-${deptCode}`, yearLevel, courseId: course.id } });
      const section = String(row.section || 'A').trim().toUpperCase();
      const classroom = await tx.class.upsert({
        where: { batchId_section: { batchId: batch.id, section } },
        update: {},
        create: { batchId: batch.id, section },
      });
      const old = await tx.student.findUnique({ where: { studentId } });
      const emailUser = await tx.user.findUnique({ where: { email } });
      if (emailUser && emailUser.id !== old?.userId) throw new Error(`Email ${email} is already assigned to another account`);
      const sourceStatus = String(row.data_status || 'source-import').trim();
      const year = Number(row.year || yearLevel.slice(1)) || Number(yearLevel.slice(1));
      const studentData = {
        studentId,
        collegeId: String(row.college_id || '').trim() || null,
        year,
        section,
        courseName,
        deptCode,
        departmentId: department.id,
        courseId: course.id,
        classId: classroom.id,
        branchId: branches.get(String(row.branch_code || '').trim().toUpperCase())?.id || null,
        gender: String(row.gender || '').trim() || null,
        dateOfBirth: dateValue(row.date_of_birth),
        academicYear: String(row.academic_year || '').trim() || null,
        academicStatus: String(row.academic_status || row.student_status || '').trim() || null,
        rank: row.rank === '' || row.rank == null ? null : Number(row.rank),
        pucCgpa: row.puc_cgpa === '' || row.puc_cgpa == null ? null : Number(row.puc_cgpa),
        academicBatchId: academicBatches.get(String(row.batch || '').trim())?.id || null,
        cgpa: Number(row.current_cgpa) || 0,
        sourceStatus,
        sourceSheet: 'Student_Master',
        active: !/inactive|withdrawn|graduated/i.test(String(row.student_status || '')),
      };
      if (old) {
        await tx.user.update({ where: { id: old.userId }, data: { email, name, status: studentData.active ? 'active' : 'inactive', version: { increment: 1 } } });
        await tx.student.update({ where: { id: old.id }, data: { ...studentData, version: { increment: 1 } } });
        studentsUpdated += 1;
      } else {
        const password = randomBytes(32).toString('hex');
        const user = await tx.user.create({ data: { email, name, password: await bcrypt.hash(password, 10), role: 'student', status: studentData.active ? 'active' : 'inactive' } });
        await tx.student.create({ data: { ...studentData, userId: user.id } });
        studentsCreated += 1;
      }
    }

    for (const row of data.faculty) {
      const facultyId = String(row.faculty_id).trim();
      const email = String(row.email).trim().toLowerCase();
      const employeeId = String(row.employee_id || '').trim() || null;
      const department = departments.get(String(row.department_code).trim().toUpperCase());
      if (!department || !isValidEmail(email)) throw new Error(`Faculty ${facultyId} has an unresolved department or invalid email`);
      const old = await tx.faculty.findUnique({ where: { facultyId } });
      const emailUser = await tx.user.findUnique({ where: { email } });
      if (emailUser && emailUser.id !== old?.userId) throw new Error(`Email ${email} is already assigned to another account`);
      if (employeeId) {
        const employeeOwner = await tx.faculty.findUnique({ where: { employeeId } });
        if (employeeOwner && employeeOwner.facultyId !== facultyId) throw new Error(`Employee ID ${employeeId} is already assigned to another faculty record`);
      }
      const values = {
        facultyId,
        employeeId,
        designation: String(row.designation || 'Requires confirmation').trim(),
        mobile: String(row.phone || '').trim() || null,
        subjectsText: '',
        deptCode: department.code,
        departmentId: department.id,
        gender: String(row.gender || '').trim() || null,
        qualification: String(row.qualification || '').trim() || null,
        specialization: String(row.specialization || '').trim() || null,
        experienceYears: row.experience_years === '' || row.experience_years == null ? null : Number(row.experience_years),
        joiningDate: dateValue(row.date_of_joining),
        employmentType: String(row.employment_type || '').trim() || null,
        officeRoom: String(row.office_room || '').trim() || null,
        campus: String(row.campus || '').trim() || null,
        sourceStatus: String(row.data_status || 'source-import').trim(),
        sourceSheet: 'Faculty_Master',
        active: !/inactive|separated|resigned/i.test(String(row.faculty_status || '')),
      };
      if (old) {
        await tx.user.update({ where: { id: old.userId }, data: { email, name: String(row.faculty_name).trim(), status: values.active ? 'active' : 'inactive', version: { increment: 1 } } });
        await tx.faculty.update({ where: { id: old.id }, data: { ...values, version: { increment: 1 } } });
        facultyUpdated += 1;
      } else {
        const password = randomBytes(32).toString('hex');
        const user = await tx.user.create({ data: { email, name: String(row.faculty_name).trim(), password: await bcrypt.hash(password, 10), role: 'faculty', status: values.active ? 'active' : 'inactive' } });
        await tx.faculty.create({ data: { ...values, userId: user.id } });
        facultyCreated += 1;
      }
    }

    const studentById = new Map(data.students.map((row) => [String(row.student_id).trim(), row]));
    const studentDepartment = new Map(data.students.map((row) => [String(row.student_id).trim(), String(row.department_code).trim().toUpperCase()]));
    const academicRecords = [];
    for (const row of data.academicRecords) {
      const studentId = String(row.student_id).trim();
      const department = departments.get(studentDepartment.get(studentId));
      const subject = await ensureSubject(row.course_code, department, row);
      if (!subject) throw new Error(`Cannot resolve subject ${row.course_code} for ${studentId}`);
      academicRecords.push({
        studentId, subjectId: subject.id, semester: String(row.semester).trim(),
        academicYear: String(studentById.get(studentId)?.academic_year || 'UNSPECIFIED').trim(),
        credits: numberOrNull(row.credits), marks: numberOrNull(row.marks), grade: String(row.grade || '').trim() || null,
        gradePoint: numberOrNull(row.grade_point), creditPoints: numberOrNull(row.credit_points),
        resultStatus: String(row.result_status || '').trim() || null,
        curriculumScope: String(row.curriculum_scope || '').trim() || null,
        sourceStatus: 'SYNTHETIC / DEMONSTRATION DATA',
      });
    }
    for (let start = 0; start < academicRecords.length; start += 1000) {
      await tx.studentCourseRecord.createMany({ data: academicRecords.slice(start, start + 1000), skipDuplicates: true });
    }

    const semesterRows = [];
    for (const row of data.semesterResults) {
      const studentId = String(row.student_id).trim();
      const student = studentById.get(studentId);
      semesterRows.push({
        studentId,
        yearLevel: toLevel(student?.entry_level),
        semester: String(row.semester).trim(),
        gpa: numberOrNull(row.sgpa) ?? 0,
        academicYear: String(row.academic_year || student?.academic_year || '').trim() || null,
        totalCredits: numberOrNull(row.total_credits), earnedCredits: numberOrNull(row.earned_credits),
        totalCreditPoints: numberOrNull(row.total_credit_points), cumulativeCredits: numberOrNull(row.cumulative_credits),
        cumulativeCreditPoints: numberOrNull(row.cumulative_credit_points),
        academicStatus: String(row.academic_status || '').trim() || null,
        sourceStatus: 'SYNTHETIC / DEMONSTRATION DATA',
      });
    }
    for (let start = 0; start < semesterRows.length; start += 1000) {
      await tx.semesterCgpa.createMany({ data: semesterRows.slice(start, start + 1000), skipDuplicates: true });
    }

    const assignmentsByKey = new Map();
    for (const row of data.facultyAssignments) {
      const department = departments.get(String(row.department_code).trim().toUpperCase());
      const subject = await ensureSubject(row.course_code, department, row);
      if (!subject) throw new Error(`Cannot resolve assigned course ${row.course_code}`);
      const assignment = {
        facultyId: String(row.faculty_id).trim(), subjectId: subject.id,
        academicYear: String(row.academic_year || '').trim(), semester: String(row.semester || '').trim(),
        role: String(row.role || '').trim() || null, status: String(row.assignment_status || 'ACTIVE').trim(),
        curriculumNote: String(row.curriculum_note || '').trim() || null,
        sourceStatus: 'SYNTHETIC / DEMONSTRATION DATA',
      };
      const assignmentKey = [assignment.facultyId, assignment.subjectId, assignment.academicYear, assignment.semester].join('|');
      if (!assignmentsByKey.has(assignmentKey)) assignmentsByKey.set(assignmentKey, assignment);
    }
    const assignments = [...assignmentsByKey.values()];
    for (let start = 0; start < assignments.length; start += 1000) {
      await tx.facultyCourseAssignment.createMany({ data: assignments.slice(start, start + 1000), skipDuplicates: true });
    }

    const advisors = data.advisors.map((row) => ({
      studentId: String(row.student_id).trim(), facultyId: String(row.faculty_id).trim(),
      academicYear: String(row.academic_year || '').trim(), status: String(row.advisor_status || 'ACTIVE').trim(), sourceStatus: 'SYNTHETIC / DEMONSTRATION DATA',
    }));
    for (let start = 0; start < advisors.length; start += 1000) {
      await tx.studentAdvisor.createMany({ data: advisors.slice(start, start + 1000), skipDuplicates: true });
    }

    const leaves = data.facultyLeaves.map((row) => ({
      id: String(row.leave_id).trim(), facultyId: String(row.faculty_id).trim(), leaveType: String(row.leave_type || '').trim(),
      startDate: dateValue(row.start_date), endDate: dateValue(row.end_date), days: numberOrNull(row.days),
      approvalStatus: String(row.approval_status || 'REQUIRES CONFIRMATION').trim(),
      academicYear: String(row.academic_year || '').trim() || null,
      sourceStatus: 'SYNTHETIC / DEMONSTRATION DATA',
    }));
    for (let start = 0; start < leaves.length; start += 1000) {
      await tx.facultyLeave.createMany({ data: leaves.slice(start, start + 1000), skipDuplicates: true });
    }

    await audit(tx, req, {
      action: 'imported', entity: 'campus_workbook',
      newValue: { studentsCreated, studentsUpdated, facultyCreated, facultyUpdated, subjectOfferings: subjectOfferings.length, academicRecords: academicRecords.length, semesterResults: semesterRows.length, facultyAssignments: assignments.length, duplicateAssignmentsSkipped: report.duplicateRows?.Faculty_Course_Assignment || 0, advisors: advisors.length, facultyLeaves: leaves.length, synthetic: report.synthetic, source: 'CampusOne-AI_Big_Student_Faculty_Dataset_Updated_IDs_Mails.xlsx' },
    });
    return { studentsCreated, studentsUpdated, facultyCreated, facultyUpdated, departments: departments.size, branches: branches.size, subjects: subjectCache.size, subjectOfferings: subjectOfferings.length, academicRecords: academicRecords.length, semesterResults: semesterRows.length, facultyAssignments: assignments.length, duplicateAssignmentsSkipped: report.duplicateRows?.Faculty_Course_Assignment || 0, advisors: advisors.length, facultyLeaves: leaves.length };
  }, { maxWait: 30000, timeout: 600000 });

  publishEvent({ type: 'campus.imported', entity: 'campus', action: 'imported', roles: ['admin', 'faculty'] });
  res.json({ message: 'Workbook imported successfully', ...result });
}

