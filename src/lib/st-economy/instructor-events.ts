// src/lib/st-economy/instructor-events.ts
//
// All ST events that an Instructor triggers directly through a UI action,
// at any time (not gated by a deadline). Each function here:
//   1. Writes/updates the underlying record (Attendance, Submission grading)
//   2. Calls applySTChange for the resulting ST reward/penalty
// Both happen so the DB write and the ST transaction are consistent - if
// the ST part fails, we don't want an Attendance row with no matching
// reward, so the whole thing runs in one Prisma transaction where practical.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applySTChange, applySTChangeOnce } from "./create-transaction";
import {
    RecordAttendanceInput,
    GradeSubmissionInput,
    RecordSessionEngagementInput,
} from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ------------------------------------------------------------------
// Attendance: +10 if PRESENT, -20 if ABSENT. One record per
// (studentId, sessionId) - enforced by the existing unique constraint.
// If the instructor is correcting a previously recorded attendance
// (e.g. PRESENT -> ABSENT), we do NOT double-apply; we reverse the old
// ST effect and apply the new one, atomically.
// ------------------------------------------------------------------
export async function recordAttendance(input: RecordAttendanceInput) {
    const session = await prisma.session.findUniqueOrThrow({
        where: { id: input.sessionId },
        select: { levelId: true },
    });

    const existing = await prisma.attendance.findUnique({
        where: {
            studentId_sessionId: {
                studentId: input.studentId,
                sessionId: input.sessionId,
            },
        },
    });

    // No status change - nothing to do (avoids duplicate ST transactions
    // if the instructor re-submits the same attendance form).
    if (existing && existing.status === input.status) {
        return existing;
    }

    const attendance = await prisma.attendance.upsert({
        where: {
            studentId_sessionId: {
                studentId: input.studentId,
                sessionId: input.sessionId,
            },
        },
        create: {
            studentId: input.studentId,
            sessionId: input.sessionId,
            status: input.status,
            recordedBy: input.recordedBy,
        },
        update: {
            status: input.status,
            recordedBy: input.recordedBy,
        },
    });

    // If we're correcting a prior record, reverse its ST effect, then apply
    // the new one. Note: applySTChange itself is atomic per call, but these
    // two calls are not wrapped in one shared transaction (Prisma doesn't
    // let us nest an interactive transaction from a helper that opens its
    // own). In practice this is safe: an instructor correcting attendance
    // is a rare, single-actor, low-frequency action, and a crash between
    // the two calls just leaves a temporarily-inconsistent balance that a
    // MANUAL_ADJUSTMENT can fix - it can never double-count or lose the
    // record entirely, since both calls are individually atomic and the
    // Attendance row (source of truth for status) is already committed.
    if (existing) {
        await applySTChange({
            studentId: input.studentId,
            track: "INTERMEDIATE",
            levelId: session.levelId,
            type: existing.status === "PRESENT" ? "PENALTY" : "REWARD",
            reason: existing.status === "PRESENT" ? "ATTENDANCE" : "MISSED_SESSION",
            amount: existing.status === "PRESENT" ? 10 : 20,
            relatedEntityId: input.sessionId,
        });
    }

    await applySTChange({
        studentId: input.studentId,
        track: "INTERMEDIATE",
        levelId: session.levelId,
        type: input.status === "PRESENT" ? "REWARD" : "PENALTY",
        reason: input.status === "PRESENT" ? "ATTENDANCE" : "MISSED_SESSION",
        amount: input.status === "PRESENT" ? 10 : 20,
        relatedEntityId: input.sessionId,
    });

    return attendance;
}

// ------------------------------------------------------------------
// Session engagement: manual instructor rating, +5, once per session
// per student. Deduplicated via applySTChangeOnce keyed on sessionId.
// ------------------------------------------------------------------
export async function recordSessionEngagement(
    input: RecordSessionEngagementInput
) {
    const session = await prisma.session.findUniqueOrThrow({
        where: { id: input.sessionId },
        select: { levelId: true },
    });

    const result = await applySTChangeOnce({
        studentId: input.studentId,
        track: "INTERMEDIATE",
        levelId: session.levelId,
        type: "REWARD",
        reason: "SESSION_ENGAGEMENT",
        amount: 5,
        relatedEntityId: input.sessionId,
    });

    if (!result) {
        throw new Error(
            "Session engagement was already recorded for this student and session."
        );
    }

    return result;
}

// ------------------------------------------------------------------
// Rubric grading: 0-10 total (Understanding 0-2, Approach 0-3,
// Correctness 0-3, Implementation 0-2). Also handles bonus task (+10)
// and first solver (+5) since both are decided at grading time.
// Grading a Submission also locks it (isLocked = true), matching the
// existing resubmission rule.
// ------------------------------------------------------------------
export async function gradeSubmission(input: GradeSubmissionInput) {
    const submission = await prisma.submission.findUniqueOrThrow({
        where: { id: input.submissionId },
        include: {
            task: {
                select: {
                    id: true,
                    isBonus: true,
                    session: { select: { levelId: true } },
                    rubricFields: { select: { id: true, maxPoints: true } },
                },
            },
        },
    });

    if (submission.gradedAt) {
        throw new Error(
            "This submission was already graded. Use a correction flow instead of re-grading."
        );
    }

    // Guard explicitly since Task.session is optional at the schema level.
    if (!submission.task.session) {
        throw new Error(
            "gradeSubmission is for INTERMEDIATE tasks only. This task has no Session (likely a BEGINNER-track task) - use the Week grading flow instead."
        );
    }

    const levelId = submission.task.session.levelId;
    const now = new Date();
    const markedInvalid = input.markedInvalid ?? false;

    let scoreSum = 0;
    const isDynamicRubric = input.fieldScores !== undefined && input.fieldScores.length > 0;

    if (isDynamicRubric) {
        if (!markedInvalid) {
            const fieldsById = new Map(submission.task.rubricFields.map((f) => [f.id, f.maxPoints]));
            for (const s of input.fieldScores!) {
                const max = fieldsById.get(s.rubricFieldId);
                if (max === undefined) {
                    throw new Error(`Rubric field ${s.rubricFieldId} does not belong to this Task.`);
                }
                if (!Number.isInteger(s.awardedPoints) || s.awardedPoints < 0 || s.awardedPoints > max) {
                    throw new Error(`Awarded points for rubric field must be between 0 and ${max}.`);
                }
                scoreSum += s.awardedPoints;
            }
        }
    } else {
        // Fallback to legacy fixed 4-fields if provided
        const under = input.understandingScore ?? 0;
        const app = input.approachScore ?? 0;
        const corr = input.correctnessScore ?? 0;
        const impl = input.implementationScore ?? 0;
        scoreSum = under + app + corr + impl;
    }

    if (scoreSum < 0 || scoreSum > 15) {
        throw new Error("Rubric total must be between 0 and 15.");
    }

    const updatedSubmission = await prisma.$transaction(async (tx) => {
        const sub = await tx.submission.update({
            where: { id: input.submissionId },
            data: {
                understandingScore: input.understandingScore ?? null,
                approachScore: input.approachScore ?? null,
                correctnessScore: input.correctnessScore ?? null,
                implementationScore: input.implementationScore ?? null,
                instructorComment: input.instructorComment ? input.instructorComment.trim() : null,
                gradedAt: now,
                gradedBy: input.gradedBy,
                isLocked: true,
            },
        });

        // Upsert TaskGrade & TaskGradeField for dynamic rubric breakdown
        const grade = await tx.taskGrade.upsert({
            where: { submissionId: input.submissionId },
            create: {
                submissionId: input.submissionId,
                gradedBy: input.gradedBy,
                totalPoints: scoreSum,
                finalizedAt: now,
                markedInvalid,
            },
            update: {
                gradedBy: input.gradedBy,
                totalPoints: scoreSum,
                finalizedAt: now,
                markedInvalid,
            },
        });

        await tx.taskGradeField.deleteMany({
            where: { taskGradeId: grade.id },
        });

        if (!markedInvalid && input.fieldScores && input.fieldScores.length > 0) {
            await tx.taskGradeField.createMany({
                data: input.fieldScores.map((score) => ({
                    taskGradeId: grade.id,
                    rubricFieldId: score.rubricFieldId,
                    awardedPoints: score.awardedPoints,
                })),
            });
        }

        return sub;
    });

    // Rubric reward (0-15).
    if (scoreSum > 0 && !markedInvalid) {
        await applySTChangeOnce({
            studentId: submission.studentId,
            track: "INTERMEDIATE",
            levelId,
            type: "REWARD",
            reason: "RUBRIC_GRADING",
            amount: scoreSum,
            relatedEntityId: input.submissionId,
        });
    }

    // Bonus task solved: +10, only if this task isBonus and not marked invalid and scoreSum > 0
    if (submission.task.isBonus && !markedInvalid && scoreSum > 0) {
        await applySTChangeOnce({
            studentId: submission.studentId,
            track: "INTERMEDIATE",
            levelId,
            type: "REWARD",
            reason: "BONUS_TASK_SOLVED",
            amount: 10,
            relatedEntityId: submission.task.id,
        });
    }

    // First solver: instructor explicitly flags this at grading time
    if (input.isFirstSolver && !markedInvalid && scoreSum > 0) {
        await applySTChangeOnce({
            studentId: submission.studentId,
            track: "INTERMEDIATE",
            levelId,
            type: "REWARD",
            reason: "FIRST_SOLVER",
            amount: 5,
            relatedEntityId: submission.task.id,
        });
    }

    return updatedSubmission;
}