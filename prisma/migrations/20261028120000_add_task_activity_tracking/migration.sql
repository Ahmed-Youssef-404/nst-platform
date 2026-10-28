-- AlterTable
ALTER TABLE
    "submissions"
ADD
    COLUMN "activityVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "submission_activity_reviews" (
    "submissionId" TEXT NOT NULL,
    "reviewedVersion" INTEGER NOT NULL DEFAULT 0,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "submission_activity_reviews_pkey" PRIMARY KEY ("submissionId")
);

-- AddForeignKey
ALTER TABLE
    "submission_activity_reviews"
ADD
    CONSTRAINT "submission_activity_reviews_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;