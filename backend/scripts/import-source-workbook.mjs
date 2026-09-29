import fs from 'node:fs';
import { prisma } from '../src/config/prisma.js';
import { importWorkbook } from '../src/controllers/import.controller.js';

const [filePath, ...flags] = process.argv.slice(2);
if (!filePath || !flags.includes('--allow-synthetic') || !flags.includes('--confirm-structures')) {
  console.error('Usage: node scripts/import-source-workbook.mjs <workbook.xlsx> --allow-synthetic --confirm-structures');
  process.exitCode = 2;
} else if (!fs.existsSync(filePath)) {
  console.error(`Workbook not found: ${filePath}`);
  process.exitCode = 2;
} else {
  try {
    const administrator = await prisma.user.findFirst({ where: { role: 'admin', status: 'active' }, select: { id: true } });
    if (!administrator) throw new Error('An active administrator account is required to attribute the import audit log.');
    const req = {
      file: { buffer: fs.readFileSync(filePath), originalname: filePath.split(/[\\/]/).pop() },
      body: { allowSynthetic: 'true', allowUnconfirmedStructure: 'true' },
      user: { id: administrator.id, role: 'admin' },
      ip: '127.0.0.1',
      get: () => 'campusone-import-cli',
    };
    let responseCode = 200;
    const res = {
      status(code) { responseCode = code; return this; },
      json(payload) { this.payload = payload; },
    };
    await importWorkbook(req, res);
    if (responseCode >= 400) throw new Error(res.payload?.error || `Import failed with HTTP ${responseCode}`);
    console.log(JSON.stringify({ status: 'imported', ...res.payload }));
  } catch (error) {
    console.error(JSON.stringify({ status: 'failed', error: error.message }));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
