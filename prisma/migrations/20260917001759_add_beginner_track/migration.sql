-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('BEGINNER', 'INTERMEDIATE');

-- CreateEnum
CREATE TYPE "WeekResourceStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- DropForeignKey
ALTER TABLE "st_transactions" DROP CONSTRAINT "st_transactions_levelId_fkey";

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "type" "GroupType" NOT NULL DEFAULT 'INTERMEDIATE';

-- AlterTable
ALTER TABLE "st_transactions" ADD COLUMN     "beginnerStBalance" INTEGER,
ADD COLUMN     "wasHalvedDueToLateResource" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weekId" TEXT,
ALTER COLUMN "levelId" DROP NOT NULL,
ALTER COLUMN "levelStBalance" DROP NOT NULL,
ALTER COLUMN "avgStBalance" DROP NOT NULL;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "beginnerSt" INTEGER;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "weekId" TEXT,
ALTER COLUMN "sessionId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "weeks" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "playlistUrl" TEXT NOT NULL,
    "requiredFileLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "week_resource_submissions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" "WeekResourceStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "week_resource_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_rubric_fields" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "maxPoints" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_rubric_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_grades" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "gradedBy" TEXT NOT NULL,
    "totalPoints" INTEGER,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_grade_fields" (
    "id" TEXT NOT NULL,
    "taskGradeId" TEXT NOT NULL,
    "rubricFieldId" TEXT NOT NULL,
    "awardedPoints" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_grade_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "week_resource_submissions_studentId_weekId_key" ON "week_resource_submissions"("studentId", "weekId");

-- CreateIndex
CREATE UNIQUE INDEX "task_grades_submissionId_key" ON "task_grades"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "task_grade_fields_taskGradeId_rubricFieldId_key" ON "task_grade_fields"("taskGradeId", "rubricFieldId");

-- AddForeignKey
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "week_resource_submissions" ADD CONSTRAINT "week_resource_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "week_resource_submissions" ADD CONSTRAINT "week_resource_submissions_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_rubric_fields" ADD CONSTRAINT "task_rubric_fields_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_grades" ADD CONSTRAINT "task_grades_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_grade_fields" ADD CONSTRAINT "task_grade_fields_taskGradeId_fkey" FOREIGN KEY ("taskGradeId") REFERENCES "task_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_grade_fields" ADD CONSTRAINT "task_grade_fields_rubricFieldId_fkey" FOREIGN KEY ("rubricFieldId") REFERENCES "task_rubric_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "st_transactions" ADD CONSTRAINT "st_transactions_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "st_transactions" ADD CONSTRAINT "st_transactions_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "weeks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
