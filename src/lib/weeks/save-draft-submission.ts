// src/lib/weeks/save-draft-submission.ts
//
// BEGINNER track: a Student "saves" work on a Task inside a Week. This
// creates or overwrites that Student's DRAFT Submission for the Task - as
// many times as they like while the Week is running.
//
// Same one-row-per-(studentId, taskId) rule as INTERMEDIATE
// (create-submission.ts): a re-save is an UPDATE on the same row, old
// content is overwritten, no history. The difference is `status`, which
// is DRAFT here instead of the default SUBMITTED.
//
// Blocking rules (checked in order):
//   1. Task must exist, belong to a Week (BEGINNER Task), and be INTERNAL
//      (EXTERNAL Tasks have no submissions - the Instructor grades them
//      by looking at the student's work on the external platform).
//   2. The Week must be running and not manually locked by this Student
//      (see week-student-guard.ts).
//   3. If a Submission already exists it must still be DRAFT (a
//      SUBMITTED one is final) and must not be graded (isLocked).
//   4. mode must match Task.allowedSubmissionMode, if restricted.
//   5. Exactly the content column matching `mode` must be provided.
//
// Task.deadline is always Week.endDate in this track, so the time check
// in the guard already covers the deadline.
//
// Instructor "new activity" tracking: the same upsert bumps
// Submission.activityVersion when (and only when) the saved answer
// meaningfully changed - see src/lib/submissions/task-activity.ts. Locking
// the Week / lazy auto-submit change `status` only and are NOT activity.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
    DraftSubmissionResult,
    SaveDraftSubmissionInput,
} from "@/types/types";
import { assertStudentCanWriteInWeek } from "@/lib/weeks/week-student-guard";
import {
    buildActivityWrite,
    hasSubmissionSolutionChanged,
} from "@/lib/submissions/task-activity";
import { lockRowsForUpdate } from "@/lib/submissions/first-solver";
import {
    cleanupUnusedSubmissionFile,
    withSubmissionMutationLock,
} from "@/lib/submissions/upload-file";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const defaultPrisma = new PrismaClient({ adapter });

export async function saveDraftSubmission(
    input: SaveDraftSubmissionInput,
    options?: {
        prisma?: PrismaClient;
        now?: () => Date;
        deleteFile?: (path: string) => Promise<void>;
    }
): Promise<DraftSubmissionResult> {
    const prisma = options?.prisma ?? defaultPrisma;
    const getNow = options?.now ?? (() => new Date());

    const task = await prisma.task.findUnique({
        where: { id: input.taskId },
        select: {
            id: true,
            type: true,
            weekId: true,
            allowedSubmissionMode: true,
        },
    });

    if (!task) {
        throw new Error("Task not found.");
    }

    if (!task.weekId) {
        throw new Error("This Task does not belong to a Week.");
    }

    if (task.type !== "INTERNAL") {
        throw new Error(
            "This Task is EXTERNAL and does not accept submissions."
        );
    }

    if (
        task.allowedSubmissionMode &&
        task.allowedSubmissionMode !== input.mode
    ) {
        throw new Error(
            `This Task only accepts submissions of type ${task.allowedSubmissionMode}.`
        );
    }

    validateContentForMode(input);

    // Content columns not relevant to the chosen mode are explicitly reset
    // to null, so switching mode on a re-save never leaves stale data.
    const contentData = {
        fileUrl: input.mode === "FILE" ? input.fileUrl ?? null : null,
        externalLink: input.mode === "LINK" ? input.externalLink ?? null : null,
        textContent: input.mode === "TEXT" ? input.textContent ?? null : null,
    };

    return withSubmissionMutationLock(input.taskId, input.studentId, async () => {
        const txResult = await prisma.$transaction(async (tx) => {
            // Consistent lock order across all First Solver workflows:
            // Task first, then Student.
            await lockRowsForUpdate(tx, "tasks", [input.taskId]);
            await lockRowsForUpdate(tx, "students", [input.studentId]);

            const txTask = await tx.task.findUnique({
                where: { id: input.taskId },
                select: {
                    id: true,
                    type: true,
                    weekId: true,
                    allowedSubmissionMode: true,
                },
            });

            if (!txTask) {
                throw new Error("Task not found.");
            }

            if (!txTask.weekId) {
                throw new Error("This Task does not belong to a Week.");
            }

            if (txTask.type !== "INTERNAL") {
                throw new Error(
                    "This Task is EXTERNAL and does not accept submissions."
                );
            }

            if (
                txTask.allowedSubmissionMode &&
                txTask.allowedSubmissionMode !== input.mode
            ) {
                throw new Error(
                    `This Task only accepts submissions of type ${txTask.allowedSubmissionMode}.`
                );
            }

            const now = getNow();
            await assertStudentCanWriteInWeek(tx, {
                studentId: input.studentId,
                weekId: txTask.weekId,
                now,
            });

            const existing = await tx.submission.findUnique({
                where: {
                    studentId_taskId: {
                        studentId: input.studentId,
                        taskId: input.taskId,
                    },
                },
                select: {
                    id: true,
                    studentId: true,
                    taskId: true,
                    status: true,
                    isLocked: true,
                    mode: true,
                    fileUrl: true,
                    externalLink: true,
                    textContent: true,
                    submittedAt: true,
                    lastSavedAt: true,
                },
            });

            if (existing && (existing.status !== "DRAFT" || existing.isLocked)) {
                throw new Error(
                    "This submission has already been sent and can no longer be changed."
                );
            }

            const nextSnapshot = {
                mode: input.mode,
                ...contentData,
            };

            // No-op re-save: skip the DB write entirely so lastSavedAt,
            // submittedAt (@updatedAt), and activityVersion stay untouched.
            if (existing && !hasSubmissionSolutionChanged(existing, nextSnapshot)) {
                return {
                    submission: existing as unknown as DraftSubmissionResult,
                    previousFileUrl: existing.fileUrl,
                    didChange: false,
                };
            }

            // Bump the activity counter and update server-generated lastSavedAt
            // only when the persisted student solution actually changed.
            const activity = buildActivityWrite(existing, nextSnapshot);

            const submission = await tx.submission.upsert({
                where: {
                    studentId_taskId: {
                        studentId: input.studentId,
                        taskId: input.taskId,
                    },
                },
                create: {
                    studentId: input.studentId,
                    taskId: input.taskId,
                    mode: input.mode,
                    status: "DRAFT",
                    lastSavedAt: now,
                    ...contentData,
                    ...activity.create,
                },
                update: {
                    mode: input.mode,
                    lastSavedAt: now,
                    ...contentData,
                    ...activity.update,
                    // submittedAt auto-refreshes via @updatedAt in the schema
                },
            });

            return {
                submission: submission as unknown as DraftSubmissionResult,
                previousFileUrl: existing?.fileUrl ?? null,
                didChange: true,
            };
        });

        if (
            txResult.didChange &&
            txResult.previousFileUrl &&
            txResult.previousFileUrl !== txResult.submission.fileUrl
        ) {
            await cleanupUnusedSubmissionFile({
                prisma,
                oldFileUrl: txResult.previousFileUrl,
                newFileUrl: txResult.submission.fileUrl,
                taskId: input.taskId,
                studentId: input.studentId,
                deleteFile: options?.deleteFile,
            });
        }

        return txResult.submission;
    });
}

function validateContentForMode(input: SaveDraftSubmissionInput) {
    switch (input.mode) {
        case "FILE":
            if (!input.fileUrl?.trim()) {
                throw new Error("A file must be uploaded for a FILE submission.");
            }
            break;
        case "LINK":
            if (!input.externalLink?.trim()) {
                throw new Error("A link is required for a LINK submission.");
            }
            break;
        case "TEXT":
            if (!input.textContent?.trim()) {
                throw new Error("Text content is required for a TEXT submission.");
            }
            break;
        default:
            throw new Error("Invalid submission mode.");
    }
}