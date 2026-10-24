-- AlterEnum
ALTER TYPE "STReason" ADD VALUE 'INSTRUCTOR_ADJUSTMENT';

-- AlterTable
ALTER TABLE "st_transactions"
  ADD COLUMN "actorId" TEXT,
  ADD COLUMN "note" TEXT,
  ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "st_transactions_idempotencyKey_key" ON "st_transactions"("idempotencyKey");
