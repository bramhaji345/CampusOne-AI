# CampusOne AI

Intelligent campus portal for **Students**, **Faculty**, and **Admin**.

```text
React Frontend  →  Express API  →  Prisma  →  PostgreSQL
```

## Requirements

- Node.js 18+
- PostgreSQL 16+
- npm

## Setup

### 1. Clone and configure environment

```bash
git clone https://github.com/bramhaji345/CampusOne-AI.git
cd CampusOne-AI
```

Copy the example env file and fill in **your** values. Never commit `.env`.

```bash
cd backend
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

`backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/campusone?schema=public
JWT_SECRET=change-this-to-a-long-random-string
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Create a PostgreSQL database named `campusone` that matches `DATABASE_URL`.

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm start
```

If migrate reports that the database is not in sync, run `npx prisma db push` once, then seed.

- API: http://localhost:5000
- Health: http://localhost:5000/api/health (confirms backend + database)

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Demo accounts

These fictional accounts are created by `npm run seed`. Passwords are stored hashed in the database.

| Role | Email | Password |
|------|-------|----------|
| Student | student@campusone.demo | Student@123 |
| Faculty | faculty@campusone.demo | Faculty@123 |
| Admin | admin@campusone.demo | Admin@123 |

There is no public signup. After login, users are redirected to their role dashboard.

College email domains accepted for password reset: `@campusone.demo` and `@campusone.edu`.

## Project layout

```text
frontend/                 Vite + React
backend/
  prisma/
    schema.prisma         Database models
    migrations/           PostgreSQL migrations
    seed.js               Fictional demo data
  src/                    Express API (auth, academics, campus, admin)
  .env.example            Required environment variables
```

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| backend | `npm start` | Run API |
| backend | `npm run seed` | Load demo data |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Production build |
