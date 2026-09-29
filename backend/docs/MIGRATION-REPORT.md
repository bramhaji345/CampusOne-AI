# Migration and source reconciliation report

## Prior data model to current model

| Old table/model | Current table/model | Transformation | Status |
|---|---|---|---|
| `users` | `users` | Retained; added `updated_at`, `version`; inactive accounts are rejected by auth middleware | Migrated |
| `students` | `students` | Retained institutional `student_id`; added active/version/provenance, college ID, date of birth, gender, batch, branch, academic metadata | Migrated |
| `faculty` | `faculty` | Retained institutional `faculty_id`; added employee ID, active/version/provenance, qualification, specialization, experience, joining date and office fields | Migrated |
| `departments` | `departments` | Retained unique code/name; add source type and confirmation status | Migrated |
| `branches` | `branches` | New normalized department-linked catalogue | Migrated |
| `courses`, `batches`, `classes` | Existing models plus `academic_programs`, `academic_batches` | Retained placement hierarchy; add explicit program/cohort references | Migrated |
| `subjects` | `subjects`, `subject_offerings` | Canonical code/name separated from semester/category/LTP/credits variants | Migrated |
| `results`, `semester_cgpa` | Retained plus `student_course_records` | Preserve app marks; add imported per-course results and semester credit/GPA details | Migrated |
| `faculty_subjects` | Retained; add `faculty_course_assignments` | Preserve class assignments while importing course/year/semester assignments that have no class key | Migrated |
| none | `student_advisors`, `faculty_leaves`, `grade_scales` | New normalized source entities | Migrated |
| none | `audit_logs` | New user/action/entity/before-after/request history | Migrated |

## Workbook relationships and exceptions

- 26 worksheets inspected; 4,320 unique student IDs and 300 unique faculty IDs validate; student and faculty emails are syntactically valid and unique within their sheets.
- Student IDs follow `O24`/`O23`/`O22`/`O21` prefixes for E1/E2/E3/E4.
- `Student_Contact` supplies institutional student email addresses and is joined by `student_id`.
- `Student_Academic_Record` has 63,720 unique student/course/semester rows; `Semester_Result` has 7,560 rows.
- 900 faculty-course assignment rows include two exact duplicates; one copy per unique assignment is imported, and the duplicate count is recorded.
- `Faculty_Master` contains `MM` (10 faculty) without a matching `Department_Master` row. When explicitly confirmed, the source name is retained with `REQUIRES CONFIRMATION` and `source_type=Faculty_Master only`.
- `Branch_Master` marks `EE` as `REQUIRES USER CONFIRMATION`; the flag is retained.
- `Subject_Master` contains a `23CS41XX` offering with differing categories in the same entry level/semester. Both category variants are retained as separate subject offerings and flagged for confirmation.
- All `Student_Master` and `Faculty_Master` rows are marked `SYNTHETIC / DEMONSTRATION DATA`; imports retain this source status.

## Backup and validation

The original local PostgreSQL database was backed up before any migration. Three forward migrations add provenance/versions/audit, academic import entities, and subject offerings. Migration deployment is validated separately from workbook import. The import is one database transaction; the first run exposed an Excel cell-format conversion on numeric ranks and was rolled back. The parser now preserves raw numerics and converts only the named date fields. The workbook import committed on 2026-09-29 to the configured local development database: 4,320 students, 300 faculty, 7 departments (one marked for confirmation), 6 branches, 325 canonical subjects, 60 subject offerings, 63,720 course records, 7,560 semester results, 898 unique faculty assignments (2 duplicates skipped), 4,320 advisor rows, and 433 leave rows. The pre-migration database dump is `backend/backups/campusone-before-restructure-20260929.dump`.

## Scope limit

The PDFs listed in Downloads were not included as attachments with this request. No PDF-derived institutional rule is being asserted; unknown values remain source notes/confirmation flags. The supplied local environment is a development PostgreSQL instance, not a hosted shared production endpoint.


## Generated academic activity

The repeatable `npm run seed:campus-data` script creates demo activity rows labeled `SYNTHETIC RANDOM SIMULATION`, distributes students into year-level class groups, links faculty to taught subjects/classes, and generates subject attendance, timetables, assignments, semester/midterm marks, and CGPA history. It replaces the imported semester CGPA summary rows for synthetic students with simulated history; workbook course records remain intact. CS/EC have four 90-student sections per year, while EE/ME/CE have one 120-student section per year. Student and faculty passwords are set to `<institutional ID>@123`, stored as bcrypt hashes; admin seed credentials are unchanged.
