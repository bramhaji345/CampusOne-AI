import { prisma } from '../src/config/prisma.js';

async function main() {
  const configs = [
    { studentId: 'O240001', semester: 1 },
    { studentId: 'O240481', semester: 2 },
    { studentId: 'O230001', semester: 1 },
    { studentId: 'O230481', semester: 2 },
    { studentId: 'O220801', semester: 1 },
    { studentId: 'O220901', semester: 2 },
    { studentId: 'O211001', semester: 1 },
    { studentId: 'O210001', semester: 2 },
  ];

  for (const c of configs) {
    await prisma.student.update({
      where: { studentId: c.studentId },
      data: { semester: c.semester },
    });
    console.log(`Updated ${c.studentId} to semester ${c.semester}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
