// src/lib/submissions/review-task-activity.ts
//
// Registers that an Instructor has seen a student's activity on a task.
//
// Review state is SHARED: it lives on one SubmissionActivityReview row per
// Submission, so every Instructor assigned to the Student's Group sees the
// same state. Student -> Group is 1:1, so there is nothing that can leak
// across unrelated Groups.
//
// The caller passes the activityVersion it was DISPLAYING. We only ever
// raise reviewedVersion to that value (clamped to the current
// activityVersion), so activity that happened after the Instructor opened
// the task keeps a higher activityVersion and stays unreviewed.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface ReviewTaskActivityInput {
    instructorId: string;
    submissionId: string;
    seenVersion: number;
}

export async function reviewTaskActivity(
    input: ReviewTaskActivityInput
): Promise<{ reviewed: boolean; reviewedVersion: number }> {
    if (!Number.isInteger(input.seenVersion) || input.seenVersion < 1) {
        throw new Error("Invalid activity version.");
    }

    const submission = await prisma.submission.findUnique({
        where: { id: input.submissionId },
        select: {
            id: true,
            activityVersion: true,
            student: { select: { groupId: true } },
            task: {
                select: {
                    week: { select: { groupId: true } },
                    session: { select: { level: { select: { groupId: true } } } },
                },
            },
        },
    });

    if (!submission) {
        throw new Error("Submission not found.");
    }

    // The Group that owns the task (BEGINNER: via Week, INTERMEDIATE: via
    // Session -> Level). Never trust a client-supplied group/student id:
    // everything is derived from the submission row itself.
    const taskGroupId =
        submission.task.week?.groupId ??
        submission.task.session?.level.groupId ??
        null;

    if (!taskGroupId || taskGroupId !== submission.student.groupId) {
        throw new Error("This submission does not belong to a gradable Group.");
    }

    const assignment = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId: input.instructorId,
                groupId: taskGroupId,
            },
        },
    });

    if (!assignment) {
        throw new Error("You are not assigned to this Student's Group.");
    }

    // Never acknowledge a version that doesn't exist yet.
    const ackVersion = Math.min(input.seenVersion, submission.activityVersion);
    if (ackVersion < 1) {
        return { reviewed: false, reviewedVersion: 0 };
    }

    // Two atomic statements -> final value = max(existing, ackVersion),
    // never lower, safe under concurrent instructors:
    //   1. create the row if it doesn't exist (ON CONFLICT DO NOTHING)
    //   2. raise it only if it is currently lower
    await prisma.submissionActivityReview.createMany({
        data: [
            {
                submissionId: submission.id,
                reviewedVersion: ackVersion,
                reviewedBy: input.instructorId,
            },
        ],
        skipDuplicates: true,
    });

    await prisma.submissionActivityReview.updateMany({
        where: {
            submissionId: submission.id,
            reviewedVersion: { lt: ackVersion },
        },
        data: {
            reviewedVersion: ackVersion,
            reviewedBy: input.instructorId,
        },
    });

    return { reviewed: true, reviewedVersion: ackVersion };
}