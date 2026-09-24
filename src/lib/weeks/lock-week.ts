// src/lib/weeks/lock-week.ts
//
// BEGINNER track: the Student manually locks the WHOLE Week (not a single
// Task) - "I'm done, send everything".
//
// Requirements (agreed with the owner):
//   - The Week's required file must already be uploaded. No file = no
//     manual lock (the Student can still wait for the automatic path at
//     endDate, handled lazily by the grading flow).
//   - Every INTERNAL Task in the Week that has a DRAFT is sent
//     (DRAFT -> SUBMITTED). An INTERNAL Task with no DRAFT counts as
//     not submitted and will get no grade. Nothing is editable afterwards.
//   - EXTERNAL Tasks have no submissions; they are ignored here (the
//     Instructor still grades them in the grading screen).
//
// The lock is stored as WeekResourceSubmission.lockedAt. The DRAFT ->
// SUBMITTED conversion and the lockedAt write happen in ONE transaction:
// either everything is sent and the Week is locked, or nothing changes.
//
// Locking only happens while the Week is running. Once endDate passes,
// the automatic path takes over (lazy conversion in the grading flow), so
// a late manual lock is rejected by the shared guard.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { LockWeekInput, LockWeekResult } from "@/types/types";
import { assertStudentCanWriteInWeek } from "@/lib/weeks/week-student-guard";

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
            "You must upload the required file before you can lock this Week."
        );
    }

    const internalTasks = await prisma.task.findMany({
        where: { weekId: input.weekId, type: "INTERNAL" },
        select: { id: true },
    });
    const internalTaskIds = internalTasks.map((t) => t.id);

    return prisma.$transaction(async (tx) => {
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

        const submittedTaskIds = drafts.map((d) => d.taskId);
        const submittedSet = new Set(submittedTaskIds);
        const skippedTaskIds = internalTaskIds.filter(
            (id) => !submittedSet.has(id)
        );

        return {
            weekId: input.weekId,
            lockedAt,
            submittedTaskIds,
            skippedTaskIds,
        };
    });
}