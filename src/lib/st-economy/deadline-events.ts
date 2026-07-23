// src/lib/st-economy/deadline-events.ts
//
// These three rewards/penalties are "deadline-triggered": they only become
// knowable once a Task's deadline has passed. Since Vercel's free tier has
// no reliable cron, we don't run these on a schedule - instead they are
// evaluated LAZILY: any time we already have reason to load a student's
// data (opening their dashboard, an instructor viewing a student profile,
// etc.), we first call reconcileDeadlineEvents() for that student, which
// checks "is there anything with a passed deadline that hasn't been
// ST-scored yet?" and scores it right then. See reconcile.ts for the
// single entry point that wires this together.
//
// Every write here goes through applySTChangeOnce, keyed by
// (studentId, reason, relatedEntityId=taskId), so re-running this check
// forever is always safe and idempotent - already-scored tasks are skipped
// via one query and never re-processed.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applySTChangeOnce } from "./create-transaction";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Finds tasks whose deadline has passed, belonging to Sessions in Levels
// the student is (or was) in, that haven't been ST-scored yet for this
// student, and scores them:
//   - Submission exists (any mode) before/at deadline -> +5 SUBMIT_BEFORE_DEADLINE
//   - No submission at all -> -10 TASK_NOT_SUBMITTED
// Bonus tasks are excluded from both (bonus tasks are only rewarded via
// BONUS_TASK_SOLVED at grading time, never penalized for non-submission).
export async function reconcileTaskDeadlines(studentId: string) {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: { groupId: true },
    });

    const now = new Date();

    // Only tasks belonging to Levels of the student's current Group, with
    // a passed deadline, non-bonus.
    const candidateTasks = await prisma.task.findMany({
        where: {
            isBonus: false,
            deadline: { lt: now },
            session: { level: { groupId: student.groupId } },
        },
        select: {
            id: true,
            deadline: true,
            session: { select: { levelId: true } },
            submissions: {
                where: { studentId },
                select: { id: true, submittedAt: true },
            },
        },
    });

    if (candidateTasks.length === 0) return { scored: 0 };

    // Skip tasks already scored (either reason) for this student in one query.
    const alreadyScored = await prisma.sTTransaction.findMany({
        where: {
            studentId,
            reason: { in: ["SUBMIT_BEFORE_DEADLINE", "TASK_NOT_SUBMITTED"] },
            relatedEntityId: { in: candidateTasks.map((t) => t.id) },
        },
        select: { relatedEntityId: true },
    });
    const scoredTaskIds = new Set(alreadyScored.map((t) => t.relatedEntityId));

    let scored = 0;

    for (const task of candidateTasks) {
        if (scoredTaskIds.has(task.id)) continue;

        const hasOnTimeSubmission = task.submissions.length > 0; // Submission
        // rows can't exist past-deadline unless created before it, since
        // resubmission/creation is blocked after the deadline elsewhere in
        // the app - so any existing row here is by definition on-time.

        const result = await applySTChangeOnce({
            studentId,
            levelId: task.session.levelId,
            type: hasOnTimeSubmission ? "REWARD" : "PENALTY",
            reason: hasOnTimeSubmission
                ? "SUBMIT_BEFORE_DEADLINE"
                : "TASK_NOT_SUBMITTED",
            amount: hasOnTimeSubmission ? 5 : 10,
            relatedEntityId: task.id,
        });

        if (result) scored++;
    }

    return { scored };
}

// "Finish all non-bonus tasks before deadline" (+10), scored per Session:
// once every non-bonus Task belonging to a Session has passed its deadline
// AND the student has an on-time Submission for every single one of them,
// award +10 once for that Session. Deduplicated on relatedEntityId=sessionId.
export async function reconcileFinishAllTasks(studentId: string) {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: { groupId: true },
    });

    const now = new Date();

    const sessions = await prisma.session.findMany({
        where: { level: { groupId: student.groupId } },
        select: {
            id: true,
            levelId: true,
            tasks: {
                where: { isBonus: false },
                select: {
                    id: true,
                    deadline: true,
                    submissions: { where: { studentId }, select: { id: true } },
                },
            },
        },
    });

    let scored = 0;

    for (const session of sessions) {
        if (session.tasks.length === 0) continue; // nothing to "finish"

        const allDeadlinesPassed = session.tasks.every((t) => t.deadline < now);
        if (!allDeadlinesPassed) continue;

        const allSubmitted = session.tasks.every((t) => t.submissions.length > 0);
        if (!allSubmitted) continue;

        const result = await applySTChangeOnce({
            studentId,
            levelId: session.levelId,
            type: "REWARD",
            reason: "FINISH_ALL_TASKS",
            amount: 10,
            relatedEntityId: session.id,
        });

        if (result) scored++;
    }

    return { scored };
}