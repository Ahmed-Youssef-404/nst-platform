// src/lib/data/get-student-level.ts
// Fetches everything a Student needs to see on their dashboard: their
// Group's currently active Level, every Session under it (with a
// runtime-computed status, same as get-my-groups.ts), and every Task with
// its Hints and this Student's own Submission (if any).
//
// Hint content is only ever included for Hints this Student has already
// unlocked (join filtered by studentId) - locked Hints come back with
// content = null so nothing leaks to the client before it's paid for.
//
// A Student's Group can have no active Level yet (nothing created) - that
// is a valid, empty state the UI must handle (returns null).

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeSessionStatus, type SessionStatus } from "./get-my-groups";
import type { TaskTypeCode, SubmissionModeCode } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface StudentHintView {
    id: string;
    order: number;
    cost: number;
    content: string | null; // null until this Student unlocks it
    isUnlocked: boolean;
}

export interface StudentSubmissionView {
    id: string;
    mode: SubmissionModeCode;
    fileUrl: string | null;
    externalLink: string | null;
    textContent: string | null;
    submittedAt: Date;
    isLocked: boolean;
    isGraded: boolean;
    totalScore: number | null; // sum of the 4 rubric scores, once graded
    instructorComment: string | null;
}

export interface StudentTaskView {
    id: string;
    title: string;
    description: string;
    type: TaskTypeCode;
    deadline: Date;
    isBonus: boolean;
    allowedSubmissionMode: SubmissionModeCode | null;
    isDeadlinePassed: boolean;
    hints: StudentHintView[];
    submission: StudentSubmissionView | null; // only meaningful for INTERNAL
}

export interface StudentSessionView {
    id: string;
    title: string;
    startTime: Date;
    durationMinutes: number;
    recordingLink: string | null;
    status: SessionStatus;
    tasks: StudentTaskView[];
}

export interface StudentLevelView {
    id: string;
    name: string;
    levelNumber: number;
    groupName: string;
    sessions: StudentSessionView[];
}

export async function getStudentLevel(
    studentId: string
): Promise<StudentLevelView | null> {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: {
            group: {
                select: {
                    name: true,
                    levels: {
                        where: { isActive: true },
                        take: 1,
                        select: {
                            id: true,
                            name: true,
                            levelNumber: true,
                            sessions: {
                                orderBy: { startTime: "asc" },
                                select: {
                                    id: true,
                                    title: true,
                                    startTime: true,
                                    durationMinutes: true,
                                    recordingLink: true,
                                    tasks: {
                                        select: {
                                            id: true,
                                            title: true,
                                            description: true,
                                            type: true,
                                            deadline: true,
                                            isBonus: true,
                                            allowedSubmissionMode: true,
                                            hints: {
                                                orderBy: { order: "asc" },
                                                select: {
                                                    id: true,
                                                    order: true,
                                                    content: true,
                                                    cost: true,
                                                    hintUnlocks: {
                                                        where: { studentId },
                                                        select: { id: true },
                                                    },
                                                },
                                            },
                                            submissions: {
                                                where: { studentId },
                                                select: {
                                                    id: true,
                                                    mode: true,
                                                    fileUrl: true,
                                                    externalLink: true,
                                                    textContent: true,
                                                    submittedAt: true,
                                                    isLocked: true,
                                                    gradedAt: true,
                                                    understandingScore: true,
                                                    approachScore: true,
                                                    correctnessScore: true,
                                                    implementationScore: true,
                                                    instructorComment: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const activeLevel = student.group.levels[0];
    if (!activeLevel) return null;

    const now = new Date();

    return {
        id: activeLevel.id,
        name: activeLevel.name,
        levelNumber: activeLevel.levelNumber,
        groupName: student.group.name,
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
            tasks: session.tasks.map((task) => {
                const submission = task.submissions[0];
                const isGraded = !!submission?.gradedAt;

                return {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    type: task.type as TaskTypeCode,
                    deadline: task.deadline,
                    isBonus: task.isBonus,
                    allowedSubmissionMode:
                        task.allowedSubmissionMode as SubmissionModeCode | null,
                    isDeadlinePassed: task.deadline <= now,
                    hints: task.hints.map((hint) => {
                        const isUnlocked = hint.hintUnlocks.length > 0;
                        return {
                            id: hint.id,
                            order: hint.order,
                            cost: hint.cost,
                            content: isUnlocked ? hint.content : null,
                            isUnlocked,
                        };
                    }),
                    submission: submission
                        ? {
                            id: submission.id,
                            mode: submission.mode as SubmissionModeCode,
                            fileUrl: submission.fileUrl,
                            externalLink: submission.externalLink,
                            textContent: submission.textContent,
                            submittedAt: submission.submittedAt,
                            isLocked: submission.isLocked,
                            isGraded,
                            totalScore: isGraded
                                ? (submission.understandingScore ?? 0) +
                                  (submission.approachScore ?? 0) +
                                  (submission.correctnessScore ?? 0) +
                                  (submission.implementationScore ?? 0)
                                : null,
                            instructorComment: submission.instructorComment,
                        }
                        : null,
                };
            }),
        })),
    };
}