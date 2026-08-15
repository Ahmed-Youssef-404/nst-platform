// src/lib/data/get-student-level.ts
// Fetches everything a Student needs to see about a Level: its Sessions
// (with a runtime-computed status, same as get-my-groups.ts), and every
// Task with its Hints and this Student's own Submission (if any).
//
// Two entry points, both built on the same internal fetcher:
//   - getStudentLevel(studentId)              -> the Group's active Level
//   - getStudentLevelById(studentId, levelId) -> any Level (active or
//     historical), scoped to the student's own Group so a student can
//     never read another Group's Level by guessing its id (see Level
//     History feature - src/app/student/levels).
//
// Hint content: for the ACTIVE Level, content is only ever included for
// Hints this Student has already unlocked (join filtered by studentId) -
// locked Hints come back with content = null so nothing leaks before it's
// paid for. For a NON-active (historical) Level, every Hint's content is
// returned unlocked and free - the client decided that once a Level is
// over, hints are just study material, not something worth paying ST for
// (see Level History feature design). isUnlocked still reflects whether
// THIS student actually paid for it back when the Level was active, since
// that's still meaningful history - only `content` visibility changes.
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
    content: string | null; // null until unlocked (active Levels only)
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
    isActive: boolean;
    sessions: StudentSessionView[];
}

// Prisma's `where` for the single Level we resolve on Group.levels - either
// "the active one" or "this specific id" (further scoped to the student's
// own Group by virtue of being nested under `student.group.levels`).
type LevelSelector = { isActive: true } | { id: string };

async function fetchStudentLevelView(
    studentId: string,
    levelWhere: LevelSelector
): Promise<StudentLevelView | null> {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: {
            group: {
                select: {
                    name: true,
                    levels: {
                        where: levelWhere,
                        take: 1,
                        select: {
                            id: true,
                            name: true,
                            levelNumber: true,
                            isActive: true,
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

    const level = student.group.levels[0];
    if (!level) return null;

    const now = new Date();

    return {
        id: level.id,
        name: level.name,
        levelNumber: level.levelNumber,
        groupName: student.group.name,
        isActive: level.isActive,
        sessions: level.sessions.map((session) => ({
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
                        // Historical (non-active) Levels: every Hint reads as
                        // free study material regardless of whether this
                        // student ever paid to unlock it back when the Level
                        // was live. Active Levels: unchanged, paywalled.
                        const contentVisible = !level.isActive || isUnlocked;
                        return {
                            id: hint.id,
                            order: hint.order,
                            cost: hint.cost,
                            content: contentVisible ? hint.content : null,
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

export async function getStudentLevel(
    studentId: string
): Promise<StudentLevelView | null> {
    return fetchStudentLevelView(studentId, { isActive: true });
}

// Scoped to the student's own Group implicitly (levelId is looked up inside
// `student.group.levels`, so a Level belonging to a different Group simply
// won't match and this resolves to null - same "doesn't exist for you"
// shape as an unknown id, nothing leaks about other Groups).
export async function getStudentLevelById(
    studentId: string,
    levelId: string
): Promise<StudentLevelView | null> {
    return fetchStudentLevelView(studentId, { id: levelId });
}