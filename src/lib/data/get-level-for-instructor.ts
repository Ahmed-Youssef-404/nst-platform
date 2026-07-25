// src/lib/data/get-level-for-instructor.ts
// Fetches a Level's context (name, Group, Batch) for the "Create Session"
// page, verifying the requesting Instructor is assigned to the Group that
// owns this Level. Also returns the startTime of the closest upcoming
// Session in this Level, if any, so the UI can show the Instructor the
// upper bound their Task deadlines must respect (the real enforcement
// still happens server-side in createSession).

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface LevelForInstructor {
    id: string;
    name: string;
    groupId: string;
    groupName: string;
    batchName: string;
    nextSessionStartTime: Date | null;
}

export async function getLevelForInstructor(
    levelId: string,
    instructorId: string
): Promise<LevelForInstructor | null> {
    const level = await prisma.level.findUnique({
        where: { id: levelId },
        include: { group: { include: { batch: true } } },
    });

    if (!level || !level.isActive) return null;

    const assignment = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId,
                groupId: level.groupId,
            },
        },
    });

    if (!assignment) return null;

    const now = new Date();
    const nextSession = await prisma.session.findFirst({
        where: { levelId, startTime: { gt: now } },
        orderBy: { startTime: "asc" },
        select: { startTime: true },
    });

    return {
        id: level.id,
        name: level.name,
        groupId: level.groupId,
        groupName: level.group.name,
        batchName: level.group.batch.name,
        nextSessionStartTime: nextSession?.startTime ?? null,
    };
}