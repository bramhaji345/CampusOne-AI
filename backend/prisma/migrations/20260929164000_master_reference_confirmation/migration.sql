CREATE TABLE "subject_offerings" (
  "id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "entry_level" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "ltp" TEXT,
  "credits" DOUBLE PRECISION,
  "source_document" TEXT,
  "source_type" TEXT,
  "curriculum_scope" TEXT,
  "confirmation_status" TEXT NOT NULL DEFAULT 'CONFIRMED',
  "source_status" TEXT NOT NULL DEFAULT 'workbook-source',
  CONSTRAINT "subject_offerings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subject_offerings_subject_id_entry_level_semester_category_key"
  ON "subject_offerings"("subject_id", "entry_level", "semester", "category");
CREATE INDEX "subject_offerings_entry_level_semester_idx" ON "subject_offerings"("entry_level", "semester");
ALTER TABLE "subject_offerings" ADD CONSTRAINT "subject_offerings_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
