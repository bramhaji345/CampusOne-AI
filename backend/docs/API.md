# API reference

Base path: `/api`. Authenticated endpoints require `Authorization: Bearer <token>`. Roles are enforced in Express middleware.

## Administration

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/stats` | Active student/faculty and pending-work counts |
| GET | `/admin/analytics` | Database-backed department and attendance metrics |
| GET | `/admin/departments` | Department catalogue |
| POST/PUT/DELETE | `/admin/departments[/:departmentId]` | Maintain departments; deletion is blocked while referenced |
| GET | `/admin/courses` | Search course catalogue by department |
| POST/PUT/DELETE | `/admin/courses[/:courseId]` | Maintain courses; deletion is blocked while students or batches reference them |
| GET | `/admin/classes?batchId=` | List sections and enrolled counts |
| POST/PUT/DELETE | `/admin/classes[/:classId]` | Maintain sections; deletion is blocked while students or activities reference them |
| GET | `/admin/students?page=1&limit=50&q=&dept=` | Paginated server-side student search/filter |
| POST | `/admin/students` | Create a student; returns a one-time temporary password |
| PUT | `/admin/students/:studentId` | Version-checked student update (`expectedVersion` required) |
| DELETE | `/admin/students/:studentId` | Version-checked soft deactivation |
| GET | `/admin/faculty?page=1&limit=50&q=` | Paginated server-side faculty search |
| POST | `/admin/faculty` | Create a faculty account; returns a one-time temporary password |
| PUT | `/admin/faculty/:facultyId` | Version-checked faculty update |
| DELETE | `/admin/faculty/:facultyId` | Version-checked soft deactivation |
| POST | `/admin/import/preview` | Validate and preview `.xlsx`/`.xls` (`file` multipart field) |
| POST | `/admin/import` | Revalidate and transactionally import after confirmation |
| GET | `/admin/audit-logs?page=1&limit=50&entity=` | Paginated audit history |

Student/faculty deletes preserve dependent academic history and set account status to inactive. A `409` indicates stale `expectedVersion`; reload before retrying. Unknown departments are rejected rather than created automatically.

## Portal and academic APIs

Existing role-scoped endpoints remain under `/api`: `/auth/login`, `/auth/me`, `/students/list`, `/faculty/list`, `/results`, `/attendance`, `/timetable`, `/assignments`, `/notifications`, `/outpasses`, and `/certificates`. Existing pages continue to use the shared Axios client.

## Live events

`GET /events` is an authenticated Server-Sent Events stream. It requires an `Authorization` header, so clients connect with `fetch` streaming rather than the browser `EventSource` constructor. Event frames use `event: campus` and JSON data with `type`, `entity`, `entityId`, `action`, and `occurredAt`. Clients refetch authoritative API state after events and after reconnect. Event payloads contain identifiers and change type, not full private records.

Current event names include `student.created`, `student.updated`, `student.deleted`, `faculty.created`, `faculty.updated`, `faculty.deleted`, and `campus.imported`. Admin/faculty subscriptions receive campus administration events; student/faculty owners can be targeted by user ID. The stream retries with backoff and the portal shows its live/offline state.

## Errors

`400` is malformed input, `401` unauthenticated/inactive account, `403` disallowed role, `409` unique-key or optimistic-lock conflict, `422` source validation/confirmation requirement, and `503` unavailable PostgreSQL.



Master-catalog create/update/delete operations write audit entries. Student and faculty updates require xpectedVersion; other catalog edits currently use database uniqueness and foreign-key checks.
