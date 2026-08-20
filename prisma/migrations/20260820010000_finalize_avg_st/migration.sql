-- Phase 2 of the avgSt / LevelStBalance redesign.
--
-- IMPORTANT: this migration must run AFTER prisma/backfill-level-st-balance.ts
-- has been executed successfully (every Student must already have a
-- LevelStBalance row for their active Level). It does NOT itself populate
-- level_st_balances - that already happened in Phase 1.
--
-- Ordering matters here - each step is safe only because of the one before it:
--   1) Add avgSt as NULLABLE first (no default requirement, so it's instant
--      even with existing rows).
--   2) Backfill avgSt = levelSt for every student. This is correct (not an
--      approximation) because at this point every student has exactly one
--      LevelStBalance row (from the Phase 1 backfill), so
--      average(one row) == that row's value == the old levelSt value.
--   3) Make avgSt NOT NULL now that every row has a real value.
--   4) Add avgStBalance as NULLABLE on st_transactions.
--   5) Backfill avgStBalance = totalStBalance for all 465 existing rows -
--      preserves the historical snapshot exactly, just under the new
--      column name (agreed with Ahmed: old rows keep their old totalSt
--      snapshot value, since recomputing them under the new avg logic
--      retroactively isn't meaningful).
--   6) Make avgStBalance NOT NULL.
--   7) Only now, with both new columns fully populated, drop the old
--      levelSt / totalSt / totalStBalance columns.

-- Step 1: add avgSt (nullable for now)
ALTER TABLE "students" ADD COLUMN "avgSt" INTEGER;

-- Step 2: backfill avgSt from the current levelSt (see comment above for why
-- this is exact, not approximate, at this point in time)
UPDATE "students" SET "avgSt" = "levelSt";

-- Step 3: enforce NOT NULL now that every row is populated
ALTER TABLE "students" ALTER COLUMN "avgSt" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "avgSt" SET DEFAULT 50;

-- Step 4: add avgStBalance (nullable for now)
ALTER TABLE "st_transactions" ADD COLUMN "avgStBalance" INTEGER;

-- Step 5: backfill avgStBalance from the existing totalStBalance snapshots
UPDATE "st_transactions" SET "avgStBalance" = "totalStBalance";

-- Step 6: enforce NOT NULL now that every row is populated
ALTER TABLE "st_transactions" ALTER COLUMN "avgStBalance" SET NOT NULL;

-- Step 7: drop the deprecated columns, now that avgSt / avgStBalance fully
-- replace them everywhere
ALTER TABLE "students" DROP COLUMN "levelSt";
ALTER TABLE "students" DROP COLUMN "totalSt";
ALTER TABLE "st_transactions" DROP COLUMN "totalStBalance";