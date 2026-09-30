import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import dotenv from 'dotenv';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });

const dumpGzPath = path.join(root, 'prisma', 'campusone_dump.sql.gz');
const dumpSqlPath = path.join(root, 'prisma', 'campusone_dump.sql');

function findPsql() {
  if (process.env.PSQL_PATH && fs.existsSync(process.env.PSQL_PATH)) return process.env.PSQL_PATH;
  const candidates = [
    'psql',
    'psql.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe',
    '/usr/bin/psql',
    '/usr/local/bin/psql',
    '/opt/homebrew/bin/psql',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'psql';
}

export async function restoreDatabase() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://campusone@127.0.0.1:5433/campusone?schema=public';
  console.log(`Restoring database from snapshot to: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  if (!fs.existsSync(dumpGzPath) && !fs.existsSync(dumpSqlPath)) {
    console.error(`Dump file not found at ${dumpGzPath}`);
    process.exit(1);
  }

  // Parse connection URL
  let parsedUrl;
  try {
    parsedUrl = new URL(dbUrl);
  } catch (err) {
    console.error('Invalid DATABASE_URL:', err.message);
    process.exit(1);
  }

  const psqlBin = findPsql();
  const host = parsedUrl.hostname || '127.0.0.1';
  const port = parsedUrl.port || '5432';
  const user = decodeURIComponent(parsedUrl.username || 'postgres');
  const password = decodeURIComponent(parsedUrl.password || '');
  const database = parsedUrl.pathname.replace(/^\//, '').split('?')[0] || 'campusone';

  const psqlArgs = [
    '-d', dbUrl,
    '-v', 'ON_ERROR_STOP=0',
  ];

  const env = {
    ...process.env,
    ...(password ? { PGPASSWORD: password } : {}),
  };

  return new Promise((resolve, reject) => {
    console.log(`Executing restore via ${psqlBin}...`);
    const psqlProc = spawn(psqlBin, psqlArgs, { env, stdio: ['pipe', 'inherit', 'inherit'] });

    psqlProc.on('error', (err) => {
      console.error(`Failed to launch ${psqlBin}: ${err.message}`);
      reject(err);
    });

    psqlProc.on('close', (code) => {
      if (code === 0 || code === null) {
        console.log('Database restoration completed successfully!');
        resolve();
      } else {
        console.warn(`psql exited with code ${code}. If tables already exist, this is normal.`);
        resolve();
      }
    });

    if (fs.existsSync(dumpGzPath)) {
      const readStream = fs.createReadStream(dumpGzPath);
      const gunzip = zlib.createGunzip();
      readStream.pipe(gunzip).pipe(psqlProc.stdin);
    } else {
      const readStream = fs.createReadStream(dumpSqlPath);
      readStream.pipe(psqlProc.stdin);
    }
  });
}

// Direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  restoreDatabase().catch((err) => {
    console.error('Restore error:', err);
    process.exit(1);
  });
}
