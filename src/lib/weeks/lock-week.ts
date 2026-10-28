// src/lib/weeks/lock-week.ts
//
// BEGINNER track: the Student manually locks the WHOLE Week (not a single Task).
//
// Strict requirements (enforced both in UI and authoritatively on server):
//   Condition 1: A valid weekly resource exists through exactly one method
//                (an uploaded file OR a valid Google Drive URL).
//   Condition 2: Every required internal task in that week has been solved/submitted
//                with valid content. No task may be skipped.
//
// The lock is stored as WeekResourceSubmission.lockedAt.
// All DRAFT submissions are converted to SUBMITTED and the lockedAt write
// happens in ONE atomic transaction.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { LockWeekInput, LockWeekResult } from "@/types/types";
import { assertStudentCanWriteInWeek } from "@/lib/weeks/week-student-guard";
import {
    hasValidResourceSubmission,
    hasValidTaskSubmissionContent,
} from "@/lib/weeks/resource-eligibility";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function lockWeek(input: LockWeekInput): Promise<LockWeekResult> {
    // allowLocked: true so we can return a clear "already locked" message
    // below instead of the guard's generic one.
    const ctx = await assertStudentCanWriteInWeek(prisma, {
        studentId: input.studentId,
        weekId: input.weekId,
        allowLocked: true,
    });

    if (ctx.lockedAt) {
        throw new Error("You have already locked this Week.");
    }

    if (!ctx.hasResource) {
        throw new Error(
            "You must upload a deliverable file or submit a Google Drive link before locking this Week."
        );
    }

    // Condition 2: Every internal task in this week must be solved/submitted
    const internalTasks = await prisma.task.findMany({
        where: { weekId: input.weekId, type: "INTERNAL" },
        select: { id: true, title: true },
    });
    const internalTaskIds = internalTasks.map((t) => t.id);

    const existingSubmissions = await prisma.submission.findMany({
        where: {
            studentId: input.studentId,
            taskId: { in: internalTaskIds },
        },
        select: {
            id: true,
            taskId: true,
            status: true,
            mode: true,
            fileUrl: true,
            externalLink: true,
            textContent: true,
        },
    });

    const validSubmissionTaskIds = new Set(
        existingSubmissions
            .filter((s) => hasValidTaskSubmissionContent(s))
            .map((s) => s.taskId)
    );

    const unsolvedTasks = internalTasks.filter((t) => !validSubmissionTaskIds.has(t.id));
    if (unsolvedTasks.length > 0) {
        throw new Error(
            `All tasks must be completed before locking this Week. Missing ${unsolvedTasks.length} task(s).`
        );
    }

    return prisma.$transaction(async (tx) => {
        // Re-check current resource inside transaction to prevent race conditions
        const currentResource = await tx.weekResourceSubmission.findUnique({
            where: {
                studentId_weekId: {
                    studentId: input.studentId,
                    weekId: input.weekId,
                },
            },
            select: {
                type: true,
                fileUrl: true,
                driveUrl: true,
                status: true,
                lockedAt: true,
            },
        });

        if (currentResource?.lockedAt) {
            throw new Error("You have already locked this Week.");
        }

        if (!hasValidResourceSubmission(currentResource)) {
            throw new Error(
                "You must upload a deliverable file or submit a Google Drive link before locking this Week."
            );
        }

        const drafts = await tx.submission.findMany({
            where: {
                studentId: input.studentId,
                taskId: { in: internalTaskIds },
                status: "DRAFT",
            },
            select: { id: true, taskId: true },
        });

        if (drafts.length > 0) {
            await tx.submission.updateMany({
                where: { id: { in: drafts.map((d) => d.id) } },
                data: { status: "SUBMITTED" },
            });
        }

        const lockedAt = new Date();

        await tx.weekResourceSubmission.update({
            where: {
                studentId_weekId: {
                    studentId: input.studentId,
                    weekId: input.weekId,
                },
            },
            data: { lockedAt },
        });

        return {
            weekId: input.weekId,
            lockedAt,
            submittedTaskIds: internalTaskIds,
            skippedTaskIds: [],
        };
    });
}