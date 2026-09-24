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

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
    DraftSubmissionResult,
    SaveDraftSubmissionInput,
} from "@/types/types";
import { assertStudentCanWriteInWeek } from "@/lib/weeks/week-student-guard";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function saveDraftSubmission(
    input: SaveDraftSubmissionInput
): Promise<DraftSubmissionResult> {
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

    await assertStudentCanWriteInWeek(prisma, {
        studentId: input.studentId,
        weekId: task.weekId,
    });

    if (
        task.allowedSubmissionMode &&
        task.allowedSubmissionMode !== input.mode
    ) {
        throw new Error(
            `This Task only accepts submissions of type ${task.allowedSubmissionMode}.`
        );
    }

    validateContentForMode(input);

    const existing = await prisma.submission.findUnique({
        where: {
            studentId_taskId: {
                studentId: input.studentId,
                taskId: input.taskId,
            },
        },
        select: { status: true, isLocked: true },
    });

    if (existing && (existing.status !== "DRAFT" || existing.isLocked)) {
        throw new Error(
            "This submission has already been sent and can no longer be changed."
        );
    }

    // Content columns not relevant to the chosen mode are explicitly reset
    // to null, so switching mode on a re-save never leaves stale data.
    const contentData = {
        fileUrl: input.mode === "FILE" ? input.fileUrl ?? null : null,
        externalLink: input.mode === "LINK" ? input.externalLink ?? null : null,
        textContent: input.mode === "TEXT" ? input.textContent ?? null : null,
    };

    const submission = await prisma.submission.upsert({
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
            ...contentData,
        },
        update: {
            mode: input.mode,
            ...contentData,
            // submittedAt auto-refreshes via @updatedAt in the schema
        },
    });

    return submission as unknown as DraftSubmissionResult;
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