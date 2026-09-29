# CampusOne AI

CampusOne AI provides portals for students, faculty, and administrators. A single PostgreSQL database is the authoritative source for campus records; all clients connect through the API.

```text
React clients → Express API → Prisma → shared PostgreSQL
```

## Local development

Requirements: Node.js 18+, npm, and the bundled local PostgreSQL runtime (Windows launcher) or a PostgreSQL 16+ server.

On Windows, double-click `start-campus.bat`. It starts the bundled local database, API, and frontend. For manual setup, configure `backend/.env`, then run these commands in separate terminals:

```bash
cd backend
npm run db:local
npm run dev
```

```bash
cd frontend
npm run dev
```

The frontend is at http://localhost:5173 and API health is at http://localhost:5000/api/health.

## Shared or production deployment

Set `DATABASE_URL` on the API service to the one managed PostgreSQL database shared by all clients. Configure a strong unique `JWT_SECRET`, `PORT`, and `FRONTEND_URL`. Set `VITE_API_URL` to the deployed API base URL in the frontend build environment. Run migrations once as a release step with `npx prisma migrate deploy`; do not run local database startup or seed scripts in production. Back up the shared database using the provider's managed backup facility.

## Database setup and demo data

Copy `backend/.env.example` to `backend/.env` and configure your values. Then:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
```

`npm run seed` creates fictional demo accounts. Do not seed a production database. Demo passwords are documented in `backend/prisma/seed.js` and must be changed before any shared deployment.

## Source workbook import

The workbook importer validates the source workbook before making one transactional import. Preview/import routes are admin-only. The CLI requires explicit flags because the attached workbook identifies its records as synthetic/demo and some branch/subject structures as requiring confirmation:

```bash
cd backend
npm run import:workbook -- "path/to/workbook.xlsx" --allow-synthetic --confirm-structures
```

The importer preserves source provenance and confirmation status. See [data architecture](backend/docs/DATA-ARCHITECTURE.md), [API reference](backend/docs/API.md), and [migration report](backend/docs/MIGRATION-REPORT.md) for schema and workbook details. Keep the database backup made before imports and migrations according to your retention policy.

## Project layout

```text
frontend/                 React + Vite
backend/
  prisma/schema.prisma    Normalized database models
  prisma/migrations/      Versioned PostgreSQL migrations
  src/                    Express API, services, controllers
  scripts/                Local DB and import utilities
  docs/                   Data architecture, API and migration report
```

## Simulated campus academic data

After importing the synthetic workbook, run `cd backend && npm run seed:campus-data` to generate repeatable sample attendance, student and faculty timetables, assignments, subject-linked classes, semester and midterm marks, and CGPA history. Generated activity is labeled `SYNTHETIC RANDOM SIMULATION`. CS and EC use four sections of 90 students per year level; EE, ME, and CE use one section of 120 per year level, matching the supplied dataset's counts. The generator assigns student/faculty passwords as their institutional ID followed by `@123` (for example, `O220001@123`); passwords are bcrypt-hashed. Students/faculty may sign in using their institutional ID or campus email. The admin seed login remains `admin@campusone.demo` / `Admin@123`. The login page's “Keep me signed in” option stores the authentication session on that device; it does not store the password.
