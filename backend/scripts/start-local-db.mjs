import { spawnSync } from 'child_process';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, '.pgdata');
const ctlLog = path.join(root, 'pg-ctl.log');
const bin = 'C:\\Program Files\\PostgreSQL\\16\\bin';
const pgctl = path.join(bin, 'pg_ctl.exe');
const psql = path.join(bin, 'psql.exe');
const initdb = path.join(bin, 'initdb.exe');
const createdb = path.join(bin, 'createdb.exe');

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true, ...opts });
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(800, () => done(false));
    socket.on('connect', () => done(true));
    socket.on('error', () => done(false));
  });
}

async function waitForPort(port, ms = 20000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await portOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function psqlOk(database, sql) {
  const result = run(psql, ['-h', '127.0.0.1', '-p', '5433', '-U', 'campusone', '-d', database, '-w', '-tAc', sql]);
  return result.status === 0 ? String(result.stdout || '').trim() : '';
}

if (!fs.existsSync(pgctl)) {
  console.error('PostgreSQL 16 was not found at C:\\Program Files\\PostgreSQL\\16\\bin');
  process.exit(1);
}

if (!fs.existsSync(dataDir)) {
  const init = run(initdb, ['-D', dataDir, '-U', 'campusone', '-A', 'trust', '-E', 'UTF8', '--no-locale']);
  if (init.status !== 0) {
    console.error(init.stdout || '');
    console.error(init.stderr || '');
    process.exit(init.status || 1);
  }
  console.log('Created local Postgres data folder at backend/.pgdata');
}

if (await portOpen(5433)) {
  console.log('Local Postgres already running on 5433');
} else {
  const pidFile = path.join(dataDir, 'postmaster.pid');
  const status = run(pgctl, ['-D', dataDir, 'status']);
  if (status.status !== 0 && fs.existsSync(pidFile)) {
    try { fs.unlinkSync(pidFile); } catch { /* ignore stale lock */ }
  }
  const result = run(pgctl, [
    '-D', dataDir,
    '-l', ctlLog,
    '-o', '-p 5433 -h 127.0.0.1',
    'start',
    '-W',
  ]);
  if (result.status !== 0) {
    const text = `${result.stdout || ''}\n${result.stderr || ''}`;
    if (!/already running|server is running/i.test(text)) {
      console.error(text.trim() || 'pg_ctl start failed');
      process.exit(result.status || 1);
    }
  }
  if (!(await waitForPort(5433))) {
    console.error('Local Postgres did not start on port 5433');
    process.exit(1);
  }
  console.log('Local Postgres started on 5433');
}

if (psqlOk('postgres', "SELECT 1 FROM pg_database WHERE datname='campusone'") !== '1') {
  const make = run(createdb, ['-h', '127.0.0.1', '-p', '5433', '-U', 'campusone', 'campusone']);
  if (make.status !== 0) {
    console.error(make.stdout || '');
    console.error(make.stderr || '');
    process.exit(make.status || 1);
  }
  console.log('Created campusone database');
}

const hasUsers = psqlOk('campusone', "SELECT to_regclass('public.users') IS NOT NULL");
if (hasUsers !== 't' && hasUsers !== 'true') {
  const migrate = run('npx', ['prisma', 'migrate', 'deploy'], { cwd: root, shell: true });
  process.stdout.write(migrate.stdout || '');
  process.stderr.write(migrate.stderr || '');
  if (migrate.status !== 0) process.exit(migrate.status || 1);
}

const hasAdmin = psqlOk('campusone', "SELECT 1 FROM users WHERE email='admin@campusone.demo' LIMIT 1");
if (hasAdmin !== '1') {
  const dumpGz = path.join(root, 'prisma', 'campusone_dump.sql.gz');
  if (fs.existsSync(dumpGz)) {
    console.log('Restoring complete campus database snapshot (4,320 students, 300 faculty, all marks & timetables)...');
    const { restoreDatabase } = await import('./restore-database.mjs');
    await restoreDatabase();
  } else {
    const seed = run('node', ['prisma/seed.js'], { cwd: root });
    process.stdout.write(seed.stdout || '');
    process.stderr.write(seed.stderr || '');
    if (seed.status !== 0) process.exit(seed.status || 1);
  }
}
