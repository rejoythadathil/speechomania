ALTER TABLE "attempts" ADD COLUMN     "assessment_id" UUID,
ALTER COLUMN "lesson_id" DROP NOT NULL;

ALTER TABLE "children" ADD COLUMN     "assigned_assessments" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE "assessments" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "items" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_by" UUID NOT NULL,
    "published_by" UUID,
    "published_at" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "assessments_status_idx" ON "assessments"("status");

CREATE INDEX "attempts_assessment_idx" ON "attempts"("assessment_id");

ALTER TABLE "attempts" ADD CONSTRAINT "attempts_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "assessments" ADD CONSTRAINT "assessments_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;


ALTER TABLE "assessments" ADD CONSTRAINT "assessments_status_check" CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE "assessments" ADD CONSTRAINT "assessments_title_check" CHECK (length(title) BETWEEN 1 AND 160);

ALTER TABLE "attempts" ADD CONSTRAINT "attempts_one_source_check" CHECK ((lesson_id IS NULL) <> (assessment_id IS NULL));

GRANT SELECT, INSERT, UPDATE, DELETE ON "assessments" TO speechomania_app;
