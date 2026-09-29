ALTER TABLE "semester_cgpa"
  ADD COLUMN "academic_year" TEXT,
  ADD COLUMN "total_credits" DOUBLE PRECISION,
  ADD COLUMN "earned_credits" DOUBLE PRECISION,
  ADD COLUMN "total_credit_points" DOUBLE PRECISION,
  ADD COLUMN "cumulative_credits" DOUBLE PRECISION,
  ADD COLUMN "cumulative_credit_points" DOUBLE PRECISION,
  ADD COLUMN "academic_status" TEXT,
  ADD COLUMN "source_status" TEXT NOT NULL DEFAULT 'system-entered';

ALTER TABLE "departments"
  ADD COLUMN "confirmation_status" TEXT NOT NULL DEFAULT 'CONFIRMED',
  ADD COLUMN "source_type" TEXT;

CREATE TABLE "academic_programs" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "duration_years" INTEGER,
  "total_credits" DOUBLE PRECISION,
  "source_type" TEXT,
  CONSTRAINT "academic_programs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "academic_programs_code_key" ON "academic_programs"("code");
CREATE TABLE "academic_batches" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "source_type" TEXT,
  "synthetic_use" TEXT,
  "start_year" INTEGER,
  "end_year" INTEGER,
  CONSTRAINT "academic_batches_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "academic_batches_name_key" ON "academic_batches"("name");
CREATE TABLE "grade_scales" (
  "id" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "minimum_marks" DOUBLE PRECISION,
  "maximum_marks" DOUBLE PRECISION,
  "grade_point" DOUBLE PRECISION,
  "result_status" TEXT,
  CONSTRAINT "grade_scales_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "grade_scales_grade_key" ON "grade_scales"("grade");
ALTER TABLE "courses" ADD COLUMN "program_id" TEXT;
CREATE INDEX "courses_program_id_idx" ON "courses"("program_id");
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_fkey"
  FOREIGN KEY ("program_id") REFERENCES "academic_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "students" ADD COLUMN "academic_batch_id" TEXT;
CREATE INDEX "students_academic_batch_id_idx" ON "students"("academic_batch_id");
ALTER TABLE "students" ADD CONSTRAINT "students_academic_batch_id_fkey"
  FOREIGN KEY ("academic_batch_id") REFERENCES "academic_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "student_course_records" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "academic_year" TEXT NOT NULL,
  "credits" DOUBLE PRECISION,
  "marks" DOUBLE PRECISION,
  "grade" TEXT,
  "grade_point" DOUBLE PRECISION,
  "credit_points" DOUBLE PRECISION,
  "result_status" TEXT,
  "curriculum_scope" TEXT,
  "source_status" TEXT NOT NULL DEFAULT 'system-entered',
  CONSTRAINT "student_course_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "student_course_records_student_id_subject_id_semester_academic_year_key"
  ON "student_course_records"("student_id", "subject_id", "semester", "academic_year");
CREATE INDEX "student_course_records_student_id_academic_year_semester_idx"
  ON "student_course_records"("student_id", "academic_year", "semester");
ALTER TABLE "student_course_records" ADD CONSTRAINT "student_course_records_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_course_records" ADD CONSTRAINT "student_course_records_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "faculty_course_assignments" (
  "id" TEXT NOT NULL,
  "faculty_id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "academic_year" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "curriculum_note" TEXT,
  "source_status" TEXT NOT NULL DEFAULT 'system-entered',
  CONSTRAINT "faculty_course_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "faculty_course_assignments_faculty_id_subject_id_academic_year_semester_key"
  ON "faculty_course_assignments"("faculty_id", "subject_id", "academic_year", "semester");
CREATE INDEX "faculty_course_assignments_subject_id_academic_year_semester_idx"
  ON "faculty_course_assignments"("subject_id", "academic_year", "semester");
ALTER TABLE "faculty_course_assignments" ADD CONSTRAINT "faculty_course_assignments_faculty_id_fkey"
  FOREIGN KEY ("faculty_id") REFERENCES "faculty"("faculty_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "faculty_course_assignments" ADD CONSTRAINT "faculty_course_assignments_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "student_advisors" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "faculty_id" TEXT NOT NULL,
  "academic_year" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "source_status" TEXT NOT NULL DEFAULT 'system-entered',
  CONSTRAINT "student_advisors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "student_advisors_student_id_academic_year_key" ON "student_advisors"("student_id", "academic_year");
CREATE INDEX "student_advisors_faculty_id_academic_year_idx" ON "student_advisors"("faculty_id", "academic_year");
ALTER TABLE "student_advisors" ADD CONSTRAINT "student_advisors_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_advisors" ADD CONSTRAINT "student_advisors_faculty_id_fkey"
  FOREIGN KEY ("faculty_id") REFERENCES "faculty"("faculty_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "faculty_leaves" (
  "id" TEXT NOT NULL,
  "faculty_id" TEXT NOT NULL,
  "leave_type" TEXT NOT NULL,
  "start_date" DATE,
  "end_date" DATE,
  "days" DOUBLE PRECISION,
  "approval_status" TEXT NOT NULL,
  "academic_year" TEXT,
  "source_status" TEXT NOT NULL DEFAULT 'system-entered',
  CONSTRAINT "faculty_leaves_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "faculty_leaves_faculty_id_start_date_idx" ON "faculty_leaves"("faculty_id", "start_date");
ALTER TABLE "faculty_leaves" ADD CONSTRAINT "faculty_leaves_faculty_id_fkey"
  FOREIGN KEY ("faculty_id") REFERENCES "faculty"("faculty_id") ON DELETE CASCADE ON UPDATE CASCADE;
