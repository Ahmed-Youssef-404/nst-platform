// src/lib/data/get-week-grading-data.ts
// Read-only fetcher for the Instructor Week Grading screen.
// Loads all students in the Group, their solutions per Task, their draft grades,
// the required week resource deliverable, and first-solver suggestions.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { suggestFirstSolvers } from "@/lib/weeks/grade-week";
import { computeWeekStatus, type WeekStatus } from "./get-my-groups";
import type {
    TaskTypeCode,
    SubmissionModeCode,
    WeekResourceStatusCode,
    FirstSolverSuggestion,
} from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface GradingTaskRubricField {
    id: string;
    fieldName: string;
    maxPoints: number;
    order: number;
}

export interface GradingTask {
    id: string;
    title: string;
    description: string;
    type: TaskTypeCode;
    deadline: Date;
    isBonus: boolean;
    allowedSubmissionMode: SubmissionModeCode | null;
    rubricFields: GradingTaskRubricField[];
}

export interface StudentTaskGradingData {
    taskId: string;
    submission: {
        id: string;
        mode: SubmissionModeCode;
        fileUrl: string | null;
        externalLink: string | null;
        textContent: string | null;
        instructorComment: string | null;
        status: "DRAFT" | "SUBMITTED";
        submittedAt: Date;
    } | null;
    draftGrade: {
        id: string;
        markedInvalid: boolean;
        finalizedAt: Date | null;
        fieldScores: { rubricFieldId: string; awardedPoints: number }[];
        totalPoints: number | null;
    } | null;
}

export interface StudentGradingRow {
    studentId: string;
    studentName: string;
    beginnerSt: number;
    resource: {
        id: string;
        fileUrl: string | null;
        status: WeekResourceStatusCode;
        submittedAt: Date | null;
        lockedAt: Date | null;
    } | null;
    isLocked: boolean;
    isFinalized: boolean;
    tasks: StudentTaskGradingData[];
}

export interface WeekGradingViewData {
    week: {
        id: string;
        name: string;
        groupId: string;
        groupName: string;
        batchName: string;
        startDate: Date;
        endDate: Date;
        requiredFileLabel: string;
        playlistUrl: string;
        status: WeekStatus;
    };
    tasks: GradingTask[];
    firstSolverSuggestions: FirstSolverSuggestion[];
    students: StudentGradingRow[];
}

export async function getWeekGradingData(
    weekId: string,
    instructorId: string
): Promise<WeekGradingViewData | null> {
    const week = await prisma.week.findUnique({
        where: { id: weekId },
        include: {
            group: {
                include: {
                    batch: true,
                    students: {
                        orderBy: { name: "asc" },
                        select: { id: true, name: true, beginnerSt: true },
                    },
                },
            },
            tasks: {
                include: {
                    rubricFields: { orderBy: { order: "asc" } },
                },
                orderBy: { createdAt: "asc" },
            },
            resourceSubmissions: true,
        },
    });

    if (!week) return null;

    const assignment = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId,
                groupId: week.groupId,
            },
        },
    });

    if (!assignment) return null;

    const now = new Date();
    const status = computeWeekStatus(week.startDate, week.endDate, now);

    const taskIds = week.tasks.map((t) => t.id);

    // Fetch submissions with taskGrade and grade fields
    const submissions = taskIds.length > 0
        ? await prisma.submission.findMany({
            where: { taskId: { in: taskIds } },
            include: {
                taskGrade: {
                    include: {
                        fieldScores: true,
                    },
                },
            },
        })
        : [];

    // Get first solver suggestions
    const firstSolverSuggestions = await suggestFirstSolvers({ weekId });

    const resourceMap = new Map(
        week.resourceSubmissions.map((r) => [r.studentId, r])
    );

    const studentIds = week.group.students.map((s) => s.id);
    const finalizedTransactions = await prisma.sTTransaction.findMany({
        where: { weekId, studentId: { in: studentIds } },
        select: { studentId: true },
        distinct: ["studentId"],
    });
    const finalizedStudentIds = new Set(finalizedTransactions.map((t) => t.studentId));

    const students: StudentGradingRow[] = week.group.students.map((student) => {
        const resource = resourceMap.get(student.id) ?? null;
        const studentSubmissions = submissions.filter((s) => s.studentId === student.id);

        const isFinalized =
            finalizedStudentIds.has(student.id) ||
            studentSubmissions.some(
                (s) => s.taskGrade?.finalizedAt !== null && s.taskGrade?.finalizedAt !== undefined
            );

        const tasksData: StudentTaskGradingData[] = week.tasks.map((task) => {
            const sub = studentSubmissions.find((s) => s.taskId === task.id) ?? null;
            const draftGrade = sub?.taskGrade ?? null;

            return {
                taskId: task.id,
                submission: sub
                    ? {
                        id: sub.id,
                        mode: sub.mode as SubmissionModeCode,
                        fileUrl: sub.fileUrl,
                        externalLink: sub.externalLink,
                        textContent: sub.textContent,
                        instructorComment: sub.instructorComment ?? null,
                        status: sub.status,
                        submittedAt: sub.submittedAt,
                    }
                    : null,
                draftGrade: draftGrade
                    ? {
                        id: draftGrade.id,
                        markedInvalid: draftGrade.markedInvalid,
                        finalizedAt: draftGrade.finalizedAt,
                        fieldScores: draftGrade.fieldScores.map((fs) => ({
                            rubricFieldId: fs.rubricFieldId,
                            awardedPoints: fs.awardedPoints,
                        })),
                        totalPoints: draftGrade.totalPoints,
                    }
                    : null,
            };
        });

        return {
            studentId: student.id,
            studentName: student.name,
            beginnerSt: student.beginnerSt ?? 0,
            resource: resource
                ? {
                    id: resource.id,
                    fileUrl: resource.fileUrl,
                    status: resource.status as WeekResourceStatusCode,
                    submittedAt: resource.submittedAt,
                    lockedAt: resource.lockedAt,
                }
                : null,
            isLocked: Boolean(resource?.lockedAt),
            isFinalized,
            tasks: tasksData,
        };
    });

    return {
        week: {
            id: week.id,
            name: week.name,
            groupId: week.groupId,
            groupName: week.group.name,
            batchName: week.group.batch.name,
            startDate: week.startDate,
            endDate: week.endDate,
            requiredFileLabel: week.requiredFileLabel,
            playlistUrl: week.playlistUrl,
            status,
        },
        tasks: week.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            type: t.type as TaskTypeCode,
            deadline: t.deadline,
            isBonus: t.isBonus,
            allowedSubmissionMode: t.allowedSubmissionMode as SubmissionModeCode | null,
            rubricFields: t.rubricFields.map((rf) => ({
                id: rf.id,
                fieldName: rf.fieldName,
                maxPoints: rf.maxPoints,
                order: rf.order,
            })),
        })),
        firstSolverSuggestions,
        students,
    };
}
