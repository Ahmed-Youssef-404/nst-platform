// src/lib/data/get-week-detail.ts
// Read-only fetcher for the Instructor Week Detail & Grading views.
// Verifies the requesting Instructor is assigned to the Group that owns
// this Week - returns null if not found or unauthorized.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeWeekStatus, type WeekStatus } from "./get-my-groups";
import type { TaskTypeCode, SubmissionModeCode, WeekResourceStatusCode } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface WeekDetailHint {
    id: string;
    order: number;
    content: string;
    cost: number;
}

export interface WeekDetailRubricField {
    id: string;
    order: number;
    fieldName: string;
    maxPoints: number;
}

export interface WeekDetailTask {
    id: string;
    title: string;
    description: string;
    type: TaskTypeCode;
    deadline: Date;
    isBonus: boolean;
    allowedSubmissionMode: SubmissionModeCode | null;
    hints: WeekDetailHint[];
    rubricFields: WeekDetailRubricField[];
}

export interface WeekStudentRosterEntry {
    studentId: string;
    studentName: string;
    resource: {
        id: string;
        fileUrl: string | null;
        status: WeekResourceStatusCode;
        submittedAt: Date | null;
        lockedAt: Date | null;
    } | null;
    isLocked: boolean; // resource?.lockedAt !== null
    draftOrSubmittedTaskCount: number;
    isFinalized: boolean; // whether finalizeWeekGrading has been executed
    totalPoints: number | null;
}

export interface WeekDetailForInstructor {
    id: string;
    groupId: string;
    groupName: string;
    batchName: string;
    name: string;
    startDate: Date;
    endDate: Date;
    playlistUrl: string;
    requiredFileLabel: string;
    status: WeekStatus;
    canEditTasks: boolean;
    canEditDates: boolean;
    tasks: WeekDetailTask[];
    students: WeekStudentRosterEntry[];
}

export interface GroupForWeekCreation {
    id: string;
    name: string;
    batchName: string;
}

export async function getGroupForWeekCreation(
    groupId: string,
    instructorId: string
): Promise<GroupForWeekCreation | null> {
    const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: { batch: true },
    });

    if (!group || group.type !== "BEGINNER") return null;

    const assignment = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId,
                groupId,
            },
        },
    });

    if (!assignment) return null;

    return {
        id: group.id,
        name: group.name,
        batchName: group.batch.name,
    };
}

export async function getWeekDetail(
    weekId: string,
    instructorId: string
): Promise<WeekDetailForInstructor | null> {
    const week = await prisma.week.findUnique({
        where: { id: weekId },
        include: {
            group: {
                include: {
                    batch: true,
                    students: {
                        orderBy: { name: "asc" },
                        select: { id: true, name: true },
                    },
                },
            },
            tasks: {
                include: {
                    hints: { orderBy: { order: "asc" } },
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
    const canEditTasks = now < week.startDate;
    const canEditDates = now < week.startDate;

    const taskIds = week.tasks.map((t) => t.id);

    // Load submissions and task grades for this week's tasks to check student completion
    const submissions = taskIds.length > 0
        ? await prisma.submission.findMany({
            where: { taskId: { in: taskIds } },
            include: {
                taskGrade: true,
            },
        })
        : [];

    const resourceMap = new Map(
        week.resourceSubmissions.map((res) => [res.studentId, res])
    );

    const students: WeekStudentRosterEntry[] = week.group.students.map((student) => {
        const resource = resourceMap.get(student.id) ?? null;
        const studentSubmissions = submissions.filter((s) => s.studentId === student.id);
        const hasFinalizedGrade = studentSubmissions.some(
            (s) => s.taskGrade?.finalizedAt !== null && s.taskGrade?.finalizedAt !== undefined
        );

        const totalPointsSum = studentSubmissions.reduce((acc, s) => {
            if (s.taskGrade?.totalPoints) {
                return acc + s.taskGrade.totalPoints;
            }
            return acc;
        }, 0);

        return {
            studentId: student.id,
            studentName: student.name,
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
            draftOrSubmittedTaskCount: studentSubmissions.length,
            isFinalized: hasFinalizedGrade,
            totalPoints: hasFinalizedGrade ? totalPointsSum : null,
        };
    });

    return {
        id: week.id,
        groupId: week.groupId,
        groupName: week.group.name,
        batchName: week.group.batch.name,
        name: week.name,
        startDate: week.startDate,
        endDate: week.endDate,
        playlistUrl: week.playlistUrl,
        requiredFileLabel: week.requiredFileLabel,
        status,
        canEditTasks,
        canEditDates,
        tasks: week.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            type: task.type as TaskTypeCode,
            deadline: task.deadline,
            isBonus: task.isBonus,
            allowedSubmissionMode: task.allowedSubmissionMode as SubmissionModeCode | null,
            hints: task.hints.map((h) => ({
                id: h.id,
                order: h.order,
                content: h.content,
                cost: h.cost,
            })),
            rubricFields: task.rubricFields.map((r) => ({
                id: r.id,
                order: r.order,
                fieldName: r.fieldName,
                maxPoints: r.maxPoints,
            })),
        })),
        students,
    };
}
