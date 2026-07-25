// src/lib/data/get-session-detail.ts
// Fetches a single Session with all of its Tasks and Hints, for the
// Instructor session-detail page. Also verifies the requesting Instructor
// is actually assigned to the Group that owns this Session's Level -
// returns null if not found or not authorized, so the page can 404/redirect
// rather than leak another Instructor's content.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeSessionStatus, type SessionStatus } from "./get-my-groups";
import type { TaskTypeCode, SubmissionModeCode } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface SessionDetailHint {
    id: string;
    order: number;
    content: string;
    cost: number;
}

export interface SessionDetailTask {
    id: string;
    title: string;
    description: string;
    type: TaskTypeCode;
    deadline: Date;
    isBonus: boolean;
    allowedSubmissionMode: SubmissionModeCode | null;
    hints: SessionDetailHint[];
}

export interface SessionDetail {
    id: string;
    levelId: string;
    groupId: string;
    groupName: string;
    levelName: string;
    title: string;
    startTime: Date;
    durationMinutes: number;
    recordingLink: string | null;
    status: SessionStatus;
    tasks: SessionDetailTask[];
}

export async function getSessionDetail(
    sessionId: string,
    instructorId: string
): Promise<SessionDetail | null> {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            level: { include: { group: true } },
            tasks: {
                include: { hints: { orderBy: { order: "asc" } } },
            },
        },
    });

    if (!session) return null;

    const assignment = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId,
                groupId: session.level.groupId,
            },
        },
    });

    if (!assignment) return null;

    return {
        id: session.id,
        levelId: session.levelId,
        groupId: session.level.groupId,
        groupName: session.level.group.name,
        levelName: session.level.name,
        title: session.title,
        startTime: session.startTime,
        durationMinutes: session.durationMinutes,
        recordingLink: session.recordingLink,
        status: computeSessionStatus(session.startTime, session.durationMinutes),
        tasks: session.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            type: task.type as TaskTypeCode,
            deadline: task.deadline,
            isBonus: task.isBonus,
            allowedSubmissionMode: task.allowedSubmissionMode as SubmissionModeCode | null,
            hints: task.hints.map((hint) => ({
                id: hint.id,
                order: hint.order,
                content: hint.content,
                cost: hint.cost,
            })),
        })),
    };
}