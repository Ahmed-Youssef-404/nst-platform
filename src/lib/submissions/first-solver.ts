// src/lib/submissions/first-solver.ts
//
// Unified First Solver engine for both BEGINNER and INTERMEDIATE tracks.
//
// Core rules:
//   - Source of truth timestamp is Submission.lastSavedAt (server time of the
//     student's last actual solution change), NEVER Submission.submittedAt
//     (@updatedAt) and NEVER lock/auto-submit/grading time.
//   - Legacy or synthetic submissions with lastSavedAt = null are ineligible.
//   - BEGINNER closes at Week.endDate (includes both manually locked and
//     auto-submitted DRAFT submissions whose lastSavedAt < Week.endDate).
//   - INTERMEDIATE closes at Task.deadline (lastSavedAt < Task.deadline).
//   - Invalidated submissions (TaskGrade.markedInvalid = true, or 0-score
//     graded INTERMEDIATE submissions) are excluded; the next earliest valid
//     eligible candidate is suggested automatically.
//   - Deterministic tie-breaking: lastSavedAt ASC, createdAt ASC, id ASC.
//   - One FIRST_SOLVER reward per Task, protected by row locking, transaction
//     checks, and STTransaction.idempotencyKey = "FIRST_SOLVER:<taskId>".

import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applySTChange } from "@/lib/st-economy/create-transaction";
import {
    hasValidTaskSubmissionContent,
    isRewardHalvedForResource,
} from "@/lib/weeks/resource-eligibility";
import type {
    ConfirmFirstSolverInput,
    ConfirmFirstSolverResult,
    FirstSolverSuggestion,
    GroupTypeCode,
    TaskTypeCode,
} from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const defaultPrisma = new PrismaClient({ adapter });

export const FIRST_SOLVER_BONUS_POINTS = 5;

export function getFirstSolverIdempotencyKey(taskId: string): string {
    return `FIRST_SOLVER:${taskId}`;
}

export type FirstSolverDbClient = Pick<
    PrismaClient,
    "task" | "submission" | "sTTransaction" | "weekResourceSubmission" | "instructorGroup" | "taskGrade"
>;

export type FirstSolverTransactionClient = Prisma.TransactionClient;

/**
 * Acquires row-level FOR UPDATE locks inside an interactive transaction.
 * Always lock "tasks" before "students" (and in ascending ID order) to prevent
 * deadlocks across concurrent grading / finalization / save operations.
 */
export async function lockRowsForUpdate(
    tx: unknown,
    table: "tasks" | "students",
    ids: string[]
): Promise<void> {
    const uniqueSortedIds = Array.from(new Set(ids)).sort();
    if (uniqueSortedIds.length === 0) return;

    const client = tx as {
        $queryRaw?: (
            query: TemplateStringsArray | Prisma.Sql,
            ...values: unknown[]
        ) => Promise<unknown>;
    };

    if (typeof client.$queryRaw !== "function") {
        return;
    }

    if (table === "tasks") {
        await client.$queryRaw(
            Prisma.sql`SELECT "id" FROM "tasks" WHERE "id" IN (${Prisma.join(uniqueSortedIds)}) ORDER BY "id" ASC FOR UPDATE`
        );
    } else {
        await client.$queryRaw(
            Prisma.sql`SELECT "id" FROM "students" WHERE "id" IN (${Prisma.join(uniqueSortedIds)}) ORDER BY "id" ASC FOR UPDATE`
        );
    }
}

export interface FirstSolverCandidateRecord {
    id: string;
    studentId: string;
    taskId: string;
    studentName: string;
    studentGroupId: string;
    mode: string;
    fileUrl: string | null;
    externalLink: string | null;
    textContent: string | null;
    lastSavedAt: Date | null;
    createdAt: Date;
    gradedAt: Date | null;
    understandingScore: number | null;
    approachScore: number | null;
    correctnessScore: number | null;
    implementationScore: number | null;
    taskGrade: {
        markedInvalid: boolean;
        totalPoints: number | null;
        finalizedAt: Date | null;
    } | null;
}

export interface ExistingFirstSolverAward {
    studentId: string;
    studentName: string;
}

export interface RankedTaskFirstSolverResult {
    suggestion: FirstSolverSuggestion;
    rankedCandidates: FirstSolverCandidateRecord[];
}

function getEffectiveIntermediateGradedScore(
    record: FirstSolverCandidateRecord
): number {
    if (record.taskGrade && record.taskGrade.totalPoints !== null) {
        return record.taskGrade.totalPoints;
    }
    return (
        (record.understandingScore ?? 0) +
        (record.approachScore ?? 0) +
        (record.correctnessScore ?? 0) +
        (record.implementationScore ?? 0)
    );
}

function isDisqualifiedForFirstSolver(
    record: FirstSolverCandidateRecord,
    track: GroupTypeCode
): boolean {
    if (record.taskGrade?.markedInvalid) {
        return true;
    }
    if (track === "INTERMEDIATE" && record.gradedAt !== null) {
        return getEffectiveIntermediateGradedScore(record) <= 0;
    }
    return false;
}

export function compareFirstSolverCandidates(
    a: Pick<FirstSolverCandidateRecord, "lastSavedAt" | "createdAt" | "id">,
    b: Pick<FirstSolverCandidateRecord, "lastSavedAt" | "createdAt" | "id">
): number {
    const aSaved = a.lastSavedAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const bSaved = b.lastSavedAt?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aSaved !== bSaved) return aSaved - bSaved;

    const aCreated = a.createdAt.getTime();
    const bCreated = b.createdAt.getTime();
    if (aCreated !== bCreated) return aCreated - bCreated;

    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
}

/**
 * Pure ranking function for a single INTERNAL Task.
 * Calculates eligibility, excludes invalid submissions, and applies
 * deterministic tie-breaking (lastSavedAt ASC, createdAt ASC, id ASC).
 */
export function rankTaskFirstSolverCandidates(params: {
    taskId: string;
    taskTitle: string;
    track: GroupTypeCode;
    groupId: string;
    closesAt: Date;
    now: Date;
    submissions: FirstSolverCandidateRecord[];
    existingAward: ExistingFirstSolverAward | null;
}): RankedTaskFirstSolverResult {
    const {
        taskId,
        taskTitle,
        track,
        groupId,
        closesAt,
        now,
        submissions,
        existingAward,
    } = params;

    const isClosed = now.getTime() >= closesAt.getTime();

    const baseEligible = submissions.filter(
        (s) =>
            s.taskId === taskId &&
            s.studentGroupId === groupId &&
            s.mode !== "EXTERNAL" &&
            s.lastSavedAt !== null &&
            s.lastSavedAt.getTime() < closesAt.getTime() &&
            hasValidTaskSubmissionContent(s)
    );

    const validCandidates: FirstSolverCandidateRecord[] = [];
    let excludedInvalidCount = 0;

    for (const candidate of baseEligible) {
        if (isDisqualifiedForFirstSolver(candidate, track)) {
            excludedInvalidCount++;
        } else {
            validCandidates.push(candidate);
        }
    }

    validCandidates.sort(compareFirstSolverCandidates);

    if (existingAward) {
        return {
            suggestion: {
                taskId,
                taskTitle,
                status: "AWARDED",
                isClosed,
                closesAt,
                suggestedStudentId: null,
                suggestedStudentName: null,
                submittedAt: null,
                lastSavedAt: null,
                awardedStudentId: existingAward.studentId,
                awardedStudentName: existingAward.studentName,
                excludedInvalidCount,
            },
            rankedCandidates: validCandidates,
        };
    }

    if (!isClosed) {
        return {
            suggestion: {
                taskId,
                taskTitle,
                status: "PENDING_CLOSE",
                isClosed: false,
                closesAt,
                suggestedStudentId: null,
                suggestedStudentName: null,
                submittedAt: null,
                lastSavedAt: null,
                awardedStudentId: null,
                awardedStudentName: null,
                excludedInvalidCount: 0,
            },
            rankedCandidates: [],
        };
    }

    const winner = validCandidates[0] ?? null;

    if (!winner) {
        return {
            suggestion: {
                taskId,
                taskTitle,
                status: "NO_CANDIDATE",
                isClosed: true,
                closesAt,
                suggestedStudentId: null,
                suggestedStudentName: null,
                submittedAt: null,
                lastSavedAt: null,
                awardedStudentId: null,
                awardedStudentName: null,
                excludedInvalidCount,
            },
            rankedCandidates: [],
        };
    }

    return {
        suggestion: {
            taskId,
            taskTitle,
            status: "CANDIDATE",
            isClosed: true,
            closesAt,
            suggestedStudentId: winner.studentId,
            suggestedStudentName: winner.studentName,
            submittedAt: winner.lastSavedAt,
            lastSavedAt: winner.lastSavedAt,
            awardedStudentId: null,
            awardedStudentName: null,
            excludedInvalidCount,
        },
        rankedCandidates: validCandidates,
    };
}

/**
 * Computes First Solver suggestions for a list of Tasks in a single Week or Session
 * with batched queries (no N+1 loop).
 */
export async function computeTaskFirstSolverSuggestions(
    db: Pick<PrismaClient, "submission" | "sTTransaction">,
    params: {
        track: GroupTypeCode;
        groupId: string;
        tasks: {
            id: string;
            title: string;
            type: TaskTypeCode | string;
            closesAt: Date;
        }[];
        now?: Date;
    }
): Promise<FirstSolverSuggestion[]> {
    const now = params.now ?? new Date();
    const internalTasks = params.tasks.filter((t) => t.type === "INTERNAL");
    if (internalTasks.length === 0) {
        return [];
    }

    const internalTaskIds = internalTasks.map((t) => t.id);

    const [rawSubmissions, existingAwards] = await Promise.all([
        db.submission.findMany({
            where: {
                taskId: { in: internalTaskIds },
                mode: { not: "EXTERNAL" },
                lastSavedAt: { not: null },
                student: { groupId: params.groupId },
            },
            orderBy: [
                { lastSavedAt: "asc" },
                { createdAt: "asc" },
                { id: "asc" },
            ],
            select: {
                id: true,
                studentId: true,
                taskId: true,
                mode: true,
                fileUrl: true,
                externalLink: true,
                textContent: true,
                lastSavedAt: true,
                createdAt: true,
                gradedAt: true,
                understandingScore: true,
                approachScore: true,
                correctnessScore: true,
                implementationScore: true,
                student: {
                    select: { name: true, groupId: true },
                },
                taskGrade: {
                    select: {
                        markedInvalid: true,
                        totalPoints: true,
                        finalizedAt: true,
                    },
                },
            },
        }),
        db.sTTransaction.findMany({
            where: {
                reason: "FIRST_SOLVER",
                relatedEntityId: { in: internalTaskIds },
            },
            select: {
                relatedEntityId: true,
                studentId: true,
                student: { select: { name: true } },
            },
        }),
    ]);

    const awardByTaskId = new Map<string, ExistingFirstSolverAward>();
    for (const award of existingAwards) {
        if (award.relatedEntityId && !awardByTaskId.has(award.relatedEntityId)) {
            awardByTaskId.set(award.relatedEntityId, {
                studentId: award.studentId,
                studentName: award.student.name,
            });
        }
    }

    const submissionsByTaskId = new Map<string, FirstSolverCandidateRecord[]>();
    for (const sub of rawSubmissions) {
        const list = submissionsByTaskId.get(sub.taskId) ?? [];
        list.push({
            id: sub.id,
            studentId: sub.studentId,
            taskId: sub.taskId,
            studentName: sub.student.name,
            studentGroupId: sub.student.groupId,
            mode: sub.mode,
            fileUrl: sub.fileUrl,
            externalLink: sub.externalLink,
            textContent: sub.textContent,
            lastSavedAt: sub.lastSavedAt,
            createdAt: sub.createdAt,
            gradedAt: sub.gradedAt,
            understandingScore: sub.understandingScore,
            approachScore: sub.approachScore,
            correctnessScore: sub.correctnessScore,
            implementationScore: sub.implementationScore,
            taskGrade: sub.taskGrade,
        });
        submissionsByTaskId.set(sub.taskId, list);
    }

    return internalTasks.map((task) => {
        const result = rankTaskFirstSolverCandidates({
            taskId: task.id,
            taskTitle: task.title,
            track: params.track,
            groupId: params.groupId,
            closesAt: task.closesAt,
            now,
            submissions: submissionsByTaskId.get(task.id) ?? [],
            existingAward: awardByTaskId.get(task.id) ?? null,
        });
        return result.suggestion;
    });
}

export async function getTaskFirstSolverContext(
    db: Pick<PrismaClient, "task" | "submission" | "sTTransaction">,
    taskId: string,
    now: Date = new Date()
): Promise<{
    track: GroupTypeCode;
    groupId: string;
    weekId: string | null;
    levelId: string | null;
    closesAt: Date;
    suggestion: FirstSolverSuggestion;
}> {
    const task = await db.task.findUnique({
        where: { id: taskId },
        select: {
            id: true,
            title: true,
            type: true,
            deadline: true,
            week: {
                select: { id: true, groupId: true, endDate: true },
            },
            session: {
                select: {
                    id: true,
                    levelId: true,
                    level: { select: { groupId: true } },
                },
            },
        },
    });

    if (!task) {
        throw new Error("Task not found.");
    }

    const track: GroupTypeCode = task.week ? "BEGINNER" : "INTERMEDIATE";
    const groupId = task.week?.groupId ?? task.session?.level.groupId ?? null;
    if (!groupId) {
        throw new Error("Task does not belong to a valid Group.");
    }

    const closesAt = task.week ? task.week.endDate : task.deadline;

    if (task.type !== "INTERNAL") {
        return {
            track,
            groupId,
            weekId: task.week?.id ?? null,
            levelId: task.session?.levelId ?? null,
            closesAt,
            suggestion: {
                taskId: task.id,
                taskTitle: task.title,
                status: "NO_CANDIDATE",
                isClosed: now.getTime() >= closesAt.getTime(),
                closesAt,
                suggestedStudentId: null,
                suggestedStudentName: null,
                submittedAt: null,
                lastSavedAt: null,
                awardedStudentId: null,
                awardedStudentName: null,
                excludedInvalidCount: 0,
            },
        };
    }

    const [suggestion] = await computeTaskFirstSolverSuggestions(db, {
        track,
        groupId,
        tasks: [
            {
                id: task.id,
                title: task.title,
                type: task.type,
                closesAt,
            },
        ],
        now,
    });

    return {
        track,
        groupId,
        weekId: task.week?.id ?? null,
        levelId: task.session?.levelId ?? null,
        closesAt,
        suggestion,
    };
}

/**
 * Confirms and awards the +5 ST First Solver bonus for an already-graded
 * (INTERMEDIATE) or already-finalized (BEGINNER) candidate after the Task/Week
 * has closed. Safe against retries and concurrent calls.
 */
export async function confirmTaskFirstSolver(
    input: ConfirmFirstSolverInput,
    options?: {
        prisma?: PrismaClient;
        now?: () => Date;
    }
): Promise<ConfirmFirstSolverResult> {
    const db = options?.prisma ?? defaultPrisma;
    const getNow = options?.now ?? (() => new Date());

    const taskMeta = await db.task.findUnique({
        where: { id: input.taskId },
        select: {
            id: true,
            title: true,
            type: true,
            deadline: true,
            week: { select: { id: true, groupId: true, endDate: true } },
            session: {
                select: { id: true, levelId: true, level: { select: { groupId: true } } },
            },
        },
    });

    if (!taskMeta) {
        throw new Error("Task not found.");
    }

    if (taskMeta.type !== "INTERNAL") {
        throw new Error("EXTERNAL tasks do not support First Solver awards.");
    }

    const track: GroupTypeCode = taskMeta.week ? "BEGINNER" : "INTERMEDIATE";
    const groupId = taskMeta.week?.groupId ?? taskMeta.session?.level.groupId ?? null;
    if (!groupId) {
        throw new Error("Task does not belong to a valid Group.");
    }

    const assignment = await db.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId: input.confirmedBy,
                groupId,
            },
        },
    });

    if (!assignment) {
        throw new Error("You are not assigned to this Group.");
    }

    return db.$transaction(async (tx) => {
        await lockRowsForUpdate(tx, "tasks", [input.taskId]);
        await lockRowsForUpdate(tx, "students", [input.studentId]);

        const now = getNow();
        const existingAward = await tx.sTTransaction.findFirst({
            where: {
                reason: "FIRST_SOLVER",
                relatedEntityId: input.taskId,
            },
            select: {
                id: true,
                studentId: true,
                amount: true,
                wasHalvedDueToLateResource: true,
            },
        });

        if (existingAward) {
            if (existingAward.studentId === input.studentId) {
                return {
                    taskId: input.taskId,
                    studentId: input.studentId,
                    track,
                    awardedAmount: 0,
                    wasHalvedDueToLateResource: existingAward.wasHalvedDueToLateResource,
                };
            }
            throw new Error(
                "First Solver bonus for this task has already been awarded to another student."
            );
        }

        const context = await getTaskFirstSolverContext(tx, input.taskId, now);
        if (!context.suggestion.isClosed) {
            throw new Error(
                track === "BEGINNER"
                    ? "First Solver cannot be confirmed before the Week deadline passes."
                    : "First Solver cannot be confirmed before the task deadline passes."
            );
        }

        if (
            context.suggestion.status !== "CANDIDATE" ||
            context.suggestion.suggestedStudentId !== input.studentId
        ) {
            throw new Error(
                "This student is not the current earliest eligible First Solver candidate for this task."
            );
        }

        const submission = await tx.submission.findUnique({
            where: {
                studentId_taskId: {
                    studentId: input.studentId,
                    taskId: input.taskId,
                },
            },
            select: {
                id: true,
                mode: true,
                fileUrl: true,
                externalLink: true,
                textContent: true,
                lastSavedAt: true,
                gradedAt: true,
                understandingScore: true,
                approachScore: true,
                correctnessScore: true,
                implementationScore: true,
                taskGrade: {
                    select: {
                        id: true,
                        totalPoints: true,
                        finalizedAt: true,
                        markedInvalid: true,
                    },
                },
            },
        });

        if (
            !submission ||
            !submission.lastSavedAt ||
            submission.lastSavedAt.getTime() >= context.closesAt.getTime() ||
            !hasValidTaskSubmissionContent(submission) ||
            submission.taskGrade?.markedInvalid
        ) {
            throw new Error(
                "This submission is not eligible for the First Solver bonus."
            );
        }

        if (track === "INTERMEDIATE") {
            if (!submission.gradedAt) {
                throw new Error(
                    "Please grade and validate this submission before confirming First Solver."
                );
            }

            const score =
                submission.taskGrade?.totalPoints ??
                ((submission.understandingScore ?? 0) +
                    (submission.approachScore ?? 0) +
                    (submission.correctnessScore ?? 0) +
                    (submission.implementationScore ?? 0));

            if (score <= 0) {
                throw new Error(
                    "A submission with 0 points cannot receive the First Solver bonus."
                );
            }

            await applySTChange(
                {
                    track: "INTERMEDIATE",
                    studentId: input.studentId,
                    levelId: context.levelId!,
                    type: "REWARD",
                    reason: "FIRST_SOLVER",
                    amount: FIRST_SOLVER_BONUS_POINTS,
                    relatedEntityId: input.taskId,
                    actorId: input.confirmedBy,
                    idempotencyKey: getFirstSolverIdempotencyKey(input.taskId),
                },
                tx
            );

            return {
                taskId: input.taskId,
                studentId: input.studentId,
                track: "INTERMEDIATE",
                awardedAmount: FIRST_SOLVER_BONUS_POINTS,
                wasHalvedDueToLateResource: false,
            };
        }

        // BEGINNER post-finalization confirmation
        if (!submission.taskGrade?.finalizedAt) {
            throw new Error(
                "Please finalize this student's Week grading (and confirm First Solver in the modal) before using post-finalization confirmation."
            );
        }

        const weekId = context.weekId!;
        const resource = await tx.weekResourceSubmission.findUnique({
            where: {
                studentId_weekId: {
                    studentId: input.studentId,
                    weekId,
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

        const wasHalvedDueToLateResource = isRewardHalvedForResource(resource);
        let awardedAmount = FIRST_SOLVER_BONUS_POINTS;

        if (wasHalvedDueToLateResource) {
            // Preserve batch-level halving parity by computing floor((raw + 5) / 2) - appliedBefore.
            const [weekTaskGrades, weekPositiveTxs] = await Promise.all([
                tx.taskGrade.findMany({
                    where: {
                        finalizedAt: { not: null },
                        markedInvalid: false,
                        submission: {
                            studentId: input.studentId,
                            task: { weekId },
                        },
                    },
                    select: { totalPoints: true },
                }),
                tx.sTTransaction.findMany({
                    where: {
                        studentId: input.studentId,
                        weekId,
                        type: "REWARD",
                        reason: {
                            in: [
                                "RUBRIC_GRADING",
                                "BONUS_TASK_SOLVED",
                                "FIRST_SOLVER",
                                "FINISH_ALL_TASKS",
                            ],
                        },
                    },
                    select: { reason: true, amount: true },
                }),
            ]);

            const hasFinishAll = weekPositiveTxs.some(
                (t) => t.reason === "FINISH_ALL_TASKS"
            );
            const rawPositiveBefore =
                weekTaskGrades.reduce((sum, g) => sum + (g.totalPoints ?? 0), 0) +
                (hasFinishAll ? 10 : 0);
            const appliedBefore = weekPositiveTxs.reduce(
                (sum, t) => sum + t.amount,
                0
            );
            const appliedAfter = Math.floor(
                (rawPositiveBefore + FIRST_SOLVER_BONUS_POINTS) / 2
            );
            awardedAmount = Math.max(0, appliedAfter - appliedBefore);
        }

        await tx.taskGrade.update({
            where: { id: submission.taskGrade.id },
            data: {
                totalPoints: { increment: FIRST_SOLVER_BONUS_POINTS },
            },
        });

        if (awardedAmount > 0) {
            await applySTChange(
                {
                    track: "BEGINNER",
                    studentId: input.studentId,
                    weekId,
                    type: "REWARD",
                    reason: "FIRST_SOLVER",
                    amount: awardedAmount,
                    relatedEntityId: input.taskId,
                    actorId: input.confirmedBy,
                    wasHalvedDueToLateResource,
                    idempotencyKey: getFirstSolverIdempotencyKey(input.taskId),
                },
                tx
            );
        }

        return {
            taskId: input.taskId,
            studentId: input.studentId,
            track: "BEGINNER",
            awardedAmount,
            wasHalvedDueToLateResource,
        };
    });
}

