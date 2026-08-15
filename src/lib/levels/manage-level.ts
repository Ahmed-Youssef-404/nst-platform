// src/lib/levels/manage-level.ts
// Functions responsible for creating a Level and attaching it to one or
// more Groups at once. Used by SuperAdmin only (authorization check
// happens in the calling Server Action).
//
// A Level row always belongs to exactly ONE Group (Level.groupId is a
// single FK - see schema.prisma). "Attaching several Groups to a Level"
// therefore means: create one independent Level row per selected Group,
// all sharing the same name/description/levelNumber, in a single atomic
// operation.
//
// For each selected Group, this also performs the Level transition described
// in schema.prisma:
//   1) that Group's current isActive Level (if any) -> isActive = false
//   2) the new Level is created with isActive = true, startDate = now()
//   3) every Student in that Group gets levelSt reset to exactly 50, with a
//      LEVEL_RESET STTransaction recorded for each (see
//      resetLevelStForTransition in create-transaction.ts). totalSt is left
//      untouched - it's the cumulative, never-resets balance.
// The old Level row is NOT deleted or hidden - it stays exactly as-is
// (isActive: false) with all its Sessions/Tasks/Submissions intact, so
// nothing about it disappears for the Student or Instructor; only the
// Group's "current" pointer moves.
//
// All of the above - Level deactivate, Level create, and every affected
// Student's ST reset - happens inside ONE Prisma transaction per call, so
// a partial failure (e.g. a reset failing halfway through a large Group)
// never leaves the Group pointed at a new Level while some students still
// carry their old balance.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CreateLevelInput, CreateLevelResult } from "@/types/types";
import { resetLevelStForTransition } from "@/lib/st-economy/create-transaction";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function createLevel(
    input: CreateLevelInput
): Promise<CreateLevelResult[]> {
    const name = input.name.trim();
    if (!name) {
        throw new Error("Level name cannot be empty.");
    }

    if (!Number.isInteger(input.levelNumber) || input.levelNumber <= 0) {
        throw new Error("Level number must be a positive whole number.");
    }

    const description = input.description?.trim() || null;

    // Dedupe in case the client sends the same Group id twice.
    const groupIds = Array.from(new Set(input.groupIds));

    if (groupIds.length === 0) {
        throw new Error("Select at least one Group for this Level.");
    }

    const existingGroups = await prisma.group.findMany({
        where: { id: { in: groupIds } },
        select: { id: true },
    });

    if (existingGroups.length !== groupIds.length) {
        throw new Error("One or more selected Groups do not exist.");
    }

    // Create everything atomically: either every Group gets its new Level
    // (with its old one deactivated and every Student's levelSt reset to
    // 50), or nothing changes at all.
    const created = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const groupId of groupIds) {
            await tx.level.updateMany({
                where: { groupId, isActive: true },
                data: { isActive: false },
            });

            const level = await tx.level.create({
                data: {
                    groupId,
                    name,
                    description,
                    levelNumber: input.levelNumber,
                    isActive: true,
                    startDate: new Date(),
                },
            });

            results.push(level);

            // Reset every Student currently in this Group to levelSt = 50,
            // no exceptions - including students who joined the Group late
            // during the previous Level (they don't carry any separate
            // "old" balance, so they reset just like everyone else).
            const students = await tx.student.findMany({
                where: { groupId },
                select: { id: true },
            });

            for (const student of students) {
                await resetLevelStForTransition(tx, {
                    studentId: student.id,
                    newLevelId: level.id,
                });
            }
        }

        return results;
    });

    return created.map((level) => ({
        id: level.id,
        groupId: level.groupId,
        name: level.name,
        levelNumber: level.levelNumber,
        startDate: level.startDate,
    }));
}