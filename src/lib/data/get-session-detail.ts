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

// One row per Student in the Group, for attendance/engagement tracking on
// this Session. `attendanceStatus` is null until the Instructor records it
// (no default - we don't want to silently assume PRESENT or ABSENT).
// `engagementGiven` is one-way: true once recorded, and recordSessionEngagement
// throws if called again for the same (student, session) - there is no UI
// path to un-give it, matching the backend.
export interface SessionDetailRosterEntry {
    studentId: string;
    studentName: string;
    attendanceStatus: "PRESENT" | "ABSENT" | null;
    engagementGiven: boolean;
}

export interface SessionDetailHint {
    id: string;
    order: number;
    content: string;
    cost: number;
}

// One row per Student in the Group, for a single INTERNAL Task.
// `submission` is null when the Student hasn't submitted anything yet -
// the Instructor still needs to see the Student's name in that case, to
// know who's late.
export interface SessionDetailSubmission {
    studentId: string;
    studentName: string;
    submission: {
        id: string;
        mode: SubmissionModeCode;
        fileUrl: string | null;
        externalLink: string | null;
        textContent: string | null;
        submittedAt: Date;
        isLocked: boolean;
        isGraded: boolean;
        understandingScore: number | null;
        approachScore: number | null;
        correctnessScore: number | null;
        implementationScore: number | null;
        instructorComment: string | null;
    } | null;
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
    // Only populated for INTERNAL tasks - EXTERNAL tasks have no submissions.
    submissions: SessionDetailSubmission[];
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
    // Attendance/engagement roster - only meaningful once status is
    // "completed" (see comment in session-detail-view.tsx for why).
    roster: SessionDetailRosterEntry[];
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
                include: {
                    hints: { orderBy: { order: "asc" } },
                    submissions: true,
                },
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

    // Every Student in the Group, needed so the grading UI can show who
    // hasn't submitted yet - not just who has. Fetched once and reused
    // across every INTERNAL task in this Session.
    const groupStudents = await prisma.student.findMany({
        where: { groupId: session.level.groupId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    // Existing Attendance rows for this Session (one per student max,
    // enforced by the unique constraint) and any SESSION_ENGAGEMENT
    // transactions already recorded for it - both drive the roster below.
    const [attendanceRows, engagementTransactions] = await Promise.all([
        prisma.attendance.findMany({
            where: { sessionId },
            select: { studentId: true, status: true },
        }),
        prisma.sTTransaction.findMany({
            where: { reason: "SESSION_ENGAGEMENT", relatedEntityId: sessionId },
            select: { studentId: true },
        }),
    ]);
    const attendanceByStudent = new Map(
        attendanceRows.map((a) => [a.studentId, a.status])
    );
    const engagedStudentIds = new Set(
        engagementTransactions.map((t) => t.studentId)
    );

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
        roster: groupStudents.map((student) => ({
            studentId: student.id,
            studentName: student.name,
            attendanceStatus: attendanceByStudent.get(student.id) ?? null,
            engagementGiven: engagedStudentIds.has(student.id),
        })),
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
            submissions:
                task.type === "INTERNAL"
                    ? groupStudents.map((student) => {
                        const submission = task.submissions.find(
                            (s) => s.studentId === student.id
                        );
                        return {
                            studentId: student.id,
                            studentName: student.name,
                            submission: submission
                                ? {
                                    id: submission.id,
                                    mode: submission.mode as SubmissionModeCode,
                                    fileUrl: submission.fileUrl,
                                    externalLink: submission.externalLink,
                                    textContent: submission.textContent,
                                    submittedAt: submission.submittedAt,
                                    isLocked: submission.isLocked,
                                    isGraded: !!submission.gradedAt,
                                    understandingScore: submission.understandingScore,
                                    approachScore: submission.approachScore,
                                    correctnessScore: submission.correctnessScore,
                                    implementationScore: submission.implementationScore,
                                    instructorComment: submission.instructorComment,
                                }
                                : null,
                        };
                    })
                    : [],
        })),
    };
}