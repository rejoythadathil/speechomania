ALTER TABLE "lessons" DROP CONSTRAINT "lessons_status_check";
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_status_check" CHECK (status IN ('draft', 'published', 'superseded', 'archived', 'soft_deleted'));
ALTER TABLE "assessments" DROP CONSTRAINT "assessments_status_check";
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_status_check" CHECK (status IN ('draft', 'published', 'archived', 'soft_deleted'));
UPDATE "children" SET "deleted_at" = now() WHERE "deleted_at" IS NOT NULL;
UPDATE "remarks" SET "deleted_at" = now() WHERE "deleted_at" IS NOT NULL;
UPDATE "users" SET "deleted_at" = now() WHERE "deleted_at" IS NOT NULL AND "email" NOT LIKE '%@erased.invalid';
