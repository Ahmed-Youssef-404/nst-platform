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
import { lockRowsForUpdate } from "@/lib/submissions/first-solver";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const defaultPrisma = new PrismaClient({ adapter });

export async function lockWeek(
    input: LockWeekInput,
    options?: {
        prisma?: PrismaClient;
        now?: () => Date;
    }
): Promise<LockWeekResult> {
    const prisma = options?.prisma ?? defaultPrisma;
    const getNow = options?.now ?? (() => new Date());

    // allowLocked: true so we can return a clear "already locked" message
    // below instead of the guard's generic one.
    const ctx = await assertStudentCanWriteInWeek(prisma, {
        studentId: input.studentId,
        weekId: input.weekId,
        allowLocked: true,
        now: getNow(),
    });

    if (ctx.lockedAt) {
        throw new Error("You have already locked this Week.");
    }

    if (!ctx.hasResource) {
        throw new Error(
            "You must upload a deliverable file or submit a Google Drive link before locking this Week."
        );
    }

    const preInternalTasks = await prisma.task.findMany({
        where: { weekId: input.weekId, type: "INTERNAL" },
        select: { id: true },
        orderBy: { id: "asc" },
    });

    return prisma.$transaction(async (tx) => {
        // Consistent lock order across all First Solver workflows:
        // Task(s) first (sorted by id), then Student.
        await lockRowsForUpdate(
            tx,
            "tasks",
            preInternalTasks.map((t) => t.id)
        );
        await lockRowsForUpdate(tx, "students", [input.studentId]);

        const lockedAt = getNow();
        const txCtx = await assertStudentCanWriteInWeek(tx, {
            studentId: input.studentId,
            weekId: input.weekId,
            allowLocked: true,
            now: lockedAt,
        });

        if (txCtx.lockedAt) {
            throw new Error("You have already locked this Week.");
        }

        if (!txCtx.hasResource) {
            throw new Error(
                "You must upload a deliverable file or submit a Google Drive link before locking this Week."
            );
        }

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

        // Condition 2: Every internal task in this week must be solved/submitted
        const internalTasks = await tx.task.findMany({
            where: { weekId: input.weekId, type: "INTERNAL" },
            select: { id: true, title: true },
        });
        const internalTaskIds = internalTasks.map((t) => t.id);

        const existingSubmissions = await tx.submission.findMany({
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

        const unsolvedTasks = internalTasks.filter(
            (t) => !validSubmissionTaskIds.has(t.id)
        );
        if (unsolvedTasks.length > 0) {
            throw new Error(
                `All tasks must be completed before locking this Week. Missing ${unsolvedTasks.length} task(s).`
            );
        }

        const drafts = existingSubmissions.filter((s) => s.status === "DRAFT");

        if (drafts.length > 0) {
            // Note: lastSavedAt is intentionally untouched here; locking never
            // counts as a student solution save.
            await tx.submission.updateMany({
                where: { id: { in: drafts.map((d) => d.id) } },
                data: { status: "SUBMITTED" },
            });
        }

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