# CampusOne data architecture

## Source of truth

Every portal reads and writes through the Express API. Prisma connects to the PostgreSQL database selected by `DATABASE_URL`; there is no browser-side student/faculty database. Local storage holds only the bearer token and display preferences. Set `DATABASE_URL` to the same managed PostgreSQL service on the backend host for a shared multi-device deployment. Never put that URL in the frontend.

## Current model map

```mermaid
erDiagram
  USER ||--o| STUDENT : account
  USER ||--o| FACULTY : account
  USER ||--o| ADMIN : account
  DEPARTMENT ||--o{ BRANCH : contains
  DEPARTMENT ||--o{ COURSE : offers
  ACADEMIC_PROGRAM ||--o{ COURSE : defines
  COURSE ||--o{ BATCH : groups
  BATCH ||--o{ CLASS : groups
  CLASS ||--o{ STUDENT : enrolls
  DEPARTMENT ||--o{ STUDENT : organizes
  BRANCH ||--o{ STUDENT : identifies
  ACADEMIC_BATCH ||--o{ STUDENT : cohorts
  DEPARTMENT ||--o{ FACULTY : employs
  DEPARTMENT ||--o{ SUBJECT : catalogs
  SUBJECT ||--o{ SUBJECT_OFFERING : offered_as
  STUDENT ||--o{ STUDENT_COURSE_RECORD : earns
  SUBJECT ||--o{ STUDENT_COURSE_RECORD : assesses
  STUDENT ||--o{ SEMESTER_CGPA : summarizes
  FACULTY ||--o{ FACULTY_COURSE_ASSIGNMENT : teaches
  SUBJECT ||--o{ FACULTY_COURSE_ASSIGNMENT : assigned
  STUDENT ||--o{ STUDENT_ADVISOR : advised
  FACULTY ||--o{ STUDENT_ADVISOR : advises
  FACULTY ||--o{ FACULTY_LEAVE : requests
  STUDENT ||--o{ ATTENDANCE : records
  SUBJECT ||--o{ ATTENDANCE : for
  FACULTY ||--o{ ATTENDANCE : records
  USER ||--o{ AUDIT_LOG : acts
```

Institutional student/faculty IDs remain unique business keys; UUIDs remain internal keys. Student course records and subject offerings preserve the source row dimensions (semester, category, credits, LTP, source document, and curriculum scope) without flattening them into a single subject field. Branch/department/source confirmation is stored explicitly.

## Excel import

The preview parses all 26 worksheets. Import uses `Student_Master` joined to `Student_Contact`, `Faculty_Master`, department/branch/program/batch/section/grade/subject masters, academic records, semester results, faculty assignments, advisor mappings, and faculty leave rows. It validates IDs, email syntax, key uniqueness, foreign-key candidates, and duplicate relationships before a transaction. Upserts are keyed by institutional IDs/codes; course records and relation rows use unique constraints and `skipDuplicates` for reruns. The two exact duplicate faculty-course rows are counted and skipped.

The supplied workbook labels all student/faculty masters synthetic/demo. Its `EE` branch is marked `REQUIRES USER CONFIRMATION`, it has a faculty department (`MM`) missing from `Department_Master`, and one course code has conflicting categories. The import UI and CLI require explicit confirmation; imported provenance and those confirmation flags remain visible in PostgreSQL. They are not silently normalized into official values.

## Migrations and backup

Migrations are additive and forward-only. Before migration, a PostgreSQL custom-format dump was created at `backend/backups/campusone-before-restructure-20260929.dump` (ignored by Git). Restore with `pg_restore` to an empty database before pointing the app at it. Run `npm run prisma:deploy` before starting the backend. Do not edit a migration after it has been applied; create a new timestamped migration.

## Deployment boundaries

The checked-in local PostgreSQL launcher is for development only. A production multi-device deployment needs one hosted PostgreSQL instance, one shared backend URL reachable by all devices, HTTPS, a non-demo JWT secret, and a persistent upload store if assignment uploads are used. The current SSE event hub is process-local; if the backend is horizontally scaled, add a shared pub/sub adapter so events cross API instances.
