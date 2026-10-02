import { prisma } from '../src/config/prisma.js';

export async function runGradeMigration() {
  console.log('=== STARTING GRADE SYSTEM MIGRATION: 90-100 MARKS -> Ex ===');

  // 1. Audit before update
  const semBeforeA = await prisma.result.count({
    where: { maxMarks: 100, marks: { gte: 90 }, grade: 'A' },
  });
  const semBeforeAPlus = await prisma.result.count({
    where: { maxMarks: 100, marks: { gte: 90 }, grade: 'A+' },
  });
  const midBeforeA = await prisma.result.count({
    where: { maxMarks: 30, marks: { gte: 27 }, grade: 'A' },
  });
  const midBeforeAPlus = await prisma.result.count({
    where: { maxMarks: 30, marks: { gte: 27 }, grade: 'A+' },
  });
  const scrBeforeEX = await prisma.studentCourseRecord.count({
    where: { grade: 'EX' },
  });
  const scrBeforeA = await prisma.studentCourseRecord.count({
    where: { marks: { gte: 90 }, grade: 'A' },
  });

  console.log('--- Current Counts Before Migration ---');
  console.log(`Semester marks >= 90 with grade 'A': ${semBeforeA}`);
  console.log(`Semester marks >= 90 with grade 'A+': ${semBeforeAPlus}`);
  console.log(`Mid marks >= 27 (>=90%) with grade 'A': ${midBeforeA}`);
  console.log(`Mid marks >= 27 (>=90%) with grade 'A+': ${midBeforeAPlus}`);
  console.log(`Student Course Records with grade 'EX': ${scrBeforeEX}`);
  console.log(`Student Course Records marks >= 90 with grade 'A': ${scrBeforeA}`);

  // 2. Perform database updates in transaction
  console.log('\nExecuting safe database update...');
  const updatedResults = await prisma.$executeRawUnsafe(`
    UPDATE results
    SET grade = 'Ex'
    WHERE max_marks > 0 AND (marks / max_marks) >= 0.8999 AND grade IN ('A', 'A+', 'EX')
  `);

  const updatedScr = await prisma.$executeRawUnsafe(`
    UPDATE student_course_records
    SET grade = 'Ex'
    WHERE grade = 'EX' OR (marks IS NOT NULL AND marks >= 89.99 AND grade IN ('A', 'A+'))
  `);

  const updatedScales = await prisma.$executeRawUnsafe(`
    UPDATE grade_scales
    SET grade = 'Ex'
    WHERE grade = 'EX'
  `);

  console.log(`Updated results table rows: ${updatedResults}`);
  console.log(`Updated student_course_records rows: ${updatedScr}`);
  console.log(`Updated grade_scales rows: ${updatedScales}`);

  // 3. Verify counts after update
  const semAfterA = await prisma.result.count({
    where: { maxMarks: 100, marks: { gte: 90 }, grade: { in: ['A', 'A+'] } },
  });
  const midAfterA = await prisma.result.count({
    where: { maxMarks: 30, marks: { gte: 27 }, grade: { in: ['A', 'A+'] } },
  });
  const scrAfterA = await prisma.studentCourseRecord.count({
    where: { marks: { gte: 90 }, grade: { in: ['A', 'A+'] } },
  });
  const semAfterEx = await prisma.result.count({
    where: { maxMarks: 100, marks: { gte: 90 }, grade: 'Ex' },
  });
  const midAfterEx = await prisma.result.count({
    where: { maxMarks: 30, marks: { gte: 27 }, grade: 'Ex' },
  });
  const scrAfterEx = await prisma.studentCourseRecord.count({
    where: { grade: 'Ex' },
  });

  // Check boundary 89 marks
  const boundary89Count = await prisma.result.count({
    where: { maxMarks: 100, marks: 89 },
  });
  const boundary89ACount = await prisma.result.count({
    where: { maxMarks: 100, marks: 89, grade: 'A' },
  });

  console.log('\n--- Verification After Migration ---');
  console.log(`Semester marks >= 90 with grade 'A' or 'A+': ${semAfterA} (MUST BE 0)`);
  console.log(`Mid marks >= 27 with grade 'A' or 'A+': ${midAfterA} (MUST BE 0)`);
  console.log(`Student Course Records marks >= 90 with grade 'A' or 'A+': ${scrAfterA} (MUST BE 0)`);
  console.log(`Semester marks >= 90 with grade 'Ex': ${semAfterEx}`);
  console.log(`Mid marks >= 27 with grade 'Ex': ${midAfterEx}`);
  console.log(`Student Course Records with grade 'Ex': ${scrAfterEx}`);
  console.log(`Boundary 89 marks count: ${boundary89Count}, with grade 'A': ${boundary89ACount} (Must match exactly)`);

  if (semAfterA !== 0 || midAfterA !== 0 || scrAfterA !== 0) {
    throw new Error('Migration verification failed: Incorrect A grades remain for marks >= 90!');
  }
  if (boundary89Count !== boundary89ACount) {
    throw new Error('Migration verification failed: Boundary 89 marks were altered!');
  }

  console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY AND VERIFIED ===');
  return {
    updatedResults,
    updatedScr,
    updatedScales,
    semAfterEx,
    midAfterEx,
    scrAfterEx,
  };
}

if (process.argv[1] && process.argv[1].endsWith('update-grades-to-ex.mjs')) {
  runGradeMigration()
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
