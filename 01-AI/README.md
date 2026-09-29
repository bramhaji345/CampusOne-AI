# 01 — AI

AI insights for CampusOne AI. Uses **real database data** (CGPA trends, subject marks, attendance) — not random text.

## What this module owns

- Student dashboard AI card and CGPA/attendance charts
- `GET /api/results/ai-analysis`
- `GET /api/attendance/ai-analysis`
- Admin dashboard analytics insights (`GET /api/admin/analytics`)

## How it connects

```text
Student / Admin UI  →  /api/*-analysis  →  Prisma  →  PostgreSQL
```

This folder mirrors the main project paths (`frontend/src/...`, `backend/src/...`). To merge back into CampusOne AI:

1. Copy pages into `frontend/src/pages/`
2. Keep `aiResults`, `aiAttendance` in `backend/src/controllers/academic.controller.js`
3. Keep `adminAnalytics` in `backend/src/controllers/admin.controller.js`
4. Mount `backend/src/routes/ai.routes.js` with `app.use('/api', aiRoutes)` if you split routes

Depends on **06-Auth-Database** (login + Prisma). Reads marks/attendance written by **02-Student** and **03-Faculty**.

## Local files (no secrets)

Do not add `.env`, passwords, or `node_modules`. Use `backend/.env.example` as a template.

Root `frontend/` and `backend/` are merge targets and do not contain duplicate copies of these files. Work in this `01-AI/` folder, then copy into the root folders when combining with the other modules.
