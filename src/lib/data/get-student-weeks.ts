// src/lib/data/get-student-weeks.ts
// Read-only fetchers for a Student enrolled in a BEGINNER-track Group:
//   - getStudentWeeks(studentId)              -> lists all Weeks with progress
//   - getStudentWeekDetail(studentId, weekId) -> single Week with Tasks, Rubrics, Hints & Submissions
//
// Scoped strictly to the requesting Student's own Group. Returns null if the
// student is not in a BEGINNER group, or if the week does not belong to them.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeWeekStatus, type WeekStatus } from "./get-my-groups";
import type {
    TaskTypeCode,
    SubmissionModeCode,
    SubmissionStatusCode,
    WeekResourceStatusCode,
} from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface StudentWeekSummary {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    playlistUrl: string;
    requiredFileLabel: string;
    status: WeekStatus;
    isLocked: boolean;
    canWrite: boolean;
    resource: {
        id: string;
        fileUrl: string | null;
        status: WeekResourceStatusCode;
        submittedAt: Date | null;
        lockedAt: Date | null;
    } | null;
    totalTasks: number;
    internalTasks: number;
    draftTasksCount: number;
    submittedTasksCount: number;
    gradedTasksCount: number;
}

export interface StudentWeeksData {
    groupName: string;
    batchName: string;
    beginnerSt: number;
    weeks: StudentWeekSummary[];
}

export async function getStudentWeeks(
    studentId: string
): Promise<StudentWeeksData | null> {
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            name: true,
            beginnerSt: true,
            group: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    batch: { select: { name: true } },
                    weeks: {
                        orderBy: { startDate: "asc" },
                        select: {
                            id: true,
                            name: true,
                            startDate: true,
                            endDate: true,
                            playlistUrl: true,
                            requiredFileLabel: true,
                            tasks: {
                                select: {
                                    id: true,
                                    type: true,
                                    submissions: {
                                        where: { studentId },
                                        select: {
                                            id: true,
                                            status: true,
                                            isLocked: true,
                                            taskGrade: {
                                                select: { finalizedAt: true },
                                            },
                                        },
                                    },
                                },
                            },
                            resourceSubmissions: {
                                where: { studentId },
                                select: {
                                    id: true,
                                    fileUrl: true,
                                    status: true,
                                    submittedAt: true,
                                    lockedAt: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!student || student.group.type !== "BEGINNER") {
        return null;
    }

    const now = new Date();

    const weeks: StudentWeekSummary[] = student.group.weeks.map((week) => {
        const status = computeWeekStatus(week.startDate, week.endDate, now);
        const resource = week.resourceSubmissions[0]
            ? {
                  id: week.resourceSubmissions[0].id,
                  fileUrl: week.resourceSubmissions[0].fileUrl,
                  status: week.resourceSubmissions[0].status as WeekResourceStatusCode,
                  submittedAt: week.resourceSubmissions[0].submittedAt,
                  lockedAt: week.resourceSubmissions[0].lockedAt,
              }
            : null;

        const isLocked = Boolean(resource?.lockedAt);
        const canWrite = status === "ongoing" && !isLocked;

        const totalTasks = week.tasks.length;
        const internalTasks = week.tasks.filter((t) => t.type === "INTERNAL").length;
        const draftTasksCount = week.tasks.filter(
            (t) => t.submissions[0]?.status === "DRAFT"
        ).length;
        const submittedTasksCount = week.tasks.filter(
            (t) => t.submissions[0]?.status === "SUBMITTED"
        ).length;
        const gradedTasksCount = week.tasks.filter(
            (t) => t.submissions[0]?.taskGrade?.finalizedAt != null
        ).length;

        return {
            id: week.id,
            name: week.name,
            startDate: week.startDate,
            endDate: week.endDate,
            playlistUrl: week.playlistUrl,
            requiredFileLabel: week.requiredFileLabel,
            status,
            isLocked,
            canWrite,
            resource,
            totalTasks,
            internalTasks,
            draftTasksCount,
            submittedTasksCount,
            gradedTasksCount,
        };
    });

    return {
        groupName: student.group.name,
        batchName: student.group.batch.name,
        beginnerSt: student.beginnerSt ?? 0,
        weeks,
    };
}

export interface StudentWeekDetailTask {
    id: string;
    title: string;
    description: string;
    type: TaskTypeCode;
    deadline: Date;
    isBonus: boolean;
    allowedSubmissionMode: SubmissionModeCode | null;
    rubricFields: {
        id: string;
        fieldName: string;
        maxPoints: number;
        order: number;
    }[];
    hints: {
        id: string;
        order: number;
        cost: number;
        content: string | null;
        isUnlocked: boolean;
    }[];
    submission: {
        id: string;
        mode: SubmissionModeCode;
        fileUrl: string | null;
        externalLink: string | null;
        textContent: string | null;
        status: SubmissionStatusCode;
        submittedAt: Date;
        isLocked: boolean;
        grade: {
            totalPoints: number | null;
            markedInvalid: boolean;
            finalizedAt: Date | null;
            instructorComment: string | null;
            fieldScores: {
                rubricFieldId: string;
                fieldName: string;
                awardedPoints: number;
                maxPoints: number;
            }[];
        } | null;
    } | null;
}

export interface StudentWeekDetail {
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
    isLocked: boolean;
    canWrite: boolean;
    beginnerSt: number;
    resource: {
        id: string;
        fileUrl: string | null;
        status: WeekResourceStatusCode;
        submittedAt: Date | null;
        lockedAt: Date | null;
    } | null;
    tasks: StudentWeekDetailTask[];
}

export async function getStudentWeekDetail(
    studentId: string,
    weekId: string
): Promise<StudentWeekDetail | null> {
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
            groupId: true,
            beginnerSt: true,
            group: {
                select: {
                    type: true,
                    name: true,
                    batch: { select: { name: true } },
                },
            },
        },
    });

    if (!student || student.group.type !== "BEGINNER") {
        return null;
    }

    const week = await prisma.week.findUnique({
        where: { id: weekId },
        include: {
            resourceSubmissions: {
                where: { studentId },
            },
            tasks: {
                orderBy: { createdAt: "asc" },
                include: {
                    rubricFields: {
                        orderBy: { order: "asc" },
                    },
                    hints: {
                        orderBy: { order: "asc" },
                        include: {
                            hintUnlocks: {
                                where: { studentId },
                                select: { id: true },
                            },
                        },
                    },
                    submissions: {
                        where: { studentId },
                        include: {
                            taskGrade: {
                                include: {
                                    fieldScores: {
                                        include: {
                                            rubricField: true,
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

    if (!week || week.groupId !== student.groupId) {
        return null;
    }

    const now = new Date();
    const status = computeWeekStatus(week.startDate, week.endDate, now);
    const isHistorical = status === "ended";

    const resource = week.resourceSubmissions[0]
        ? {
              id: week.resourceSubmissions[0].id,
              fileUrl: week.resourceSubmissions[0].fileUrl,
              status: week.resourceSubmissions[0].status as WeekResourceStatusCode,
              submittedAt: week.resourceSubmissions[0].submittedAt,
              lockedAt: week.resourceSubmissions[0].lockedAt,
          }
        : null;

    const isLocked = Boolean(resource?.lockedAt);
    const canWrite = status === "ongoing" && !isLocked;

    const tasks: StudentWeekDetailTask[] = week.tasks.map((task) => {
        const sub = task.submissions[0] ?? null;

        const hints = task.hints.map((hint) => {
            const isUnlocked = hint.hintUnlocks.length > 0;
            // Historical weeks reveal hints for free review; active/ongoing weeks require unlock
            const content = isUnlocked || isHistorical ? hint.content : null;

            return {
                id: hint.id,
                order: hint.order,
                cost: hint.cost,
                content,
                isUnlocked,
            };
        });

        const rubricFields = task.rubricFields.map((rf) => ({
            id: rf.id,
            fieldName: rf.fieldName,
            maxPoints: rf.maxPoints,
            order: rf.order,
        }));

        const grade =
            sub && sub.taskGrade && sub.taskGrade.finalizedAt
                ? {
                      totalPoints: sub.taskGrade.totalPoints,
                      markedInvalid: sub.taskGrade.markedInvalid,
                      finalizedAt: sub.taskGrade.finalizedAt,
                      instructorComment: sub.instructorComment,
                      fieldScores: sub.taskGrade.fieldScores.map((fs) => ({
                          rubricFieldId: fs.rubricFieldId,
                          fieldName: fs.rubricField.fieldName,
                          awardedPoints: fs.awardedPoints,
                          maxPoints: fs.rubricField.maxPoints,
                      })),
                  }
                : null;

        const submission = sub
            ? {
                  id: sub.id,
                  mode: sub.mode as SubmissionModeCode,
                  fileUrl: sub.fileUrl,
                  externalLink: sub.externalLink,
                  textContent: sub.textContent,
                  status: sub.status as SubmissionStatusCode,
                  submittedAt: sub.submittedAt,
                  isLocked: sub.isLocked,
                  grade,
              }
            : null;

        return {
            id: task.id,
            title: task.title,
            description: task.description,
            type: task.type as TaskTypeCode,
            deadline: task.deadline,
            isBonus: task.isBonus,
            allowedSubmissionMode: task.allowedSubmissionMode as SubmissionModeCode | null,
            rubricFields,
            hints,
            submission,
        };
    });

    return {
        id: week.id,
        groupId: week.groupId,
        groupName: student.group.name,
        batchName: student.group.batch.name,
        name: week.name,
        startDate: week.startDate,
        endDate: week.endDate,
        playlistUrl: week.playlistUrl,
        requiredFileLabel: week.requiredFileLabel,
        status,
        isLocked,
        canWrite,
        beginnerSt: student.beginnerSt ?? 0,
        resource,
        tasks,
    };
}
