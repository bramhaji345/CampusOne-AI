import { prisma } from '../config/prisma.js';

/**
 * Standardize and parse a year input (e.g. "E1", "1", 1, "e2") into an integer 1..4.
 */
export function parseYearLevel(yearInput) {
  if (yearInput == null) return null;
  const s = String(yearInput).trim().toUpperCase();
  const digits = s.replace(/\D/g, '');
  if (!digits) return null;
  const num = Number.parseInt(digits, 10);
  if (num >= 1 && num <= 4) return num;
  return null;
}

/**
 * Build all string representations for a given term semester (1 or 2) in a given year (1..4).
 * E.g. Year 2, Term 1 (cumulative 3) -> ["Sem1", "1", "S1", "Sem3", "3", "S3"]
 */
export function getSemesterStrings(year, termSemester) {
  const cumulative = (year - 1) * 2 + termSemester;
  const set = new Set([
    `Sem${termSemester}`,
    String(termSemester),
    `S${termSemester}`,
    `Sem${cumulative}`,
    String(cumulative),
    `S${cumulative}`,
  ]);
  return [...set];
}

/**
 * Determine a student's exact academic authorization boundaries.
 *
 * Rules:
 * - Year is between 1 and 4 (E1 to E4)
 * - Semester is either:
 *   - term within year: 1 or 2
 *   - cumulative degree semester: 1 to 8
 * - currentCumulativeSemester = maximum allowed academic boundary (1 to 8)
 * - All semesters <= currentCumulativeSemester are authorized
 * - All semesters > currentCumulativeSemester are UNAUTHORIZED / BLOCKED
 */
export function getStudentAcademicLevel(student) {
  const year = Math.min(Math.max(Number.parseInt(student?.year || 1, 10) || 1, 1), 4);
  const rawSem = Number.parseInt(student?.semester || 1, 10) || 1;

  let currentTermSemester = 1;
  let currentCumulativeSemester = (year - 1) * 2 + 1;

  if (rawSem === 1 || rawSem === 2) {
    currentTermSemester = rawSem;
    currentCumulativeSemester = (year - 1) * 2 + rawSem;
  } else if (rawSem >= 3 && rawSem <= 8) {
    // If stored as cumulative 1..8, clamp to this student's year boundaries
    const minSemForYear = (year - 1) * 2 + 1;
    const maxSemForYear = year * 2;
    currentCumulativeSemester = Math.min(Math.max(rawSem, minSemForYear), maxSemForYear);
    currentTermSemester = ((currentCumulativeSemester - 1) % 2) + 1;
  }

  const cohort = `E${year}`;
  const authorizedYears = [];
  const authorizedCohorts = [];
  const authorizedTerms = [];

  for (let y = 1; y <= year; y += 1) {
    authorizedYears.push(y);
    authorizedCohorts.push(`E${y}`);
    const maxTerm = (y < year) ? 2 : currentTermSemester;
    for (let t = 1; t <= maxTerm; t += 1) {
      const cum = (y - 1) * 2 + t;
      authorizedTerms.push({
        year: y,
        yearLevel: `E${y}`,
        termSemester: t,
        cumulativeSemester: cum,
        semesterStrings: getSemesterStrings(y, t),
      });
    }
  }

  return {
    studentId: student?.studentId || student?.student_id,
    branch: student?.deptCode || student?.dept || '',
    year,
    cohort,
    currentTermSemester,
    currentCumulativeSemester,
    maxAllowedYear: year,
    maxAllowedCohort: cohort,
    maxAllowedCumulativeSemester: currentCumulativeSemester,
    authorizedYears,
    authorizedCohorts,
    authorizedTerms,
  };
}

/**
 * Check if a candidate year and semester are authorized for the student.
 * If year is omitted, semester is evaluated either as cumulative (3..8) or within current year.
 * If semester is omitted, year is evaluated.
 */
export function isAcademicTermAuthorized(authLevel, yearInput, semesterInput) {
  const reqYear = parseYearLevel(yearInput);

  // If a future year was requested, strictly block
  if (reqYear != null && reqYear > authLevel.maxAllowedYear) {
    return false;
  }

  if (semesterInput == null || semesterInput === '') {
    // No semester specified; if year was specified, it was <= maxAllowedYear
    return true;
  }

  const sStr = String(semesterInput).trim();
  const digits = sStr.replace(/\D/g, '');
  if (!digits) return false;
  const semNum = Number.parseInt(digits, 10);

  // If semester is specified as cumulative (3..8)
  if (semNum >= 3 && semNum <= 8) {
    if (semNum > authLevel.maxAllowedCumulativeSemester) {
      return false; // Future semester!
    }
    if (reqYear != null && Math.ceil(semNum / 2) !== reqYear) {
      return false; // Year/sem mismatch
    }
    return true;
  }

  // If semester is specified as term (1 or 2)
  if (semNum === 1 || semNum === 2) {
    const targetYear = reqYear != null ? reqYear : authLevel.year;
    const candCumulative = (targetYear - 1) * 2 + semNum;
    return candCumulative <= authLevel.maxAllowedCumulativeSemester;
  }

  // Invalid semester number
  return false;
}

/**
 * Build Prisma where condition for Results query.
 * Returns null if the requested parameters fall outside the authorized range.
 */
export function buildAuthorizedResultWhere(authLevel, { year_level, semester, type } = {}) {
  // If user requested specific year/semester, verify authorization first
  if (year_level != null || semester != null) {
    if (!isAcademicTermAuthorized(authLevel, year_level, semester)) {
      return null; // Explicitly unauthorized
    }
  }

  // Build the authorized (yearLevel, semester) OR filters
  const reqYear = parseYearLevel(year_level);
  let relevantTerms = authLevel.authorizedTerms;

  if (reqYear != null) {
    relevantTerms = relevantTerms.filter((t) => t.year === reqYear);
  }

  if (semester != null && String(semester).trim() !== '') {
    const semStr = String(semester).trim();
    const digits = semStr.replace(/\D/g, '');
    const num = Number.parseInt(digits, 10);
    relevantTerms = relevantTerms.filter((t) => {
      if (num >= 3 && num <= 8) return t.cumulativeSemester === num;
      if (num === 1 || num === 2) return t.termSemester === num;
      return t.semesterStrings.includes(semStr);
    });
  }

  if (!relevantTerms.length) {
    return null;
  }

  // Prisma OR conditions
  const termConditions = relevantTerms.map((t) => ({
    yearLevel: t.yearLevel,
    semester: { in: t.semesterStrings },
  }));

  return {
    studentId: authLevel.studentId,
    ...(type ? { type } : {}),
    OR: termConditions,
  };
}

/**
 * Recalculate CGPA and extract semester GPA trend strictly from authorized records.
 */
export async function calculateAuthorizedStudentCgpa(studentId, authLevel) {
  // 1. Fetch authorized SemesterCgpa rows
  const termConditions = authLevel.authorizedTerms.map((t) => ({
    yearLevel: t.yearLevel,
    semester: { in: t.semesterStrings },
  }));

  const cgpaRows = await prisma.semesterCgpa.findMany({
    where: {
      studentId,
      OR: termConditions,
    },
    orderBy: [{ yearLevel: 'asc' }, { semester: 'asc' }],
  });

  // Normalize semester label
  const seenTerms = new Set();
  const trend = [];
  let totalGpa = 0;
  let count = 0;

  for (const r of cgpaRows) {
    const yr = parseYearLevel(r.yearLevel) || 1;
    const digits = String(r.semester).replace(/\D/g, '');
    let tSem = Number.parseInt(digits, 10) || 1;
    if (tSem > 2) tSem = ((tSem - 1) % 2) + 1;
    const termKey = `E${yr}-S${tSem}`;
    if (!seenTerms.has(termKey)) {
      seenTerms.add(termKey);
      const gpa = Math.round(Number(r.gpa) * 100) / 100;
      trend.push({
        label: `E${yr} Sem${tSem}`,
        yearLevel: `E${yr}`,
        semester: `Sem${tSem}`,
        gpa,
      });
      totalGpa += gpa;
      count += 1;
    }
  }

  // Fallback to sem results if no cgpa rows
  if (!trend.length) {
    const semResults = await prisma.result.findMany({
      where: {
        studentId,
        type: 'sem',
        OR: termConditions,
      },
      select: { yearLevel: true, semester: true, marks: true, maxMarks: true, gradePoints: true },
    });

    const groups = new Map();
    for (const r of semResults) {
      const yr = parseYearLevel(r.yearLevel) || 1;
      const digits = String(r.semester).replace(/\D/g, '');
      let tSem = Number.parseInt(digits, 10) || 1;
      if (tSem > 2) tSem = ((tSem - 1) % 2) + 1;
      const key = `E${yr}-S${tSem}`;
      if (!groups.has(key)) groups.set(key, { yr, tSem, totalMarks: 0, maxMarks: 0, points: 0, count: 0 });
      const g = groups.get(key);
      g.totalMarks += Number(r.marks || 0);
      g.maxMarks += Number(r.maxMarks || 100);
      g.points += Number(r.gradePoints || 0);
      g.count += 1;
    }

    for (const [key, g] of [...groups.entries()].sort()) {
      const gpa = g.count > 0 && g.points > 0
        ? Math.round((g.points / g.count) * 100) / 100
        : Math.round(((g.totalMarks / (g.maxMarks || 100)) * 10) * 100) / 100;
      trend.push({
        label: `E${g.yr} Sem${g.tSem}`,
        yearLevel: `E${g.yr}`,
        semester: `Sem${g.tSem}`,
        gpa,
      });
      totalGpa += gpa;
      count += 1;
    }
  }

  const authorizedCgpa = count > 0 ? Math.round((totalGpa / count) * 100) / 100 : 0;

  return {
    cgpa: authorizedCgpa,
    trend,
    cgpaRows,
  };
}

/**
 * Filter attendance records to only include those belonging to authorized subjects and semesters.
 */
export function filterAuthorizedAttendance(attendanceRows, authLevel) {
  return attendanceRows.filter((row) => {
    const sub = row.subjectRel;
    if (!sub) return true; // generic attendance

    // Check entryLevel / semester from subject or offerings
    const entryLevel = sub.entryLevel || sub.offerings?.[0]?.entryLevel;
    const semester = sub.semester || sub.offerings?.[0]?.semester;

    if (entryLevel != null) {
      if (!isAcademicTermAuthorized(authLevel, entryLevel, semester)) {
        return false;
      }
    }
    return true;
  });
}
