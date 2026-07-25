// src/lib/data/get-my-groups.ts
// Fetches everything an Instructor needs for their dashboard: every Group
// they're assigned to, that Group's currently active Level (if any), and
// every Session under that Level - with a runtime-computed status
// (upcoming/ongoing/completed), since status is never stored as a column.
//
// A Group can have zero Levels yet (nothing created), or a Level with zero
// Sessions yet - both are valid, empty states the UI must handle.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export type SessionStatus = "upcoming" | "ongoing" | "completed";

export function computeSessionStatus(
    startTime: Date,
    durationMinutes: number,
    now: Date = new Date()
): SessionStatus {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);
    if (now < startTime) return "upcoming";
    if (now >= startTime && now <= endTime) return "ongoing";
    return "completed";
}

export interface InstructorSessionSummary {
    id: string;
    title: string;
    startTime: Date;
    durationMinutes: number;
    recordingLink: string | null;
    status: SessionStatus;
    taskCount: number;
}

export interface InstructorLevelSummary {
    id: string;
    name: string;
    levelNumber: number;
    startDate: Date;
    sessions: InstructorSessionSummary[];
}

export interface InstructorGroupSummary {
    id: string;
    name: string;
    batchName: string;
    activeLevel: InstructorLevelSummary | null;
}

export async function getMyGroups(
    instructorId: string
): Promise<InstructorGroupSummary[]> {
    const instructorGroups = await prisma.instructorGroup.findMany({
        where: { instructorId },
        include: {
            group: {
                include: {
                    batch: true,
                    levels: {
                        where: { isActive: true },
                        take: 1,
                        include: {
                            sessions: {
                                orderBy: { startTime: "asc" },
                                include: { _count: { select: { tasks: true } } },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [{ group: { batch: { name: "asc" } } }, { group: { name: "asc" } }],
    });

    const now = new Date();

    return instructorGroups.map(({ group }) => {
        const activeLevel = group.levels[0] ?? null;

        return {
            id: group.id,
            name: group.name,
            batchName: group.batch.name,
            activeLevel: activeLevel
                ? {
                    id: activeLevel.id,
                    name: activeLevel.name,
                    levelNumber: activeLevel.levelNumber,
                    startDate: activeLevel.startDate,
                    sessions: activeLevel.sessions.map((session) => ({
                        id: session.id,
                        title: session.title,
                        startTime: session.startTime,
                        durationMinutes: session.durationMinutes,
                        recordingLink: session.recordingLink,
                        status: computeSessionStatus(
                            session.startTime,
                            session.durationMinutes,
                            now
                        ),
                        taskCount: session._count.tasks,
                    })),
                }
                : null,
        };
    });
}