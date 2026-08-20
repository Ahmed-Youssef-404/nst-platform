// prisma/backfill-level-st-balance.ts
//
// One-time data migration for the avgSt / LevelStBalance redesign, Phase 1.
//
// MUST run AFTER the "add_level_st_balance" migration (the level_st_balances
// table must already exist) and BEFORE the Phase 2 migration that drops
// students.levelSt / students.totalSt and adds students.avgSt.
//
// What it does, per Student:
//   1. Finds that Student's currently-active Level (Group.levels where
//      isActive = true). Every Student is assumed to be on exactly one
//      "current" Level for this backfill - we are NOT attempting to
//      reconstruct historical per-Level balances from old STTransaction
//      rows. This was a deliberate simplification agreed with Ahmed:
//      if a student has real history from an earlier Level that needs to
//      be preserved, that is entered manually afterwards, directly in the
//      DB - this script only handles the "current Level" baseline.
//   2. Upserts a LevelStBalance row for (studentId, activeLevelId) with
//      balance = that Student's current levelSt column value.
//   3. Does NOT touch students.levelSt, students.totalSt, or any
//      STTransaction row - this script is purely additive and can be
//      re-run safely (upsert is idempotent).
//
// It does NOT set students.avgSt (that column doesn't exist yet at this
// phase). Phase 2's migration sets avgSt = levelSt for every student as
// part of adding the column - see the phase-2 migration.sql - which is
// correct because at backfill time every student has exactly one
// LevelStBalance row, so average(one row) = that row's value.
//
// Safety:
//   - Read-only against Student/Group/Level; only writes new rows to
//     level_st_balances.
//   - Skips (and reports) any Student whose Group has no active Level,
//     rather than guessing - this should not happen in practice but the
//     script must not crash the whole run over one bad record.
//   - Prints a full summary at the end. Nothing is deleted, ever.
//
// Run with:
//   npx tsx prisma/backfill-level-st-balance.ts
//
// Dry run (report what WOULD happen, write nothing):
//   npx tsx prisma/backfill-level-st-balance.ts --dry-run

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
    console.log(`\n=== LevelStBalance backfill ${DRY_RUN ? "(DRY RUN - no writes)" : ""} ===\n`);

    const students = await prisma.student.findMany({
        select: {
            id: true,
            name: true,
            levelSt: true,
            groupId: true,
            group: {
                select: {
                    levels: {
                        where: { isActive: true },
                        select: { id: true, name: true, levelNumber: true },
                    },
                },
            },
        },
        orderBy: { id: "asc" },
    });

    console.log(`Found ${students.length} student(s) total.\n`);

    let created = 0;
    let alreadyExisted = 0;
    let skippedNoActiveLevel = 0;
    let skippedMultipleActiveLevels = 0;
    const skippedIds: string[] = [];

    for (const student of students) {
        const activeLevels = student.group.levels;

        if (activeLevels.length === 0) {
            console.warn(`  ⚠ SKIP ${student.id} (${student.name}) - Group has no active Level.`);
            skippedNoActiveLevel++;
            skippedIds.push(student.id);
            continue;
        }

        if (activeLevels.length > 1) {
            console.warn(
                `  ⚠ SKIP ${student.id} (${student.name}) - Group has ${activeLevels.length} active Levels ` +
                `(expected exactly 1: ${activeLevels.map((l) => l.name).join(", ")}). Fix data manually first.`
            );
            skippedMultipleActiveLevels++;
            skippedIds.push(student.id);
            continue;
        }

        const activeLevel = activeLevels[0];

        const existing = await prisma.levelStBalance.findUnique({
            where: { studentId_levelId: { studentId: student.id, levelId: activeLevel.id } },
        });

        if (existing) {
            console.log(`  = SKIP ${student.id} (${student.name}) - LevelStBalance already exists (balance: ${existing.balance}). Re-run is idempotent.`);
            alreadyExisted++;
            continue;
        }

        console.log(
            `  + ${student.id} (${student.name}) -> Level "${activeLevel.name}" (#${activeLevel.levelNumber}), balance = ${student.levelSt}`
        );

        if (!DRY_RUN) {
            await prisma.levelStBalance.create({
                data: {
                    studentId: student.id,
                    levelId: activeLevel.id,
                    balance: student.levelSt,
                },
            });
        }
        created++;
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total students:              ${students.length}`);
    console.log(`LevelStBalance created:      ${created}`);
    console.log(`Already existed (idempotent):${alreadyExisted}`);
    console.log(`Skipped (no active Level):   ${skippedNoActiveLevel}`);
    console.log(`Skipped (multiple active):   ${skippedMultipleActiveLevels}`);
    if (skippedIds.length > 0) {
        console.log(`\nSkipped student IDs (need manual attention): ${skippedIds.join(", ")}`);
    }
    if (DRY_RUN) {
        console.log(`\nThis was a DRY RUN - no rows were written. Re-run without --dry-run to apply.`);
    }
    console.log("");
}

main()
    .catch((err) => {
        console.error("Backfill failed:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });