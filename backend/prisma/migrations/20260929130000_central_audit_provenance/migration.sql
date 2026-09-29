ALTER TABLE "users" ADD COLUMN "updated_at" TIMESTAMP(3), ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
UPDATE "users" SET "updated_at" = "created_at";
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "branches" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "department_id" TEXT NOT NULL,
  "confirmation_status" TEXT NOT NULL DEFAULT 'CONFIRMED',
  "source_type" TEXT,
  CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");
CREATE INDEX "branches_department_id_idx" ON "branches"("department_id");
ALTER TABLE "branches" ADD CONSTRAINT "branches_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subjects"
  ADD COLUMN "entry_level" TEXT,
  ADD COLUMN "semester" TEXT,
  ADD COLUMN "category" TEXT,
  ADD COLUMN "ltp" TEXT,
  ADD COLUMN "credits" DOUBLE PRECISION,
  ADD COLUMN "source_document" TEXT,
  ADD COLUMN "curriculum_scope" TEXT,
  ADD COLUMN "source_type" TEXT,
  ADD COLUMN "confirmation_status" TEXT NOT NULL DEFAULT 'CONFIRMED';

ALTER TABLE "students"
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "source_status" TEXT NOT NULL DEFAULT 'system-entered',
  ADD COLUMN "source_sheet" TEXT,
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "students"
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "date_of_birth" DATE,
  ADD COLUMN "college_id" TEXT,
  ADD COLUMN "academic_year" TEXT,
  ADD COLUMN "academic_status" TEXT,
  ADD COLUMN "branch_id" TEXT,
  ADD COLUMN "rank" INTEGER,
  ADD COLUMN "puc_cgpa" DOUBLE PRECISION;
CREATE UNIQUE INDEX "students_college_id_key" ON "students"("college_id");
CREATE INDEX "students_branch_id_idx" ON "students"("branch_id");
ALTER TABLE "students" ADD CONSTRAINT "students_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "faculty"
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "source_status" TEXT NOT NULL DEFAULT 'system-entered',
  ADD COLUMN "source_sheet" TEXT,
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "faculty"
  ADD COLUMN "employee_id" TEXT,
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "qualification" TEXT,
  ADD COLUMN "specialization" TEXT,
  ADD COLUMN "experience_years" DOUBLE PRECISION,
  ADD COLUMN "joining_date" DATE,
  ADD COLUMN "employment_type" TEXT,
  ADD COLUMN "office_room" TEXT,
  ADD COLUMN "campus" TEXT;
CREATE UNIQUE INDEX "faculty_employee_id_key" ON "faculty"("employee_id");

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entity_id" TEXT,
  "old_value" JSONB,
  "new_value" JSONB,
  "request_info" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_entity_entity_id_created_at_idx" ON "audit_logs"("entity", "entity_id", "created_at");
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
