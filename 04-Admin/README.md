# 04 — Admin

Administration portal: campus analytics, student/faculty management, certificates, notifications, and departments.

## What this module owns

- `frontend/src/pages/admin/` (except QR scanner)
- APIs: `/api/admin/students`, `/admin/faculty`, `/admin/stats`, `/admin/analytics`, `/admin/departments`, certificate review, notification management

## How it connects

```text
Admin UI  →  /api/admin/*  →  Prisma  →  PostgreSQL
```

Merge by copying files to the same paths in the main project. Mount `backend/src/routes/admin.routes.js` with `app.use('/api', adminRoutes)` if routes are split.

Depends on **06-Auth-Database**. Analytics insights overlap with **01-AI**. Gate QR scanning is **05-Outpass-Security**.

## Local files (no secrets)

Do not include `.env`, credentials, or `node_modules`. Default passwords created for new users are hashed in the database (see main README demo accounts).
