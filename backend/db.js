import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'campusone.db');

let db;

export async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  createTables();
  migrateColumns();
  persist();
  return db;
}

export function getDb() {
  return db;
}

export function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      photo TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      user_id TEXT PRIMARY KEY,
      student_id TEXT UNIQUE,
      dorm_no TEXT,
      course TEXT,
      year INTEGER,
      dept TEXT,
      parent_name TEXT,
      mobile TEXT,
      parent_phone TEXT,
      section TEXT,
      cgpa REAL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS faculty (
      user_id TEXT PRIMARY KEY,
      faculty_id TEXT UNIQUE,
      dept TEXT,
      designation TEXT,
      mobile TEXT,
      subjects TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      year_level TEXT,
      semester TEXT,
      type TEXT,
      subject TEXT,
      marks REAL,
      max_marks REAL DEFAULT 100,
      grade TEXT,
      FOREIGN KEY(student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      subject TEXT,
      class_type TEXT,
      date TEXT,
      status TEXT,
      faculty_id TEXT,
      FOREIGN KEY(student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      role_owner TEXT,
      owner_id TEXT,
      day TEXT,
      period INTEGER,
      subject TEXT,
      room TEXT,
      time_slot TEXT
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      faculty_id TEXT,
      title TEXT,
      description TEXT,
      subject TEXT,
      due_date TEXT,
      file_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT,
      student_id TEXT,
      file_url TEXT,
      submitted_at TEXT,
      status TEXT DEFAULT 'submitted',
      FOREIGN KEY(assignment_id) REFERENCES assignments(id)
    );

    CREATE TABLE IF NOT EXISTS outpasses (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      reason TEXT,
      reason_type TEXT,
      from_date TEXT,
      to_date TEXT,
      status TEXT DEFAULT 'pending',
      faculty_id TEXT,
      qr_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT,
      body TEXT,
      sender_id TEXT,
      target_role TEXT,
      target_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      read_by TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      type TEXT,
      purpose TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      email TEXT,
      token TEXT,
      expires_at TEXT,
      used INTEGER DEFAULT 0
    );
  `);
}

function addColumn(table, column, type) {
  try {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch {
    /* column already exists */
  }
}

function migrateColumns() {
  addColumn('outpasses', 'destination', 'TEXT');
  addColumn('outpasses', 'out_time', 'TEXT');
  addColumn('outpasses', 'return_time', 'TEXT');
  addColumn('outpasses', 'extra', 'TEXT');
  addColumn('outpasses', 'scanned_at', 'TEXT');
  addColumn('notifications', 'priority', "TEXT DEFAULT 'normal'");
  addColumn('certificates', 'file_url', 'TEXT');
  addColumn('timetable', 'faculty_name', 'TEXT');
  addColumn('results', 'grade_points', 'REAL');
  addColumn('users', 'status', "TEXT DEFAULT 'active'");
}

export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

export function run(sql, params = []) {
  db.run(sql, params);
  persist();
}
