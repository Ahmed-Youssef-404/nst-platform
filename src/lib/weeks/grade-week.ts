// src/lib/weeks/grade-week.ts
//
// BEGINNER track: Instructor-side grading for a Week's Tasks. Mirrors
// INTERMEDIATE's gradeSubmission (instructor-events.ts) conceptually, but
// uses the free-form TaskGrade/TaskGradeField draft/finalize model instead
// of gradeSubmission's fixed 4-column + immediate-ST approach.
//
// Three operations, meant to be used in this order by the grading UI:
//   1. saveDraftGrade   - award/edit rubric points (or mark invalid) for
//                         ONE submission. Pure draft, zero ST effect,
//                         freely re-editable, no timing rules.
//   2. suggestFirstSolvers - read-only. For every Task in a Week, finds
//                         the earliest manual-lock submitter. Never
//                         writes anything or applies any reward itself -
//                         the Instructor reviews this list and explicitly
//                         confirms via finalizeWeekGrading's
//                         firstSolverTaskIds.
//   3. finalizeWeekGrading - the atomic finish. For one student+Week:
//         - reads every Task in the Week and that student's TaskGrade
//           drafts (if any) + Submission status
//         - computes the score for each Task per the agreed formula
//         - sets finalizedAt + totalPoints on every TaskGrade in the batch
//         - creates every resulting STTransaction (one per component,
//           distinct `reason` each), applying the late-resource halving
//           to the summed positive components only
//       ALL of this happens in one Prisma transaction: either the whole
//       student+Week grading batch commits, or none of it does.
//
// Formula (identical for BEGINNER and INTERMEDIATE, BEGINNER-only here):
//   rubric total (sum of awarded TaskGradeField points, max 15)
//   + 5 if Task.isBonus
//   + 5 if this student is the confirmed first solver for the Task
//   + 10 once per Week if every Task in the Week has a submission
//   - 10 if a Task has no submission at all, OR the Instructor marked the
//     student's solution invalid/unsubmitted (no rubric points either way)
// The late-resource halving applies to the SUM of positive components
// (rubric+bonus+first-solver+finish-all) for the whole batch; the -10
// penalty per Task is never halved.

import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applySTChange } from "@/lib/st-economy/create-transaction";
import type {
    SaveDraftGradeInput,
    DraftGradeResult,
    FirstSolverSuggestionInput,
    FirstSolverSuggestion,
    FinalizeWeekGradingInput,
    FinalizeWeekGradingResult,
} from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const FINISH_ALL_BONUS = 10;
const BONUS_TASK_POINTS = 5;
const FIRST_SOLVER_POINTS = 5;
const NOT_SUBMITTED_PENALTY = 10;

async function assertInstructorAssignedToGroup(
    instructorId: string,
    groupId: string
): Promise<void> {
    const assignment = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: { instructorId, groupId },
        },
    });

    if (!assignment) {
        throw new Error("You are not assigned to this Group.");
    }
}

// Resolves a SaveDraftGradeInput to a concrete submissionId, creating the
// synthetic EXTERNAL-task Submission row on first use if the caller
// identified the target via (studentId, taskId) instead of an existing
// submissionId. Also loads exactly what saveDraftGrade needs from the
// resolved Submission's Task (groupId for auth, rubric fields for
// validation) plus its current TaskGrade (to block edits after finalize).
async function resolveSubmissionForGrading(
    input: SaveDraftGradeInput
): Promise<{
    submissionId: string;
    task: {
        weekId: string | null;
        week: { groupId: string } | null;
        rubricFields: { id: string; maxPoints: number }[];
    };
    taskGrade: { finalizedAt: Date | null } | null;
}> {
    if ("submissionId" in input) {
        const submission = await prisma.submission.findUnique({
            where: { id: input.submissionId },
            include: {
                task: {
                    select: {
                        weekId: true,
                        week: { select: { groupId: true } },
                        rubricFields: { select: { id: true, maxPoints: true } },
                    },
                },
                taskGrade: { select: { finalizedAt: true } },
            },
        });

        if (!submission || !submission.task.weekId || !submission.task.week) {
            throw new Error(
                "Submission not found or does not belong to a BEGINNER Task."
            );
        }

        return {
            submissionId: submission.id,
            task: submission.task,
            taskGrade: submission.taskGrade,
        };
    }

    // (studentId, taskId) path - EXTERNAL Task, no on-platform Submission
    // exists yet. Verify the Task really is EXTERNAL (INTERNAL Tasks must
    // go through the submissionId path - they have a real Submission the
    // student created) and synthesize one, reusing it on repeat calls via
    // the (studentId, taskId) unique constraint.
    const task = await prisma.task.findUnique({
        where: { id: input.taskId },
        select: {
            type: true,
            weekId: true,
            week: { select: { groupId: true } },
            rubricFields: { select: { id: true, maxPoints: true } },
        },
    });

    if (!task || !task.weekId || !task.week) {
        throw new Error("Task not found or does not belong to a BEGINNER Week.");
    }

    if (task.type !== "EXTERNAL") {
        throw new Error(
            "This Task is INTERNAL and already has a Submission - pass submissionId instead of studentId/taskId."
        );
    }

    const submission = await prisma.submission.upsert({
        where: {
            studentId_taskId: { studentId: input.studentId, taskId: input.taskId },
        },
        create: {
            studentId: input.studentId,
            taskId: input.taskId,
            mode: "EXTERNAL",
            status: "SUBMITTED",
        },
        update: {},
        include: { taskGrade: { select: { finalizedAt: true } } },
    });

    return {
        submissionId: submission.id,
        task: { weekId: task.weekId, week: task.week, rubricFields: task.rubricFields },
        taskGrade: submission.taskGrade,
    };
}

// ------------------------------------------------------------------
// 1. saveDraftGrade
// ------------------------------------------------------------------
export async function saveDraftGrade(
    input: SaveDraftGradeInput
): Promise<DraftGradeResult> {
    const resolved = await resolveSubmissionForGrading(input);
    const { submissionId, task, taskGrade } = resolved;

    await assertInstructorAssignedToGroup(input.gradedBy, task.week!.groupId);

    const studentSubmission = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: { studentId: true },
    });
    if (studentSubmission && task.weekId) {
        const finalizedTx = await prisma.sTTransaction.findFirst({
            where: { studentId: studentSubmission.studentId, weekId: task.weekId },
        });
        if (finalizedTx || taskGrade?.finalizedAt) {
            throw new Error(
                "This student's Week has already been finalized. Grading can no longer be changed here - use a manual correction instead."
            );
        }
    }

    if (!input.markedInvalid) {
        const fieldsById = new Map(
            task.rubricFields.map((f) => [f.id, f.maxPoints])
        );

        for (const score of input.fieldScores) {
            const maxPoints = fieldsById.get(score.rubricFieldId);
            if (maxPoints === undefined) {
                throw new Error(
                    `Rubric field ${score.rubricFieldId} does not belong to this Task.`
                );
            }
            if (
                !Number.isInteger(score.awardedPoints) ||
                score.awardedPoints < 0 ||
                score.awardedPoints > maxPoints
            ) {
                throw new Error(
                    `Awarded points for rubric field ${score.rubricFieldId} must be a whole number between 0 and ${maxPoints}.`
                );
            }
        }

        const providedIds = new Set(
            input.fieldScores.map((s) => s.rubricFieldId)
        );
        for (const field of task.rubricFields) {
            if (!providedIds.has(field.id)) {
                throw new Error(
                    `Missing a score for rubric field ${field.id}. All rubric fields must be scored (0 is allowed).`
                );
            }
        }
    }

    const taskGradeRow = await prisma.$transaction(async (tx) => {
        const grade = await tx.taskGrade.upsert({
            where: { submissionId },
            create: {
                submissionId,
                gradedBy: input.gradedBy,
                markedInvalid: input.markedInvalid,
            },
            update: {
                gradedBy: input.gradedBy,
                markedInvalid: input.markedInvalid,
            },
        });

        await tx.taskGradeField.deleteMany({
            where: { taskGradeId: grade.id },
        });

        if (!input.markedInvalid && input.fieldScores.length > 0) {
            await tx.taskGradeField.createMany({
                data: input.fieldScores.map((score) => ({
                    taskGradeId: grade.id,
                    rubricFieldId: score.rubricFieldId,
                    awardedPoints: score.awardedPoints,
                })),
            });
        }

        if (input.instructorComment !== undefined) {
            await tx.submission.update({
                where: { id: submissionId },
                data: {
                    instructorComment: input.instructorComment ? input.instructorComment.trim() : null,
                },
            });
        }

        return grade;
    });

    return {
        id: taskGradeRow.id,
        submissionId,
        gradedBy: input.gradedBy,
        finalizedAt: null,
        fieldScores: input.markedInvalid ? [] : input.fieldScores,
        markedInvalid: input.markedInvalid,
        instructorComment: input.instructorComment ? input.instructorComment.trim() : null,
    };
}

// ------------------------------------------------------------------
// 2. suggestFirstSolvers - read-only, never applies anything
// ------------------------------------------------------------------
export async function suggestFirstSolvers(
    input: FirstSolverSuggestionInput
): Promise<FirstSolverSuggestion[]> {
    const week = await prisma.week.findUniqueOrThrow({
        where: { id: input.weekId },
        select: {
            tasks: {
                where: { type: "INTERNAL" },
                select: { id: true, title: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    const suggestions: FirstSolverSuggestion[] = [];

    for (const task of week.tasks) {
        // Only manually-locked submissions are first-solver-eligible - a
        // lazy auto-submit at Week.endDate never qualifies. We identify
        // "manually locked" via WeekResourceSubmission.lockedAt on the
        // same (studentId, weekId), since the lock is per-Week.
        const earliest = await prisma.submission.findFirst({
            where: {
                taskId: task.id,
                status: "SUBMITTED",
                student: {
                    weekResourceSubmissions: {
                        some: { weekId: input.weekId, lockedAt: { not: null } },
                    },
                },
            },
            orderBy: { submittedAt: "asc" },
            select: {
                studentId: true,
                submittedAt: true,
                student: { select: { name: true } },
            },
        });

        suggestions.push({
            taskId: task.id,
            taskTitle: task.title,
            suggestedStudentId: earliest?.studentId ?? null,
            suggestedStudentName: earliest?.student.name ?? null,
            submittedAt: earliest?.submittedAt ?? null,
        });
    }

    return suggestions;
}

// ------------------------------------------------------------------
// 3. finalizeWeekGrading - the atomic finish for one student+Week
// ------------------------------------------------------------------
export async function finalizeWeekGrading(
    input: FinalizeWeekGradingInput
): Promise<FinalizeWeekGradingResult> {
    const week = await prisma.week.findUnique({
        where: { id: input.weekId },
        select: {
            id: true,
            groupId: true,
            tasks: {
                select: {
                    id: true,
                    isBonus: true,
                    type: true,
                    allowedSubmissionMode: true,
                },
            },
        },
    });

    if (!week) {
        throw new Error("Week not found.");
    }

    await assertInstructorAssignedToGroup(input.gradedBy, week.groupId);

    const resource = await prisma.weekResourceSubmission.findUnique({
        where: {
            studentId_weekId: { studentId: input.studentId, weekId: week.id },
        },
        select: { status: true, lockedAt: true },
    });

    // Any status other than ACCEPTED (PENDING, REJECTED, or no row/file at
    // all) triggers the halving - only an explicit ACCEPTED verdict avoids
    // it.
    const wasHalvedDueToLateResource = resource?.status !== "ACCEPTED";

    // Pull, per Task, this student's Submission (existence/id) and any
    // TaskGrade draft already saved via saveDraftGrade (markedInvalid is a
    // real column now - no more inferring it from an empty fieldScores
    // array, which was ambiguous with "scored all fields as 0").
    const taskIds = week.tasks.map((t) => t.id);
    const submissions = await prisma.submission.findMany({
        where: { studentId: input.studentId, taskId: { in: taskIds } },
        select: {
            id: true,
            taskId: true,
            taskGrade: {
                select: {
                    finalizedAt: true,
                    markedInvalid: true,
                    fieldScores: { select: { awardedPoints: true } },
                },
            },
        },
    });

    const submissionByTask = new Map(submissions.map((s) => [s.taskId, s]));

    const existingTransaction = await prisma.sTTransaction.findFirst({
        where: { studentId: input.studentId, weekId: week.id },
    });

    if (existingTransaction || submissions.some((s) => s.taskGrade?.finalizedAt)) {
        throw new Error(
            "This student's Week grading has already been finalized."
        );
    }

    const firstSolverSet = new Set(input.firstSolverTaskIds);

    const taskResults: FinalizeWeekGradingResult["taskResults"] = [];
    let positiveSum = 0;
    let allTasksSubmitted = true;

    for (const task of week.tasks) {
        const submission = submissionByTask.get(task.id);
        const grade = submission?.taskGrade;
        const noSubmission = !submission;
        const markedInvalid = grade?.markedInvalid ?? false;

        if (noSubmission || markedInvalid) {
            allTasksSubmitted = false;
            taskResults.push({
                taskId: task.id,
                rubricPoints: null,
                bonusPoints: 0,
                firstSolverPoints: 0,
                penaltyPoints: NOT_SUBMITTED_PENALTY,
            });
            continue;
        }

        const rubricPoints = grade
            ? grade.fieldScores.reduce((sum, f) => sum + f.awardedPoints, 0)
            : 0;
        const bonusPoints = task.isBonus ? BONUS_TASK_POINTS : 0;
        const firstSolverPoints = firstSolverSet.has(task.id)
            ? FIRST_SOLVER_POINTS
            : 0;

        positiveSum += rubricPoints + bonusPoints + firstSolverPoints;

        taskResults.push({
            taskId: task.id,
            rubricPoints,
            bonusPoints,
            firstSolverPoints,
            penaltyPoints: 0,
        });
    }

    const finishAllBonusApplied = allTasksSubmitted && week.tasks.length > 0;
    if (finishAllBonusApplied) {
        positiveSum += FINISH_ALL_BONUS;
    }

    const penaltySum = taskResults.reduce((sum, r) => sum + r.penaltyPoints, 0);

    // Halving applies ONCE to the summed positive total for the whole
    // batch (not per-component - flooring each component separately would
    // lose more points to rounding than flooring the sum once). The
    // penalty sum is never halved.
    const appliedPositive = wasHalvedDueToLateResource
        ? Math.floor(positiveSum / 2)
        : positiveSum;

    const now = new Date();

    // ONE outer transaction: TaskGrade finalize writes + every
    // STTransaction component all commit together or all roll back
    // together. applySTChange now accepts this same `tx` (see
    // create-transaction.ts) instead of opening its own, which is what
    // makes this genuinely atomic as a whole unit - unlike a plain
    // sequence of independent applySTChange calls.
    await prisma.$transaction(async (tx) => {
        for (const task of week.tasks) {
            let submission = submissionByTask.get(task.id);
            if (!submission) {
                const createdSub = await tx.submission.upsert({
                    where: {
                        studentId_taskId: {
                            studentId: input.studentId,
                            taskId: task.id,
                        },
                    },
                    create: {
                        studentId: input.studentId,
                        taskId: task.id,
                        mode: task.type === "EXTERNAL" ? "EXTERNAL" : (task.allowedSubmissionMode || "TEXT"),
                        status: "SUBMITTED",
                        isLocked: true,
                    },
                    update: {
                        status: "SUBMITTED",
                        isLocked: true,
                    },
                });
                submission = {
                    id: createdSub.id,
                    taskId: task.id,
                    taskGrade: null,
                };
            } else {
                await tx.submission.update({
                    where: { id: submission.id },
                    data: {
                        status: "SUBMITTED",
                        isLocked: true,
                    },
                });
            }

            const taskResult = taskResults.find((r) => r.taskId === task.id)!;
            const totalPoints =
                taskResult.rubricPoints !== null
                    ? taskResult.rubricPoints +
                      taskResult.bonusPoints +
                      taskResult.firstSolverPoints
                    : -NOT_SUBMITTED_PENALTY;

            await tx.taskGrade.upsert({
                where: { submissionId: submission.id },
                create: {
                    submissionId: submission.id,
                    gradedBy: input.gradedBy,
                    totalPoints,
                    finalizedAt: now,
                    markedInvalid: taskResult.rubricPoints === null,
                },
                update: {
                    totalPoints,
                    finalizedAt: now,
                    markedInvalid: taskResult.rubricPoints === null,
                },
            });
        }

        // Lock student week deliverable permanently
        await tx.weekResourceSubmission.upsert({
            where: {
                studentId_weekId: {
                    studentId: input.studentId,
                    weekId: week.id,
                },
            },
            create: {
                studentId: input.studentId,
                weekId: week.id,
                status: "REJECTED",
                lockedAt: now,
            },
            update: {
                lockedAt: resource?.lockedAt ?? now,
            },
        });

        // Each component gets its own STTransaction with a distinct
        // reason, per the agreed design. The per-component amounts here
        // are the RAW (pre-halving) points - only the aggregate
        // `appliedPositive` is halved, so we scale each component down
        // proportionally against the batch-level halving, using the raw
        // sum as the base. Simplest exact way to do this without
        // re-introducing per-component rounding loss: apply the halving
        // to the LAST positive component's amount as a remainder-absorber,
        // so the sum of what actually gets written always equals
        // appliedPositive exactly.
        let positiveRemaining = appliedPositive;
        const positiveComponents: {
            reason: "RUBRIC_GRADING" | "BONUS_TASK_SOLVED" | "FIRST_SOLVER" | "FINISH_ALL_TASKS";
            amount: number;
            relatedEntityId: string;
        }[] = [];

        for (const taskResult of taskResults) {
            if (taskResult.rubricPoints !== null && taskResult.rubricPoints > 0) {
                positiveComponents.push({
                    reason: "RUBRIC_GRADING",
                    amount: taskResult.rubricPoints,
                    relatedEntityId: taskResult.taskId,
                });
            }
            if (taskResult.bonusPoints > 0) {
                positiveComponents.push({
                    reason: "BONUS_TASK_SOLVED",
                    amount: taskResult.bonusPoints,
                    relatedEntityId: taskResult.taskId,
                });
            }
            if (taskResult.firstSolverPoints > 0) {
                positiveComponents.push({
                    reason: "FIRST_SOLVER",
                    amount: taskResult.firstSolverPoints,
                    relatedEntityId: taskResult.taskId,
                });
            }
        }
        if (finishAllBonusApplied) {
            positiveComponents.push({
                reason: "FINISH_ALL_TASKS",
                amount: FINISH_ALL_BONUS,
                relatedEntityId: week.id,
            });
        }

        // If no halving applies, every component is written at its raw
        // amount unchanged (this is the common case - resource ACCEPTED).
        // Only when halving actually applies do we need to shrink the
        // components so they sum to the halved total: give each
        // component its own floor(amount/2), then hand any 1-point
        // remainder (lost to flooring) to the last component, so the
        // written components always sum to exactly `appliedPositive`.
        if (!wasHalvedDueToLateResource) {
            for (const component of positiveComponents) {
                await applySTChange(
                    {
                        track: "BEGINNER",
                        studentId: input.studentId,
                        weekId: week.id,
                        type: "REWARD",
                        reason: component.reason,
                        amount: component.amount,
                        relatedEntityId: component.relatedEntityId,
                        wasHalvedDueToLateResource: false,
                    },
                    tx
                );
            }
        } else {
            for (let i = 0; i < positiveComponents.length; i++) {
                const component = positiveComponents[i];
                const isLast = i === positiveComponents.length - 1;
                const halved = Math.floor(component.amount / 2);
                const scaledAmount = isLast ? positiveRemaining : halved;
                positiveRemaining -= scaledAmount;

                if (scaledAmount > 0) {
                    await applySTChange(
                        {
                            track: "BEGINNER",
                            studentId: input.studentId,
                            weekId: week.id,
                            type: "REWARD",
                            reason: component.reason,
                            amount: scaledAmount,
                            relatedEntityId: component.relatedEntityId,
                            wasHalvedDueToLateResource: true,
                        },
                        tx
                    );
                }
            }
        }

        for (const taskResult of taskResults) {
            if (taskResult.penaltyPoints > 0) {
                // Penalty is never halved.
                await applySTChange(
                    {
                        track: "BEGINNER",
                        studentId: input.studentId,
                        weekId: week.id,
                        type: "PENALTY",
                        reason: "TASK_NOT_SUBMITTED",
                        amount: taskResult.penaltyPoints,
                        relatedEntityId: taskResult.taskId,
                        wasHalvedDueToLateResource: false,
                    },
                    tx
                );
            }
        }
    });

    const totalStDelta = appliedPositive - penaltySum;

    const student = await prisma.student.findUniqueOrThrow({
        where: { id: input.studentId },
        select: { beginnerSt: true },
    });

    return {
        studentId: input.studentId,
        weekId: week.id,
        finalizedAt: now,
        wasHalvedDueToLateResource,
        taskResults,
        finishAllBonusApplied,
        totalStDelta,
        beginnerStBalance: student.beginnerSt ?? 0,
    };
}