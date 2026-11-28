-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "lastSavedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "submissions_taskId_lastSavedAt_idx" ON "submissions"("taskId", "lastSavedAt");

