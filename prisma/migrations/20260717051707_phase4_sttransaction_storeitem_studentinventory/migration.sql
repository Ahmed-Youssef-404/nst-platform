-- CreateEnum
CREATE TYPE "STTransactionType" AS ENUM ('REWARD', 'PENALTY');

-- CreateEnum
CREATE TYPE "STReason" AS ENUM ('ATTENDANCE', 'SESSION_ENGAGEMENT', 'SUBMIT_BEFORE_DEADLINE', 'BONUS_TASK_SOLVED', 'FIRST_SOLVER', 'FINISH_ALL_TASKS', 'RUBRIC_GRADING', 'WEEKLY_MISSION', 'HINT_UNLOCK', 'MISSED_SESSION', 'TASK_NOT_SUBMITTED', 'STORE_PURCHASE', 'MANUAL_ADJUSTMENT');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "levelSt" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "totalSt" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "st_transactions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "type" "STTransactionType" NOT NULL,
    "reason" "STReason" NOT NULL,
    "amount" INTEGER NOT NULL,
    "relatedEntityId" TEXT,
    "levelStBalance" INTEGER NOT NULL,
    "totalStBalance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "st_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "cost" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_inventory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "storeItemId" TEXT NOT NULL,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_inventory_studentId_storeItemId_key" ON "student_inventory"("studentId", "storeItemId");

-- AddForeignKey
ALTER TABLE "st_transactions" ADD CONSTRAINT "st_transactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "st_transactions" ADD CONSTRAINT "st_transactions_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_inventory" ADD CONSTRAINT "student_inventory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_inventory" ADD CONSTRAINT "student_inventory_storeItemId_fkey" FOREIGN KEY ("storeItemId") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
