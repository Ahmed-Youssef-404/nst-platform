-- CreateEnum
CREATE TYPE "WeekResourceType" AS ENUM ('FILE', 'DRIVE_LINK');

-- AlterTable
ALTER TABLE "week_resource_submissions"
  ADD COLUMN "type" "WeekResourceType" DEFAULT 'FILE',
  ADD COLUMN "driveUrl" TEXT;

-- Backfill existing rows: Ensure all existing submissions have type = 'FILE'
UPDATE "week_resource_submissions"
SET "type" = 'FILE'
WHERE "type" IS NULL;

-- Mutual exclusion constraint:
-- Either FILE with fileUrl and no driveUrl, OR DRIVE_LINK with driveUrl and no fileUrl, OR both null.
ALTER TABLE "week_resource_submissions"
  ADD CONSTRAINT "week_resource_submissions_mutual_exclusion"
  CHECK (
    ("type" = 'FILE' AND "fileUrl" IS NOT NULL AND "driveUrl" IS NULL) OR
    ("type" = 'DRIVE_LINK' AND "driveUrl" IS NOT NULL AND "fileUrl" IS NULL) OR
    ("fileUrl" IS NULL AND "driveUrl" IS NULL)
  );
