# 05 — Outpass & Security

Outpass flow: student request → faculty approve/reject → QR for the gate → security scan.

## What this module owns

- Student outpass form (`frontend/src/pages/student/Outpasses.jsx`)
- Faculty review queue (`frontend/src/pages/faculty/Outpasses.jsx`)
- Admin / security scanner (`frontend/src/pages/admin/Scanner.jsx`)
- APIs: `GET/POST /api/outpasses`, `PATCH /api/outpasses/:id`, `POST /api/outpasses/scan`

QR codes contain only `{ "ref": "<outpassId>" }` — no student phone, email, or ID inside the code.

## How it connects

```text
Student request  →  Faculty review  →  If approved, QR  →  Student notification  →  Scanner validates
```

Merge by copying these pages into `frontend/src/App.jsx` at `/student/outpasses`, `/faculty/outpasses`, `/admin/scanner`, and mounting `backend/src/routes/outpass.routes.js`.

Depends on **06-Auth-Database**. Faculty/student shells come from **03-Faculty** and **02-Student**.

## Local files (no secrets)

Do not include `.env`, credentials, or `node_modules`.
