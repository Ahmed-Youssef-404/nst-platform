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

export type WeekStatus = "upcoming" | "ongoing" | "ended";

export function computeWeekStatus(
    startDate: Date,
    endDate: Date,
    now: Date = new Date()
): WeekStatus {
    if (now < startDate) return "upcoming";
    if (now <= endDate) return "ongoing";
    return "ended";
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

export interface InstructorWeekSummary {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    playlistUrl: string;
    requiredFileLabel: string;
    status: WeekStatus;
    taskCount: number;
}

export interface InstructorGroupSummary {
    id: string;
    name: string;
    batchName: string;
    type: "BEGINNER" | "INTERMEDIATE";
    activeLevel: InstructorLevelSummary | null;
    weeks: InstructorWeekSummary[];
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
                    weeks: {
                        orderBy: { startDate: "asc" },
                        include: {
                            _count: { select: { tasks: true } },
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

        const weeks: InstructorWeekSummary[] = (group.weeks ?? []).map((week) => ({
            id: week.id,
            name: week.name,
            startDate: week.startDate,
            endDate: week.endDate,
            playlistUrl: week.playlistUrl,
            requiredFileLabel: week.requiredFileLabel,
            status: computeWeekStatus(week.startDate, week.endDate, now),
            taskCount: week._count.tasks,
        }));

        return {
            id: group.id,
            name: group.name,
            batchName: group.batch.name,
            type: group.type,
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
            weeks,
        };
    });
}