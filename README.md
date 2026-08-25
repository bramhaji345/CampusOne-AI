# CampusOne AI

Intelligent campus portal for **Students**, **Faculty**, and **Admin**.

```text
React Frontend  →  Express API  →  Prisma  →  PostgreSQL
```

## Team folders

Work lives in numbered folders so each teammate can push without overwriting the others:

| Folder | Owns |
|--------|------|
| `01-AI/` | AI insights, CGPA/attendance analysis, admin analytics |
| `02-Student/` | Student portal |
| `03-Faculty/` | Faculty portal |
| `04-Admin/` | Admin portal |
| `05-Outpass-Security/` | Outpass and QR scanner |
| `06-Auth-Database/` | Login, JWT, Prisma, PostgreSQL |

Root `frontend/` and `backend/` are merge targets. Feature files were removed from those folders so they are not duplicated when the team folders are pushed.

The current AI module is in `01-AI/`. Copy files into root `frontend/` and `backend/` only when combining modules.

## Requirements

- Node.js 18+
- PostgreSQL 16+
- npm

## Setup

Copy the example env file and fill in **your** values. Never commit `.env`.

```bash
copy .env.example backend\.env
```

On macOS/Linux use `cp .env.example backend/.env`.

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/campusone?schema=public
JWT_SECRET=change-this-to-a-long-random-string
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Create a PostgreSQL database named `campusone` that matches `DATABASE_URL`.

After modules are merged into root `frontend/` and `backend/`:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm start
```

```bash
cd frontend
npm install
npm run dev
```

- API: http://localhost:5000
- App: http://localhost:5173

## Demo accounts

These fictional accounts are created by `npm run seed`. Passwords are stored hashed in the database.

| Role | Email | Password |
|------|-------|----------|
| Student | student@campusone.demo | Student@123 |
| Faculty | faculty@campusone.demo | Faculty@123 |
| Admin | admin@campusone.demo | Admin@123 |

There is no public signup. After login, users are redirected to their role dashboard.

College email domains accepted for password reset: `@campusone.demo` and `@campusone.edu`.
