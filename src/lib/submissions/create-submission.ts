// src/lib/submissions/create-submission.ts
//
// Creates or resubmits a Student's Submission for an INTERNAL Task.
// There is exactly one Submission row per (studentId, taskId) - a
// "resubmit" is an UPDATE on that same row (submittedAt auto-refreshes,
// old content is overwritten - no history is kept).
//
// This function is the single gatekeeper other parts of the app rely on:
// deadline-events.ts assumes "a Submission row exists" == "submitted on
// time", because creation/resubmission past the deadline is blocked HERE.
// If this invariant breaks, ST calculations silently become wrong - so
// every write path for Submission must go through this function.
//
// Blocking rules (checked in order):
//   1. Task must exist and be type = INTERNAL (EXTERNAL tasks have no
//      submissions at all).
//   2. Task's deadline must not have passed yet.
//   3. If a Submission already exists for this (student, task):
//      - it must not be isLocked (locked = deadline passed OR graded -
//        but if the deadline just passed, rule #2 already caught that,
//        so in practice a locked-but-not-yet-deadline-passed row here
//        means it was graded).
//   4. mode must match Task.allowedSubmissionMode, if the Instructor
//      restricted it (null = student's free choice).
//   5. Exactly one of fileUrl/externalLink/textContent must be provided,
//      matching `mode`, and non-empty.
//
// Instructor "new activity" tracking: the same upsert bumps
// Submission.activityVersion when (and only when) the persisted answer
// meaningfully changed - see task-activity.ts.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
    CreateOrUpdateSubmissionInput,
    SubmissionResult,
} from "@/types/types";
import {
    buildActivityWrite,
    hasSubmissionSolutionChanged,
} from "./task-activity";
import { lockRowsForUpdate } from "./first-solver";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const defaultPrisma = new PrismaClient({ adapter });

export async function createOrUpdateSubmission(
    input: CreateOrUpdateSubmissionInput,
    options?: {
        prisma?: PrismaClient;
        now?: () => Date;
    }
): Promise<SubmissionResult> {
    const prisma = options?.prisma ?? defaultPrisma;
    const getNow = options?.now ?? (() => new Date());

    const task = await prisma.task.findUnique({
        where: { id: input.taskId },
        select: {
            id: true,
            sessionId: true,
            type: true,
            deadline: true,
            allowedSubmissionMode: true,
        },
    });

    if (!task) {
        throw new Error("Task not found.");
    }

    if (task.sessionId) {
        const feedback = await prisma.sessionFeedback.findUnique({
            where: {
                sessionId_studentId: {
                    sessionId: task.sessionId,
                    studentId: input.studentId,
                },
            },
        });

        if (!feedback) {
            throw new Error(
                "You must rate this session before submitting tasks."
            );
        }
    }

    if (task.type !== "INTERNAL") {
        throw new Error(
            "This Task is EXTERNAL and does not accept submissions."
        );
    }

    if (task.allowedSubmissionMode && task.allowedSubmissionMode !== input.mode) {
        throw new Error(
            `This Task only accepts submissions of type ${task.allowedSubmissionMode}.`
        );
    }

    validateContentForMode(input);

    // Content columns not relevant to the chosen mode are explicitly reset
    // to null, so switching mode on a resubmit (e.g. LINK -> TEXT) never
    // leaves stale data in an unused column.
    const contentData = {
        fileUrl: input.mode === "FILE" ? input.fileUrl ?? null : null,
        externalLink: input.mode === "LINK" ? input.externalLink ?? null : null,
        textContent: input.mode === "TEXT" ? input.textContent ?? null : null,
    };

    return prisma.$transaction(async (tx) => {
        // Serialize concurrent submissions/resubmissions for this student.
        await lockRowsForUpdate(tx, "students", [input.studentId]);

        const now = getNow();
        if (task.deadline <= now) {
            throw new Error(
                "The deadline for this Task has passed. Submissions are no longer accepted."
            );
        }

        const existing = await tx.submission.findUnique({
            where: {
                studentId_taskId: {
                    studentId: input.studentId,
                    taskId: input.taskId,
                },
            },
        });

        if (existing && existing.isLocked) {
            throw new Error(
                "This submission has already been graded and can no longer be changed."
            );
        }

        const nextSnapshot = {
            mode: input.mode,
            ...contentData,
        };

        // No-op resubmit: skip the DB write entirely so lastSavedAt,
        // submittedAt (@updatedAt), and activityVersion stay untouched.
        if (existing && !hasSubmissionSolutionChanged(existing, nextSnapshot)) {
            return existing as unknown as SubmissionResult;
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

        return submission as unknown as SubmissionResult;
    });
}

function validateContentForMode(input: CreateOrUpdateSubmissionInput) {
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