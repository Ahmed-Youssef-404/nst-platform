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
//
// NOT handled here (deliberately deferred, matches the existing TBD note
// "Group Level transition business logic" / "Phase 4" in schema.prisma):
//   - resetting each Student's level_st balance in the affected Groups
// If/when that lands, it should run in the same $transaction as below.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CreateLevelInput, CreateLevelResult } from "@/types/types";

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
    // (with its old one deactivated), or nothing changes at all.
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