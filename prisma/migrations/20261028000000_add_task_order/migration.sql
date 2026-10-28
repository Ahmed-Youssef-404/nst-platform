-- AddColumn: add `order` to tasks with default 0
ALTER TABLE "tasks" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing Week tasks: assign 1-based positions ordered by createdAt ASC, id ASC
-- Each week's tasks are numbered independently.
WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "weekId"
            ORDER BY "createdAt" ASC, id ASC
        ) AS rn
    FROM "tasks"
    WHERE "weekId" IS NOT NULL
)
UPDATE "tasks"
SET "order" = ranked.rn
FROM ranked
WHERE "tasks".id = ranked.id
  AND "tasks"."weekId" IS NOT NULL;

-- Backfill existing Session tasks: assign 1-based positions ordered by createdAt ASC, id ASC
-- Each session's tasks are numbered independently.
WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "sessionId"
            ORDER BY "createdAt" ASC, id ASC
        ) AS rn
    FROM "tasks"
    WHERE "sessionId" IS NOT NULL
)
UPDATE "tasks"
SET "order" = ranked.rn
FROM ranked
WHERE "tasks".id = ranked.id
  AND "tasks"."sessionId" IS NOT NULL;
