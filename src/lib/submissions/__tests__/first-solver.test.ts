// src/lib/submissions/__tests__/first-solver.test.ts
// Comprehensive unit & transactional integration tests for the Unified First Solver
// system (BEGINNER + INTERMEDIATE) using an in-memory Prisma double that faithfully
// models @updatedAt on submittedAt, unique constraints (including STTransaction.idempotencyKey),
// transaction atomicity/rollback, and row-level locking.

import assert from "node:assert";
import type { PrismaClient } from "@/generated/prisma/client";
import {
    hasSubmissionSolutionChanged,
    isMeaningfulSubmissionChange,
} from "@/lib/submissions/task-activity";
import {
    compareFirstSolverCandidates,
    rankTaskFirstSolverCandidates,
    computeTaskFirstSolverSuggestions,
    confirmTaskFirstSolver,
} from "@/lib/submissions/first-solver";
import { saveDraftSubmission } from "@/lib/weeks/save-draft-submission";
import { lockWeek } from "@/lib/weeks/lock-week";
import {
    saveDraftGrade,
    suggestFirstSolvers,
    finalizeWeekGrading,
} from "@/lib/weeks/grade-week";
import { createOrUpdateSubmission } from "@/lib/submissions/create-submission";
import { gradeSubmission } from "@/lib/st-economy/instructor-events";

// ============================================================================
// In-Memory Transactional Prisma Double (zero external DB connection)
// ============================================================================

type GroupType = "BEGINNER" | "INTERMEDIATE";

interface DbStore {
    students: Map<string, { id: string; name: string; groupId: string; avgSt: number; beginnerSt: number | null }>;
    instructorGroups: Map<string, { instructorId: string; groupId: string }>;
    groups: Map<string, { id: string; type: GroupType }>;
    weeks: Map<string, { id: string; groupId: string; startDate: Date; endDate: Date }>;
    sessions: Map<string, { id: string; levelId: string }>;
    levels: Map<string, { id: string; groupId: string }>;
    levelStBalances: Map<string, { id: string; studentId: string; levelId: string; balance: number }>;
    sessionFeedbacks: Map<string, { id: string; sessionId: string; studentId: string }>;
    tasks: Map<
        string,
        {
            id: string;
            title: string;
            type: "INTERNAL" | "EXTERNAL";
            deadline: Date;
            isBonus: boolean;
            weekId: string | null;
            sessionId: string | null;
            allowedSubmissionMode: "FILE" | "LINK" | "TEXT" | null;
            createdAt: Date;
        }
    >;
    rubricFields: Map<string, { id: string; taskId: string; fieldName: string; maxPoints: number; order: number }>;
    submissions: Map<
        string,
        {
            id: string;
            studentId: string;
            taskId: string;
            mode: "FILE" | "LINK" | "TEXT" | "EXTERNAL";
            fileUrl: string | null;
            externalLink: string | null;
            textContent: string | null;
            status: "DRAFT" | "SUBMITTED";
            submittedAt: Date;
            lastSavedAt: Date | null;
            isLocked: boolean;
            activityVersion: number;
            understandingScore: number | null;
            approachScore: number | null;
            correctnessScore: number | null;
            implementationScore: number | null;
            instructorComment: string | null;
            gradedAt: Date | null;
            gradedBy: string | null;
            createdAt: Date;
        }
    >;
    taskGrades: Map<
        string,
        {
            id: string;
            submissionId: string;
            gradedBy: string;
            totalPoints: number | null;
            finalizedAt: Date | null;
            markedInvalid: boolean;
        }
    >;
    taskGradeFields: Map<string, { id: string; taskGradeId: string; rubricFieldId: string; awardedPoints: number }>;
    weekResources: Map<
        string,
        {
            id: string;
            studentId: string;
            weekId: string;
            type: "FILE" | "DRIVE_LINK" | null;
            fileUrl: string | null;
            driveUrl: string | null;
            status: "PENDING" | "ACCEPTED" | "REJECTED";
            submittedAt: Date | null;
            lockedAt: Date | null;
        }
    >;
    stTransactions: Map<
        string,
        {
            id: string;
            studentId: string;
            levelId: string | null;
            weekId: string | null;
            type: "REWARD" | "PENALTY";
            reason: string;
            amount: number;
            relatedEntityId: string | null;
            levelStBalance: number | null;
            avgStBalance: number | null;
            beginnerStBalance: number | null;
            wasHalvedDueToLateResource: boolean;
            actorId: string | null;
            note: string | null;
            idempotencyKey: string | null;
            createdAt: Date;
        }
    >;
}

function cloneStore(s: DbStore): DbStore {
    return {
        students: new Map(Array.from(s.students.entries()).map(([k, v]) => [k, { ...v }])),
        instructorGroups: new Map(Array.from(s.instructorGroups.entries()).map(([k, v]) => [k, { ...v }])),
        groups: new Map(Array.from(s.groups.entries()).map(([k, v]) => [k, { ...v }])),
        weeks: new Map(Array.from(s.weeks.entries()).map(([k, v]) => [k, { ...v, startDate: new Date(v.startDate), endDate: new Date(v.endDate) }])),
        sessions: new Map(Array.from(s.sessions.entries()).map(([k, v]) => [k, { ...v }])),
        levels: new Map(Array.from(s.levels.entries()).map(([k, v]) => [k, { ...v }])),
        levelStBalances: new Map(Array.from(s.levelStBalances.entries()).map(([k, v]) => [k, { ...v }])),
        sessionFeedbacks: new Map(Array.from(s.sessionFeedbacks.entries()).map(([k, v]) => [k, { ...v }])),
        tasks: new Map(Array.from(s.tasks.entries()).map(([k, v]) => [k, { ...v, deadline: new Date(v.deadline), createdAt: new Date(v.createdAt) }])),
        rubricFields: new Map(Array.from(s.rubricFields.entries()).map(([k, v]) => [k, { ...v }])),
        submissions: new Map(
            Array.from(s.submissions.entries()).map(([k, v]) => [
                k,
                {
                    ...v,
                    submittedAt: new Date(v.submittedAt),
                    lastSavedAt: v.lastSavedAt ? new Date(v.lastSavedAt) : null,
                    gradedAt: v.gradedAt ? new Date(v.gradedAt) : null,
                    createdAt: new Date(v.createdAt),
                },
            ])
        ),
        taskGrades: new Map(
            Array.from(s.taskGrades.entries()).map(([k, v]) => [
                k,
                { ...v, finalizedAt: v.finalizedAt ? new Date(v.finalizedAt) : null },
            ])
        ),
        taskGradeFields: new Map(Array.from(s.taskGradeFields.entries()).map(([k, v]) => [k, { ...v }])),
        weekResources: new Map(
            Array.from(s.weekResources.entries()).map(([k, v]) => [
                k,
                {
                    ...v,
                    submittedAt: v.submittedAt ? new Date(v.submittedAt) : null,
                    lockedAt: v.lockedAt ? new Date(v.lockedAt) : null,
                },
            ])
        ),
        stTransactions: new Map(
            Array.from(s.stTransactions.entries()).map(([k, v]) => [
                k,
                { ...v, createdAt: new Date(v.createdAt) },
            ])
        ),
    };
}

class InMemoryPrisma {
    store: DbStore;
    submissionWriteCount = 0;
    private idSeq = 1;
    private txQueue: Promise<void> = Promise.resolve();
    private currentClock: () => Date;

    constructor(clock: () => Date = () => new Date()) {
        this.currentClock = clock;
        this.store = {
            students: new Map(),
            instructorGroups: new Map(),
            groups: new Map(),
            weeks: new Map(),
            sessions: new Map(),
            levels: new Map(),
            levelStBalances: new Map(),
            sessionFeedbacks: new Map(),
            tasks: new Map(),
            rubricFields: new Map(),
            submissions: new Map(),
            taskGrades: new Map(),
            taskGradeFields: new Map(),
            weekResources: new Map(),
            stTransactions: new Map(),
        };
    }

    private nextId(prefix: string): string {
        return `${prefix}-${this.idSeq++}`;
    }

    private buildClient(getStore: () => DbStore) {
        const hydrateTask = (task: DbStore["tasks"] extends Map<string, infer T> ? T : never) => {
            const s = getStore();
            const week = task.weekId ? s.weeks.get(task.weekId) ?? null : null;
            const session = task.sessionId ? s.sessions.get(task.sessionId) ?? null : null;
            const level = session ? s.levels.get(session.levelId) ?? null : null;
            const rubricFields = Array.from(s.rubricFields.values())
                .filter((rf) => rf.taskId === task.id)
                .sort((a, b) => a.order - b.order);
            return {
                ...task,
                week,
                session: session ? { ...session, level } : null,
                rubricFields,
            };
        };

        const hydrateTaskGrade = (tg: DbStore["taskGrades"] extends Map<string, infer T> ? T : never) => {
            const s = getStore();
            const fieldScores = Array.from(s.taskGradeFields.values()).filter(
                (f) => f.taskGradeId === tg.id
            );
            return { ...tg, fieldScores };
        };

        const hydrateSubmission = (sub: DbStore["submissions"] extends Map<string, infer T> ? T : never) => {
            const s = getStore();
            const task = s.tasks.get(sub.taskId)!;
            const student = s.students.get(sub.studentId)!;
            const tg = Array.from(s.taskGrades.values()).find((g) => g.submissionId === sub.id) ?? null;
            return {
                ...sub,
                task: hydrateTask(task),
                student,
                taskGrade: tg ? hydrateTaskGrade(tg) : null,
            };
        };

        const matchSubmissionWhere = (sub: DbStore["submissions"] extends Map<string, infer T> ? T : never, where: Record<string, unknown> | undefined): boolean => {
            const s = getStore();
            if (!where) return true;
            if (where.id && typeof where.id === "string" && sub.id !== where.id) return false;
            if (where.id && typeof where.id === "object" && "in" in where.id) {
                const ids = (where.id as { in: string[] }).in;
                if (!ids.includes(sub.id)) return false;
            }
            if (where.studentId && sub.studentId !== where.studentId) return false;
            if (where.taskId && typeof where.taskId === "string" && sub.taskId !== where.taskId) return false;
            if (where.taskId && typeof where.taskId === "object" && "in" in where.taskId) {
                const ids = (where.taskId as { in: string[] }).in;
                if (!ids.includes(sub.taskId)) return false;
            }
            if (where.mode && typeof where.mode === "object" && "not" in where.mode) {
                if (sub.mode === (where.mode as { not: string }).not) return false;
            }
            if (where.lastSavedAt && typeof where.lastSavedAt === "object" && "not" in where.lastSavedAt) {
                if ((where.lastSavedAt as { not: null }).not === null && sub.lastSavedAt === null) return false;
            }
            if (where.student && typeof where.student === "object") {
                const st = s.students.get(sub.studentId);
                const stWhere = where.student as { groupId?: string };
                if (stWhere.groupId && st?.groupId !== stWhere.groupId) return false;
            }
            return true;
        };

        const client = {
            $queryRaw: async () => [],
            student: {
                findUnique: async ({ where }: { where: { id: string } }) => {
                    return getStore().students.get(where.id) ?? null;
                },
                findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
                    const row = getStore().students.get(where.id);
                    if (!row) throw new Error("Student not found");
                    return row;
                },
                update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
                    const row = getStore().students.get(where.id);
                    if (!row) throw new Error("Student not found");
                    if (data.avgSt !== undefined) row.avgSt = data.avgSt as number;
                    if (data.beginnerSt && typeof data.beginnerSt === "object" && "increment" in data.beginnerSt) {
                        row.beginnerSt = (row.beginnerSt ?? 0) + (data.beginnerSt as { increment: number }).increment;
                    }
                    return { ...row };
                },
            },
            instructorGroup: {
                findUnique: async ({
                    where,
                }: {
                    where: { instructorId_groupId: { instructorId: string; groupId: string } };
                }) => {
                    const key = `${where.instructorId_groupId.instructorId}:${where.instructorId_groupId.groupId}`;
                    return getStore().instructorGroups.get(key) ?? null;
                },
            },
            levelStBalance: {
                findMany: async ({ where }: { where: { studentId: string } }) => {
                    return Array.from(getStore().levelStBalances.values()).filter(
                        (b) => b.studentId === where.studentId
                    );
                },
                upsert: async ({
                    where,
                    create,
                    update,
                }: {
                    where: { studentId_levelId: { studentId: string; levelId: string } };
                    create: { studentId: string; levelId: string; balance: number };
                    update: { balance: { increment: number } };
                }) => {
                    const s = getStore();
                    const key = `${where.studentId_levelId.studentId}:${where.studentId_levelId.levelId}`;
                    let row = s.levelStBalances.get(key);
                    if (!row) {
                        row = { id: this.nextId("lsb"), ...create };
                        s.levelStBalances.set(key, row);
                    } else {
                        row.balance += update.balance.increment;
                    }
                    return { ...row };
                },
            },
            sessionFeedback: {
                findUnique: async ({
                    where,
                }: {
                    where: { sessionId_studentId: { sessionId: string; studentId: string } };
                }) => {
                    const key = `${where.sessionId_studentId.sessionId}:${where.sessionId_studentId.studentId}`;
                    return getStore().sessionFeedbacks.get(key) ?? null;
                },
            },
            week: {
                findUnique: async ({ where }: { where: { id: string } }) => {
                    const s = getStore();
                    const w = s.weeks.get(where.id);
                    if (!w) return null;
                    const group = s.groups.get(w.groupId)!;
                    const tasks = Array.from(s.tasks.values())
                        .filter((t) => t.weekId === w.id)
                        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                    return { ...w, group, tasks };
                },
                findUniqueOrThrow: async ({
                    where,
                }: {
                    where: { id: string };
                }) => {
                    const s = getStore();
                    const w = s.weeks.get(where.id);
                    if (!w) throw new Error("Week not found");
                    const group = s.groups.get(w.groupId)!;
                    const tasks = Array.from(s.tasks.values())
                        .filter((t) => t.weekId === w.id && t.type === "INTERNAL")
                        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                    return { ...w, group, tasks };
                },
            },
            task: {
                findUnique: async ({ where }: { where: { id: string } }) => {
                    const t = getStore().tasks.get(where.id);
                    return t ? hydrateTask(t) : null;
                },
                findMany: async ({ where }: { where: { weekId?: string; type?: string } }) => {
                    return Array.from(getStore().tasks.values())
                        .filter(
                            (t) =>
                                (!where.weekId || t.weekId === where.weekId) &&
                                (!where.type || t.type === where.type)
                        )
                        .map(hydrateTask);
                },
            },
            weekResourceSubmission: {
                findUnique: async ({
                    where,
                }: {
                    where: { studentId_weekId: { studentId: string; weekId: string } };
                }) => {
                    const key = `${where.studentId_weekId.studentId}:${where.studentId_weekId.weekId}`;
                    return getStore().weekResources.get(key) ?? null;
                },
                update: async ({
                    where,
                    data,
                }: {
                    where: { studentId_weekId: { studentId: string; weekId: string } };
                    data: Record<string, unknown>;
                }) => {
                    const key = `${where.studentId_weekId.studentId}:${where.studentId_weekId.weekId}`;
                    const row = getStore().weekResources.get(key);
                    if (!row) throw new Error("Resource not found");
                    Object.assign(row, data);
                    return { ...row };
                },
                upsert: async ({
                    where,
                    create,
                    update,
                }: {
                    where: { studentId_weekId: { studentId: string; weekId: string } };
                    create: Record<string, unknown>;
                    update: Record<string, unknown>;
                }) => {
                    const s = getStore();
                    const key = `${where.studentId_weekId.studentId}:${where.studentId_weekId.weekId}`;
                    let row = s.weekResources.get(key);
                    if (!row) {
                        row = {
                            id: this.nextId("wrs"),
                            studentId: where.studentId_weekId.studentId,
                            weekId: where.studentId_weekId.weekId,
                            type: null,
                            fileUrl: null,
                            driveUrl: null,
                            status: "PENDING",
                            submittedAt: null,
                            lockedAt: null,
                            ...create,
                        };
                        s.weekResources.set(key, row);
                    } else {
                        Object.assign(row, update);
                    }
                    return { ...row };
                },
            },
            submission: {
                findUnique: async ({
                    where,
                }: {
                    where: { id?: string; studentId_taskId?: { studentId: string; taskId: string } };
                }) => {
                    const s = getStore();
                    let row = null;
                    if (where.id) {
                        row = s.submissions.get(where.id) ?? null;
                    } else if (where.studentId_taskId) {
                        row =
                            Array.from(s.submissions.values()).find(
                                (r) =>
                                    r.studentId === where.studentId_taskId!.studentId &&
                                    r.taskId === where.studentId_taskId!.taskId
                            ) ?? null;
                    }
                    return row ? hydrateSubmission(row) : null;
                },
                findUniqueOrThrow: async (args: { where: { id?: string; studentId_taskId?: { studentId: string; taskId: string } } }) => {
                    const res = await client.submission.findUnique(args);
                    if (!res) throw new Error("Submission not found");
                    return res;
                },
                findMany: async ({ where }: { where?: Record<string, unknown> }) => {
                    return Array.from(getStore().submissions.values())
                        .filter((r) => matchSubmissionWhere(r, where))
                        .map(hydrateSubmission);
                },
                upsert: async ({
                    where,
                    create,
                    update,
                }: {
                    where: { studentId_taskId: { studentId: string; taskId: string } };
                    create: Record<string, unknown>;
                    update: Record<string, unknown>;
                }) => {
                    const s = getStore();
                    this.submissionWriteCount++;
                    const existing = Array.from(s.submissions.values()).find(
                        (r) =>
                            r.studentId === where.studentId_taskId.studentId &&
                            r.taskId === where.studentId_taskId.taskId
                    );
                    if (!existing) {
                        const now = this.currentClock();
                        const row = {
                            id: this.nextId("sub"),
                            studentId: where.studentId_taskId.studentId,
                            taskId: where.studentId_taskId.taskId,
                            mode: create.mode as "FILE" | "LINK" | "TEXT" | "EXTERNAL",
                            fileUrl: (create.fileUrl as string | null) ?? null,
                            externalLink: (create.externalLink as string | null) ?? null,
                            textContent: (create.textContent as string | null) ?? null,
                            status: (create.status as "DRAFT" | "SUBMITTED") ?? "SUBMITTED",
                            submittedAt: new Date(now.getTime()),
                            lastSavedAt: (create.lastSavedAt as Date | null) ?? null,
                            isLocked: (create.isLocked as boolean) ?? false,
                            activityVersion: (create.activityVersion as number) ?? 0,
                            understandingScore: null,
                            approachScore: null,
                            correctnessScore: null,
                            implementationScore: null,
                            instructorComment: null,
                            gradedAt: null,
                            gradedBy: null,
                            createdAt: new Date(now.getTime()),
                        };
                        s.submissions.set(row.id, row);
                        return hydrateSubmission(row);
                    }
                    // Simulate Prisma @updatedAt changing submittedAt on every update
                    if (Object.keys(update).length > 0) {
                        existing.submittedAt = new Date(this.currentClock().getTime() + 999);
                    }
                    for (const [k, v] of Object.entries(update)) {
                        if (v === undefined) continue;
                        if (k === "activityVersion" && typeof v === "object" && v !== null && "increment" in v) {
                            existing.activityVersion += (v as { increment: number }).increment;
                        } else {
                            (existing as Record<string, unknown>)[k] = v;
                        }
                    }
                    return hydrateSubmission(existing);
                },
                update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
                    this.submissionWriteCount++;
                    const row = getStore().submissions.get(where.id);
                    if (!row) throw new Error("Submission not found");
                    // Simulate Prisma @updatedAt changing submittedAt on every update
                    row.submittedAt = new Date(this.currentClock().getTime() + 1234);
                    for (const [k, v] of Object.entries(data)) {
                        if (v !== undefined) {
                            (row as Record<string, unknown>)[k] = v;
                        }
                    }
                    return hydrateSubmission(row);
                },
                updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
                    let count = 0;
                    for (const row of getStore().submissions.values()) {
                        if (matchSubmissionWhere(row, where)) {
                            this.submissionWriteCount++;
                            count++;
                            // Simulate Prisma @updatedAt changing submittedAt on updateMany too
                            row.submittedAt = new Date(this.currentClock().getTime() + 2345);
                            for (const [k, v] of Object.entries(data)) {
                                if (v !== undefined) {
                                    (row as Record<string, unknown>)[k] = v;
                                }
                            }
                        }
                    }
                    return { count };
                },
            },
            taskGrade: {
                findFirst: async ({ where }: { where: Record<string, unknown> }) => {
                    const s = getStore();
                    for (const tg of s.taskGrades.values()) {
                        if (where.finalizedAt && typeof where.finalizedAt === "object" && "not" in where.finalizedAt) {
                            if (tg.finalizedAt === null) continue;
                        }
                        if (where.submission && typeof where.submission === "object") {
                            const sub = s.submissions.get(tg.submissionId);
                            if (!sub) continue;
                            const sw = where.submission as { studentId?: string; task?: { weekId?: string } };
                            if (sw.studentId && sub.studentId !== sw.studentId) continue;
                            if (sw.task?.weekId && s.tasks.get(sub.taskId)?.weekId !== sw.task.weekId) continue;
                        }
                        return hydrateTaskGrade(tg);
                    }
                    return null;
                },
                findMany: async ({ where }: { where: Record<string, unknown> }) => {
                    const s = getStore();
                    const out = [];
                    for (const tg of s.taskGrades.values()) {
                        if (where.finalizedAt && typeof where.finalizedAt === "object" && "not" in where.finalizedAt) {
                            if (tg.finalizedAt === null) continue;
                        }
                        if (where.markedInvalid !== undefined && tg.markedInvalid !== where.markedInvalid) continue;
                        if (where.submission && typeof where.submission === "object") {
                            const sub = s.submissions.get(tg.submissionId);
                            if (!sub) continue;
                            const sw = where.submission as { studentId?: string; task?: { weekId?: string } };
                            if (sw.studentId && sub.studentId !== sw.studentId) continue;
                            if (sw.task?.weekId && s.tasks.get(sub.taskId)?.weekId !== sw.task.weekId) continue;
                        }
                        out.push(hydrateTaskGrade(tg));
                    }
                    return out;
                },
                upsert: async ({
                    where,
                    create,
                    update,
                }: {
                    where: { submissionId: string };
                    create: Record<string, unknown>;
                    update: Record<string, unknown>;
                }) => {
                    const s = getStore();
                    let row = Array.from(s.taskGrades.values()).find(
                        (g) => g.submissionId === where.submissionId
                    );
                    if (!row) {
                        row = {
                            id: this.nextId("tg"),
                            submissionId: where.submissionId,
                            gradedBy: create.gradedBy as string,
                            totalPoints: (create.totalPoints as number | null) ?? null,
                            finalizedAt: (create.finalizedAt as Date | null) ?? null,
                            markedInvalid: Boolean(create.markedInvalid),
                        };
                        s.taskGrades.set(row.id, row);
                    } else {
                        Object.assign(row, update);
                    }
                    return hydrateTaskGrade(row);
                },
                update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
                    const row = getStore().taskGrades.get(where.id);
                    if (!row) throw new Error("TaskGrade not found");
                    for (const [k, v] of Object.entries(data)) {
                        if (k === "totalPoints" && typeof v === "object" && v !== null && "increment" in v) {
                            row.totalPoints = (row.totalPoints ?? 0) + (v as { increment: number }).increment;
                        } else if (v !== undefined) {
                            (row as Record<string, unknown>)[k] = v;
                        }
                    }
                    return hydrateTaskGrade(row);
                },
            },
            taskGradeField: {
                deleteMany: async ({ where }: { where: { taskGradeId: string } }) => {
                    const s = getStore();
                    let count = 0;
                    for (const [k, v] of s.taskGradeFields.entries()) {
                        if (v.taskGradeId === where.taskGradeId) {
                            s.taskGradeFields.delete(k);
                            count++;
                        }
                    }
                    return { count };
                },
                createMany: async ({
                    data,
                }: {
                    data: { taskGradeId: string; rubricFieldId: string; awardedPoints: number }[];
                }) => {
                    const s = getStore();
                    for (const item of data) {
                        const row = { id: this.nextId("tgf"), ...item };
                        s.taskGradeFields.set(row.id, row);
                    }
                    return { count: data.length };
                },
            },
            sTTransaction: {
                findFirst: async ({ where }: { where: Record<string, unknown> }) => {
                    const matches = await client.sTTransaction.findMany({ where });
                    return matches[0] ?? null;
                },
                findMany: async ({ where }: { where: Record<string, unknown> }) => {
                    const s = getStore();
                    return Array.from(s.stTransactions.values())
                        .filter((tx) => {
                            if (where.studentId && tx.studentId !== where.studentId) return false;
                            if (where.weekId && tx.weekId !== where.weekId) return false;
                            if (where.type && tx.type !== where.type) return false;
                            if (where.reason && typeof where.reason === "string" && tx.reason !== where.reason) return false;
                            if (where.reason && typeof where.reason === "object" && "in" in where.reason) {
                                if (!(where.reason as { in: string[] }).in.includes(tx.reason)) return false;
                            }
                            if (where.relatedEntityId && typeof where.relatedEntityId === "string" && tx.relatedEntityId !== where.relatedEntityId) {
                                return false;
                            }
                            if (where.relatedEntityId && typeof where.relatedEntityId === "object" && "in" in where.relatedEntityId) {
                                if (!tx.relatedEntityId || !(where.relatedEntityId as { in: string[] }).in.includes(tx.relatedEntityId)) {
                                    return false;
                                }
                            }
                            return true;
                        })
                        .map((tx) => ({
                            ...tx,
                            student: s.students.get(tx.studentId)!,
                        }));
                },
                create: async ({ data }: { data: Record<string, unknown> }) => {
                    const s = getStore();
                    const idem = (data.idempotencyKey as string | null) ?? null;
                    if (idem !== null) {
                        for (const existing of s.stTransactions.values()) {
                            if (existing.idempotencyKey === idem) {
                                throw new Error(`Unique constraint failed on idempotencyKey: ${idem}`);
                            }
                        }
                    }
                    const row = {
                        id: this.nextId("stx"),
                        studentId: data.studentId as string,
                        levelId: (data.levelId as string | null) ?? null,
                        weekId: (data.weekId as string | null) ?? null,
                        type: data.type as "REWARD" | "PENALTY",
                        reason: data.reason as string,
                        amount: data.amount as number,
                        relatedEntityId: (data.relatedEntityId as string | null) ?? null,
                        levelStBalance: (data.levelStBalance as number | null) ?? null,
                        avgStBalance: (data.avgStBalance as number | null) ?? null,
                        beginnerStBalance: (data.beginnerStBalance as number | null) ?? null,
                        wasHalvedDueToLateResource: Boolean(data.wasHalvedDueToLateResource),
                        actorId: (data.actorId as string | null) ?? null,
                        note: (data.note as string | null) ?? null,
                        idempotencyKey: idem,
                        createdAt: new Date(this.currentClock().getTime()),
                    };
                    s.stTransactions.set(row.id, row);
                    return { ...row };
                },
            },
        };
        return client;
    }

    get client(): PrismaClient {
        const base = this.buildClient(() => this.store);
        return {
            ...base,
            $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
                // Serialize interactive transactions like PostgreSQL row locks + rollback on error
                let result!: T;
                const run = this.txQueue.then(async () => {
                    const snapshot = cloneStore(this.store);
                    const txClient = this.buildClient(() => snapshot);
                    result = await fn(txClient);
                    this.store = snapshot;
                });
                this.txQueue = run.then(
                    () => undefined,
                    () => undefined
                );
                await run;
                return result;
            },
        } as unknown as PrismaClient;
    }
}

// ============================================================================
// Test Runner
// ============================================================================

async function runTests() {
    console.log("🚀 Starting Unified First Solver Test Suite...\n");

    // ------------------------------------------------------------------------
    // 1. Pure Change Comparison & Tie-Breaking
    // ------------------------------------------------------------------------
    console.log("1. Testing solution comparison & deterministic tie-breaking...");
    assert.strictEqual(
        hasSubmissionSolutionChanged(null, {
            mode: "TEXT",
            fileUrl: null,
            externalLink: null,
            textContent: "hello",
        }),
        true,
        "First save must count as a meaningful change"
    );

    assert.strictEqual(
        hasSubmissionSolutionChanged(
            { mode: "TEXT", fileUrl: null, externalLink: null, textContent: "line1\r\nline2  " },
            { mode: "TEXT", fileUrl: null, externalLink: null, textContent: "  line1\nline2" }
        ),
        false,
        "Whitespace/CRLF differences alone must NOT count as a meaningful TEXT change"
    );

    assert.strictEqual(
        hasSubmissionSolutionChanged(
            { mode: "LINK", fileUrl: null, externalLink: "https://github.com/a/b", textContent: null },
            { mode: "LINK", fileUrl: null, externalLink: " https://github.com/a/b ", textContent: null }
        ),
        false,
        "Surrounding whitespace in LINK must NOT count as a meaningful change"
    );

    assert.strictEqual(
        hasSubmissionSolutionChanged(
            { mode: "FILE", fileUrl: "t1/s1/submission-abc.pdf", externalLink: null, textContent: null },
            { mode: "FILE", fileUrl: "t1/s1/submission-abc.pdf", externalLink: null, textContent: null }
        ),
        false,
        "Identical FILE url must NOT count as a solution change for lastSavedAt"
    );

    assert.strictEqual(
        isMeaningfulSubmissionChange(
            { mode: "FILE", fileUrl: "t1/s1/submission-abc.pdf", externalLink: null, textContent: null },
            { mode: "FILE", fileUrl: "t1/s1/submission-abc.pdf", externalLink: null, textContent: null }
        ),
        true,
        "Existing activityVersion behavior for FILE must be preserved"
    );

    assert.strictEqual(
        hasSubmissionSolutionChanged(
            { mode: "FILE", fileUrl: "t1/s1/submission-abc.pdf", externalLink: null, textContent: null },
            { mode: "FILE", fileUrl: "t1/s1/submission-def.pdf", externalLink: null, textContent: null }
        ),
        true,
        "Different FILE url must count as a meaningful change"
    );

    assert.strictEqual(
        hasSubmissionSolutionChanged(
            { mode: "TEXT", fileUrl: null, externalLink: null, textContent: "https://a.com" },
            { mode: "LINK", fileUrl: null, externalLink: "https://a.com", textContent: null }
        ),
        true,
        "Switching submission mode must count as a meaningful change"
    );

    // Tie-breaking check: same lastSavedAt -> createdAt ASC -> id ASC
    const tSame = new Date("2026-11-01T10:00:00Z");
    const tieWinner = compareFirstSolverCandidates(
        { lastSavedAt: tSame, createdAt: new Date("2026-11-01T08:00:00Z"), id: "sub-b" },
        { lastSavedAt: tSame, createdAt: new Date("2026-11-01T09:00:00Z"), id: "sub-a" }
    );
    assert.ok(tieWinner < 0, "Earlier createdAt must break ties when lastSavedAt matches");

    const idTie = compareFirstSolverCandidates(
        { lastSavedAt: tSame, createdAt: tSame, id: "sub-a" },
        { lastSavedAt: tSame, createdAt: tSame, id: "sub-b" }
    );
    assert.ok(idTie < 0, "Deterministic ID must break ties when lastSavedAt and createdAt match");
    console.log("✔ Pure comparison and tie-breaking verified.");

    // ------------------------------------------------------------------------
    // 2. BEGINNER Save Behavior, Manual Lock, Auto-Submit, Ranking & Finalize
    // ------------------------------------------------------------------------
    console.log("2. Testing BEGINNER lifecycle (save, unchanged save, lock, auto-submit, invalid replacement, halving, idempotency)...");
    let currentTime = new Date("2026-11-01T10:00:00Z");
    const db = new InMemoryPrisma(() => currentTime);
    const prisma = db.client;
    const nowFn = () => currentTime;

    const weekStart = new Date("2026-11-01T09:00:00Z");
    const weekEnd = new Date("2026-11-08T23:59:00Z");

    db.store.groups.set("grp-beg", { id: "grp-beg", type: "BEGINNER" });
    db.store.instructorGroups.set("inst-1:grp-beg", { instructorId: "inst-1", groupId: "grp-beg" });
    db.store.weeks.set("week-1", { id: "week-1", groupId: "grp-beg", startDate: weekStart, endDate: weekEnd });

    db.store.students.set("stu-1", { id: "stu-1", name: "Alice", groupId: "grp-beg", avgSt: 50, beginnerSt: 50 });
    db.store.students.set("stu-2", { id: "stu-2", name: "Bob", groupId: "grp-beg", avgSt: 50, beginnerSt: 50 });
    db.store.students.set("stu-3", { id: "stu-3", name: "Charlie", groupId: "grp-beg", avgSt: 50, beginnerSt: 50 });

    db.store.tasks.set("btask-1", {
        id: "btask-1",
        title: "Beginner Task 1",
        type: "INTERNAL",
        deadline: weekEnd,
        isBonus: false,
        weekId: "week-1",
        sessionId: null,
        allowedSubmissionMode: null,
        createdAt: weekStart,
    });
    db.store.tasks.set("btask-2", {
        id: "btask-2",
        title: "Beginner Task 2",
        type: "INTERNAL",
        deadline: weekEnd,
        isBonus: true,
        weekId: "week-1",
        sessionId: null,
        allowedSubmissionMode: null,
        createdAt: new Date(weekStart.getTime() + 1000),
    });
    db.store.rubricFields.set("rf-b1", { id: "rf-b1", taskId: "btask-1", fieldName: "Correctness", maxPoints: 15, order: 1 });
    db.store.rubricFields.set("rf-b2", { id: "rf-b2", taskId: "btask-2", fieldName: "Correctness", maxPoints: 15, order: 1 });

    // Legacy record (null lastSavedAt) on a separate task to verify legacy handling
    db.store.tasks.set("btask-legacy", {
        id: "btask-legacy",
        title: "Legacy Task",
        type: "INTERNAL",
        deadline: weekEnd,
        isBonus: false,
        weekId: "week-1",
        sessionId: null,
        allowedSubmissionMode: null,
        createdAt: new Date(weekStart.getTime() + 2000),
    });
    db.store.rubricFields.set("rf-leg", { id: "rf-leg", taskId: "btask-legacy", fieldName: "Correctness", maxPoints: 15, order: 1 });
    db.store.submissions.set("sub-legacy", {
        id: "sub-legacy",
        studentId: "stu-1",
        taskId: "btask-legacy",
        mode: "TEXT",
        fileUrl: null,
        externalLink: null,
        textContent: "old legacy answer",
        status: "DRAFT",
        submittedAt: new Date("2026-11-01T09:10:00Z"),
        lastSavedAt: null,
        isLocked: false,
        activityVersion: 0,
        understandingScore: null,
        approachScore: null,
        correctnessScore: null,
        implementationScore: null,
        instructorComment: null,
        gradedAt: null,
        gradedBy: null,
        createdAt: new Date("2026-11-01T09:10:00Z"),
    });

    // Unchanged save on legacy record must keep lastSavedAt = null and do zero writes
    currentTime = new Date("2026-11-01T10:01:00Z");
    const writesBeforeLegacyNoop = db.submissionWriteCount;
    const legacyNoop = await saveDraftSubmission(
        { studentId: "stu-1", taskId: "btask-legacy", mode: "TEXT", textContent: "old legacy answer\r\n" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(legacyNoop.lastSavedAt, null, "Unchanged save on legacy row must keep lastSavedAt null");
    assert.strictEqual(db.submissionWriteCount, writesBeforeLegacyNoop, "Unchanged legacy save must avoid DB writes");

    // stu-2 (Bob) saves Task 1 first at 10:05 (will NOT manually lock -> auto-submit!)
    currentTime = new Date("2026-11-01T10:05:00Z");
    const bobSave1 = await saveDraftSubmission(
        { studentId: "stu-2", taskId: "btask-1", mode: "TEXT", textContent: "bob v1" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(bobSave1.lastSavedAt?.toISOString(), "2026-11-01T10:05:00.000Z");

    // stu-1 (Alice) saves Task 1 at 10:10, and saves Task 2 at 10:12 (independent timestamps!)
    currentTime = new Date("2026-11-01T10:10:00Z");
    const aliceT1Save1 = await saveDraftSubmission(
        { studentId: "stu-1", taskId: "btask-1", mode: "LINK", externalLink: "https://example.com/alice1" },
        { prisma, now: nowFn }
    );
    currentTime = new Date("2026-11-01T10:12:00Z");
    const aliceT2Save1 = await saveDraftSubmission(
        { studentId: "stu-1", taskId: "btask-2", mode: "FILE", fileUrl: "btask-2/stu-1/submission-111.pdf" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(aliceT1Save1.lastSavedAt?.toISOString(), "2026-11-01T10:10:00.000Z");
    assert.strictEqual(aliceT2Save1.lastSavedAt?.toISOString(), "2026-11-01T10:12:00.000Z");

    // Alice saves btask-legacy meaningfully at 10:13 -> now gets lastSavedAt = 10:13
    currentTime = new Date("2026-11-01T10:13:00Z");
    await saveDraftSubmission(
        { studentId: "stu-1", taskId: "btask-legacy", mode: "TEXT", textContent: "updated legacy answer" },
        { prisma, now: nowFn }
    );

    // Bob re-saves identical Task 1 at 10:15 -> lastSavedAt MUST stay 10:05!
    currentTime = new Date("2026-11-01T10:15:00Z");
    const writesBeforeNoop = db.submissionWriteCount;
    const bobNoop = await saveDraftSubmission(
        { studentId: "stu-2", taskId: "btask-1", mode: "TEXT", textContent: "  bob v1 \n" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(db.submissionWriteCount, writesBeforeNoop, "Repeated identical save must skip DB write");
    assert.strictEqual(bobNoop.lastSavedAt?.toISOString(), "2026-11-01T10:05:00.000Z");

    // Charlie (stu-3) saves Task 1 at 10:20 and Task 2 at 10:04 (earliest on Task 2!)
    currentTime = new Date("2026-11-01T10:04:00Z");
    await saveDraftSubmission(
        { studentId: "stu-3", taskId: "btask-2", mode: "TEXT", textContent: "charlie t2" },
        { prisma, now: nowFn }
    );
    currentTime = new Date("2026-11-01T10:20:00Z");
    await saveDraftSubmission(
        { studentId: "stu-3", taskId: "btask-1", mode: "TEXT", textContent: "charlie t1" },
        { prisma, now: nowFn }
    );

    // Alice uploads deliverable and manually locks at 10:30 -> MUST NOT change lastSavedAt!
    db.store.weekResources.set("stu-1:week-1", {
        id: "wrs-1",
        studentId: "stu-1",
        weekId: "week-1",
        type: "FILE",
        fileUrl: "week-resources/week-1/stu-1/resource.pdf",
        driveUrl: null,
        status: "ACCEPTED",
        submittedAt: new Date("2026-11-01T10:25:00Z"),
        lockedAt: null,
    });
    currentTime = new Date("2026-11-01T10:30:00Z");
    await lockWeek({ studentId: "stu-1", weekId: "week-1" }, { prisma, now: nowFn });
    const aliceAfterLock = await prisma.submission.findUniqueOrThrow({
        where: { studentId_taskId: { studentId: "stu-1", taskId: "btask-1" } },
    });
    assert.strictEqual(aliceAfterLock.status, "SUBMITTED");
    assert.strictEqual(
        aliceAfterLock.lastSavedAt?.toISOString(),
        "2026-11-01T10:10:00.000Z",
        "Manual Week Lock must NOT overwrite lastSavedAt (even though submittedAt bumped)"
    );
    assert.notStrictEqual(
        aliceAfterLock.submittedAt.toISOString(),
        aliceAfterLock.lastSavedAt?.toISOString(),
        "Proves submittedAt drifted via @updatedAt while lastSavedAt stayed accurate"
    );

    // Before weekEnd: First Solver must be PENDING_CLOSE, and finalize with firstSolverTaskIds must reject
    currentTime = new Date("2026-11-02T12:00:00Z");
    const pendingSuggestions = await suggestFirstSolvers({ weekId: "week-1" }, { prisma, now: nowFn });
    assert.strictEqual(pendingSuggestions[0].status, "PENDING_CLOSE");
    assert.strictEqual(pendingSuggestions[0].suggestedStudentId, null);

    await assert.rejects(
        () =>
            finalizeWeekGrading(
                {
                    studentId: "stu-1",
                    weekId: "week-1",
                    gradedBy: "inst-1",
                    firstSolverTaskIds: ["btask-1"],
                },
                { prisma, now: nowFn }
            ),
        /before the Week deadline/
    );

    // Now Bob changes his Task 1 solution at 14:00 (moving Bob behind Alice!)
    currentTime = new Date("2026-11-02T14:00:00Z");
    const bobSave2 = await saveDraftSubmission(
        { studentId: "stu-2", taskId: "btask-1", mode: "TEXT", textContent: "bob v2 fixed" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(bobSave2.lastSavedAt?.toISOString(), "2026-11-02T14:00:00.000Z");

    // Advance past weekEnd (auto-submit for Bob & Charlie who never manually locked)
    currentTime = new Date("2026-11-09T00:01:00Z");

    // Verify saves are now blocked past deadline
    await assert.rejects(
        () =>
            saveDraftSubmission(
                { studentId: "stu-2", taskId: "btask-1", mode: "TEXT", textContent: "late edit" },
                { prisma, now: nowFn }
            ),
        /ended/
    );

    // Check suggestions right after Week closes:
    // btask-1: Alice (10:10) < Charlie (10:20) < Bob (Nov 2 14:00)
    // btask-2: Charlie (10:04, NOT manually locked!) < Alice (10:12, manually locked!)
    let suggestions = await suggestFirstSolvers({ weekId: "week-1" }, { prisma, now: nowFn });
    const sB1 = suggestions.find((s) => s.taskId === "btask-1")!;
    const sB2 = suggestions.find((s) => s.taskId === "btask-2")!;
    assert.strictEqual(sB1.suggestedStudentId, "stu-1", "Alice is earliest on btask-1");
    assert.strictEqual(
        sB2.suggestedStudentId,
        "stu-3",
        "Charlie (auto-submitted draft without manual lock) must NOT be excluded and beats Alice on btask-2!"
    );

    // Instructor saves draft grade for Alice on btask-1 (marking Alice INVALID!) + comment
    const aliceSub1 = await prisma.submission.findUniqueOrThrow({
        where: { studentId_taskId: { studentId: "stu-1", taskId: "btask-1" } },
    });
    await saveDraftGrade(
        {
            submissionId: aliceSub1.id,
            gradedBy: "inst-1",
            fieldScores: [{ rubricFieldId: "rf-b1", awardedPoints: 0 }],
            markedInvalid: true,
            instructorComment: "Invalid copy",
        },
        { prisma }
    );

    // lastSavedAt untouched by saveDraftGrade
    const aliceSub1AfterDraft = await prisma.submission.findUniqueOrThrow({
        where: { id: aliceSub1.id },
    });
    assert.strictEqual(
        aliceSub1AfterDraft.lastSavedAt?.toISOString(),
        "2026-11-01T10:10:00.000Z",
        "Instructor draft grading must NOT overwrite lastSavedAt"
    );

    // Now btask-1 must automatically suggest Charlie (stu-3) instead of invalid Alice!
    suggestions = await suggestFirstSolvers({ weekId: "week-1" }, { prisma, now: nowFn });
    assert.strictEqual(
        suggestions.find((s) => s.taskId === "btask-1")!.suggestedStudentId,
        "stu-3",
        "Invalidating Alice must automatically suggest Charlie (2nd earliest)"
    );
    assert.strictEqual(suggestions.find((s) => s.taskId === "btask-1")!.excludedInvalidCount, 1);

    // Mark Charlie invalid on btask-1 too -> consecutive invalid candidates -> suggests Bob!
    const charlieSub1 = await prisma.submission.findUniqueOrThrow({
        where: { studentId_taskId: { studentId: "stu-3", taskId: "btask-1" } },
    });
    await saveDraftGrade(
        {
            submissionId: charlieSub1.id,
            gradedBy: "inst-1",
            fieldScores: [{ rubricFieldId: "rf-b1", awardedPoints: 0 }],
            markedInvalid: true,
        },
        { prisma }
    );
    suggestions = await suggestFirstSolvers({ weekId: "week-1" }, { prisma, now: nowFn });
    assert.strictEqual(
        suggestions.find((s) => s.taskId === "btask-1")!.suggestedStudentId,
        "stu-2",
        "Multiple consecutive invalid candidates must fall back to Bob (3rd earliest)"
    );

    // Mark Bob invalid on btask-1 too -> NO_CANDIDATE
    const bobSub1 = await prisma.submission.findUniqueOrThrow({
        where: { studentId_taskId: { studentId: "stu-2", taskId: "btask-1" } },
    });
    await saveDraftGrade(
        {
            submissionId: bobSub1.id,
            gradedBy: "inst-1",
            fieldScores: [{ rubricFieldId: "rf-b1", awardedPoints: 0 }],
            markedInvalid: true,
        },
        { prisma }
    );
    suggestions = await suggestFirstSolvers({ weekId: "week-1" }, { prisma, now: nowFn });
    assert.strictEqual(suggestions.find((s) => s.taskId === "btask-1")!.status, "NO_CANDIDATE");
    assert.strictEqual(suggestions.find((s) => s.taskId === "btask-1")!.suggestedStudentId, null);

    // Restore Bob valid on btask-1 so Bob is valid earliest on btask-1; also test post-finalization confirmation:
    // Suppose Alice is finalized FIRST on btask-2 while Charlie isn't reviewed yet (Alice doesn't get btask-2 yet).
    await saveDraftGrade(
        {
            submissionId: bobSub1.id,
            gradedBy: "inst-1",
            fieldScores: [{ rubricFieldId: "rf-b1", awardedPoints: 12 }],
            markedInvalid: false,
        },
        { prisma }
    );
    const aliceSub2 = await prisma.submission.findUniqueOrThrow({
        where: { studentId_taskId: { studentId: "stu-1", taskId: "btask-2" } },
    });
    await saveDraftGrade(
        {
            submissionId: aliceSub2.id,
            gradedBy: "inst-1",
            fieldScores: [{ rubricFieldId: "rf-b2", awardedPoints: 15 }],
            markedInvalid: false,
        },
        { prisma }
    );

    // Finalizing Alice with btask-1 (invalid!) must reject
    await assert.rejects(
        () =>
            finalizeWeekGrading(
                {
                    studentId: "stu-1",
                    weekId: "week-1",
                    gradedBy: "inst-1",
                    firstSolverTaskIds: ["btask-1"],
                },
                { prisma, now: nowFn }
            ),
        /not eligible/
    );

    // Finalize Alice properly with [] firstSolverTaskIds
    const aliceFinalize = await finalizeWeekGrading(
        {
            studentId: "stu-1",
            weekId: "week-1",
            gradedBy: "inst-1",
            firstSolverTaskIds: [],
        },
        { prisma, now: nowFn }
    );
    assert.strictEqual(aliceFinalize.wasHalvedDueToLateResource, false);

    // Repeated finalizeWeekGrading must throw and NOT duplicate ST!
    const aliceStBeforeRetry = db.store.students.get("stu-1")!.beginnerSt;
    await assert.rejects(
        () =>
            finalizeWeekGrading(
                {
                    studentId: "stu-1",
                    weekId: "week-1",
                    gradedBy: "inst-1",
                    firstSolverTaskIds: [],
                },
                { prisma, now: nowFn }
            ),
        /already been finalized/
    );
    assert.strictEqual(db.store.students.get("stu-1")!.beginnerSt, aliceStBeforeRetry);

    // Now Instructor marks Charlie invalid on btask-2 -> Alice (already finalized!) becomes the suggested First Solver!
    const charlieSub2 = await prisma.submission.findUniqueOrThrow({
        where: { studentId_taskId: { studentId: "stu-3", taskId: "btask-2" } },
    });
    await saveDraftGrade(
        {
            submissionId: charlieSub2.id,
            gradedBy: "inst-1",
            fieldScores: [{ rubricFieldId: "rf-b2", awardedPoints: 0 }],
            markedInvalid: true,
        },
        { prisma }
    );
    suggestions = await suggestFirstSolvers({ weekId: "week-1" }, { prisma, now: nowFn });
    assert.strictEqual(suggestions.find((s) => s.taskId === "btask-2")!.suggestedStudentId, "stu-1");

    // Confirm Alice post-finalization for btask-2; retry must be idempotent; another student must fail
    const confirmAlice = await confirmTaskFirstSolver(
        { taskId: "btask-2", studentId: "stu-1", confirmedBy: "inst-1" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(confirmAlice.awardedAmount, 5);
    assert.strictEqual(db.store.students.get("stu-1")!.beginnerSt, aliceStBeforeRetry! + 5);

    const confirmRetry = await confirmTaskFirstSolver(
        { taskId: "btask-2", studentId: "stu-1", confirmedBy: "inst-1" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(confirmRetry.awardedAmount, 0, "Retry must not duplicate ST");
    assert.strictEqual(db.store.students.get("stu-1")!.beginnerSt, aliceStBeforeRetry! + 5);

    // Confirm Bob on btask-1 via finalizeWeekGrading (notice Bob never manually locked, resource missing -> halved!)
    const bobFinalize = await finalizeWeekGrading(
        {
            studentId: "stu-2",
            weekId: "week-1",
            gradedBy: "inst-1",
            firstSolverTaskIds: ["btask-1"],
        },
        { prisma, now: nowFn }
    );
    assert.strictEqual(bobFinalize.wasHalvedDueToLateResource, true);
    assert.strictEqual(
        bobFinalize.taskResults.find((r) => r.taskId === "btask-1")!.firstSolverPoints,
        5
    );
    const bobSub1Final = await prisma.submission.findUniqueOrThrow({ where: { id: bobSub1.id } });
    assert.strictEqual(
        bobSub1Final.lastSavedAt?.toISOString(),
        "2026-11-02T14:00:00.000Z",
        "Auto-submit during finalizeWeekGrading must NOT overwrite lastSavedAt"
    );

    const btask1Awards = Array.from(db.store.stTransactions.values()).filter(
        (t) => t.reason === "FIRST_SOLVER" && t.relatedEntityId === "btask-1"
    );
    assert.strictEqual(btask1Awards.length, 1, "Exactly one FIRST_SOLVER transaction per task");
    console.log("✔ BEGINNER lifecycle, auto-submit, invalid fallback, and halving verified.");

    // ------------------------------------------------------------------------
    // 3. INTERMEDIATE Lifecycle, Resubmissions, Deadline, Grading & Confirmation
    // ------------------------------------------------------------------------
    console.log("3. Testing INTERMEDIATE lifecycle (submit, changed/unchanged resubmit, deadline, grading, invalid fallback)...");
    db.store.groups.set("grp-int", { id: "grp-int", type: "INTERMEDIATE" });
    db.store.instructorGroups.set("inst-1:grp-int", { instructorId: "inst-1", groupId: "grp-int" });
    db.store.levels.set("lvl-1", { id: "lvl-1", groupId: "grp-int" });
    db.store.sessions.set("sess-1", { id: "sess-1", levelId: "lvl-1" });

    db.store.students.set("istu-1", { id: "istu-1", name: "Dina", groupId: "grp-int", avgSt: 50, beginnerSt: null });
    db.store.students.set("istu-2", { id: "istu-2", name: "Ehab", groupId: "grp-int", avgSt: 50, beginnerSt: null });
    db.store.students.set("istu-3", { id: "istu-3", name: "Farah", groupId: "grp-int", avgSt: 50, beginnerSt: null });
    for (const sid of ["istu-1", "istu-2", "istu-3"]) {
        db.store.levelStBalances.set(`${sid}:lvl-1`, { id: `lsb-${sid}`, studentId: sid, levelId: "lvl-1", balance: 50 });
        db.store.sessionFeedbacks.set(`sess-1:${sid}`, { id: `fb-${sid}`, sessionId: "sess-1", studentId: sid });
    }

    const intDeadline = new Date("2026-11-12T20:00:00Z");
    db.store.tasks.set("itask-1", {
        id: "itask-1",
        title: "Intermediate Task 1",
        type: "INTERNAL",
        deadline: intDeadline,
        isBonus: false,
        weekId: null,
        sessionId: "sess-1",
        allowedSubmissionMode: null,
        createdAt: new Date("2026-11-10T10:00:00Z"),
    });
    db.store.rubricFields.set("rf-i1", { id: "rf-i1", taskId: "itask-1", fieldName: "Score", maxPoints: 15, order: 1 });

    // Dina submits at 11:00, Ehab submits at 11:05, Farah submits at 11:10
    currentTime = new Date("2026-11-10T11:00:00Z");
    const dinaSub1 = await createOrUpdateSubmission(
        { studentId: "istu-1", taskId: "itask-1", mode: "TEXT", textContent: "dina v1" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(dinaSub1.lastSavedAt?.toISOString(), "2026-11-10T11:00:00.000Z");

    currentTime = new Date("2026-11-10T11:05:00Z");
    await createOrUpdateSubmission(
        { studentId: "istu-2", taskId: "itask-1", mode: "LINK", externalLink: "https://example.com/ehab" },
        { prisma, now: nowFn }
    );

    currentTime = new Date("2026-11-10T11:10:00Z");
    await createOrUpdateSubmission(
        { studentId: "istu-3", taskId: "itask-1", mode: "FILE", fileUrl: "itask-1/istu-3/submission-aaa.pdf" },
        { prisma, now: nowFn }
    );

    // Ehab resubmits identical link at 11:15 -> NO change!
    currentTime = new Date("2026-11-10T11:15:00Z");
    const writesBeforeIntNoop = db.submissionWriteCount;
    const ehabNoop = await createOrUpdateSubmission(
        { studentId: "istu-2", taskId: "itask-1", mode: "LINK", externalLink: "  https://example.com/ehab  " },
        { prisma, now: nowFn }
    );
    assert.strictEqual(db.submissionWriteCount, writesBeforeIntNoop);
    assert.strictEqual(ehabNoop.lastSavedAt?.toISOString(), "2026-11-10T11:05:00.000Z");

    // Dina changes her solution at 11:20 -> Dina drops from #1 to #3!
    currentTime = new Date("2026-11-10T11:20:00Z");
    const dinaSub2 = await createOrUpdateSubmission(
        { studentId: "istu-1", taskId: "itask-1", mode: "TEXT", textContent: "dina v2" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(dinaSub2.lastSavedAt?.toISOString(), "2026-11-10T11:20:00.000Z");

    // Before deadline: First Solver must be PENDING_CLOSE, and grading with isFirstSolver: true must throw
    await assert.rejects(
        () =>
            gradeSubmission(
                {
                    submissionId: ehabNoop.id,
                    fieldScores: [{ rubricFieldId: "rf-i1", awardedPoints: 15 }],
                    markedInvalid: false,
                    gradedBy: "inst-1",
                    isFirstSolver: true,
                },
                { prisma, now: nowFn }
            ),
        /before the task deadline/
    );

    // Ehab is graded VALID BEFORE deadline (without isFirstSolver) -> lastSavedAt untouched
    await gradeSubmission(
        {
            submissionId: ehabNoop.id,
            fieldScores: [{ rubricFieldId: "rf-i1", awardedPoints: 14 }],
            markedInvalid: false,
            gradedBy: "inst-1",
            isFirstSolver: false,
        },
        { prisma, now: nowFn }
    );
    const ehabAfterGrade = await prisma.submission.findUniqueOrThrow({ where: { id: ehabNoop.id } });
    assert.strictEqual(
        ehabAfterGrade.lastSavedAt?.toISOString(),
        "2026-11-10T11:05:00.000Z",
        "Instructor grading must NOT overwrite lastSavedAt"
    );

    // Advance past Intermediate task deadline
    currentTime = new Date("2026-11-12T20:05:00Z");

    // Resubmission past deadline rejected
    await assert.rejects(
        () =>
            createOrUpdateSubmission(
                { studentId: "istu-3", taskId: "itask-1", mode: "TEXT", textContent: "late" },
                { prisma, now: nowFn }
            ),
        /deadline for this Task has passed/
    );

    // Now ranking is: Ehab (11:05) < Farah (11:10) < Dina (11:20)
    let intSuggestions = await computeTaskFirstSolverSuggestions(prisma, {
        track: "INTERMEDIATE",
        groupId: "grp-int",
        tasks: [{ id: "itask-1", title: "Intermediate Task 1", type: "INTERNAL", closesAt: intDeadline }],
        now: currentTime,
    });
    assert.strictEqual(intSuggestions[0].status, "CANDIDATE");
    assert.strictEqual(intSuggestions[0].suggestedStudentId, "istu-2", "Ehab must be suggested #1");

    // Confirm Ehab (who was already graded valid before deadline!) via confirmTaskFirstSolver
    const confirmEhab = await confirmTaskFirstSolver(
        { taskId: "itask-1", studentId: "istu-2", confirmedBy: "inst-1" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(confirmEhab.awardedAmount, 5);
    assert.strictEqual(db.store.levelStBalances.get("istu-2:lvl-1")!.balance, 50 + 14 + 5);

    // Trying to grade Farah with isFirstSolver: true now must be rejected (already awarded to Ehab)
    const farahSub = await prisma.submission.findUniqueOrThrow({
        where: { studentId_taskId: { studentId: "istu-3", taskId: "itask-1" } },
    });
    await assert.rejects(
        () =>
            gradeSubmission(
                {
                    submissionId: farahSub.id,
                    fieldScores: [{ rubricFieldId: "rf-i1", awardedPoints: 15 }],
                    markedInvalid: false,
                    gradedBy: "inst-1",
                    isFirstSolver: true,
                },
                { prisma, now: nowFn }
            ),
        /already been awarded/
    );

    // Test Intermediate Invalid Candidate Replacement on a second task (itask-2)
    db.store.tasks.set("itask-2", {
        id: "itask-2",
        title: "Intermediate Task 2",
        type: "INTERNAL",
        deadline: intDeadline,
        isBonus: false,
        weekId: null,
        sessionId: "sess-1",
        allowedSubmissionMode: null,
        createdAt: new Date("2026-11-10T10:05:00Z"),
    });
    db.store.rubricFields.set("rf-i2", { id: "rf-i2", taskId: "itask-2", fieldName: "Score", maxPoints: 15, order: 1 });

    // Submit before deadline by shifting clock temporarily
    currentTime = new Date("2026-11-10T12:00:00Z");
    const dinaT2 = await createOrUpdateSubmission(
        { studentId: "istu-1", taskId: "itask-2", mode: "TEXT", textContent: "dina t2" },
        { prisma, now: nowFn }
    );
    currentTime = new Date("2026-11-10T12:05:00Z");
    const farahT2 = await createOrUpdateSubmission(
        { studentId: "istu-3", taskId: "itask-2", mode: "TEXT", textContent: "farah t2" },
        { prisma, now: nowFn }
    );

    currentTime = new Date("2026-11-12T20:05:00Z");
    // Trying to award Farah before Dina is marked invalid must throw
    await assert.rejects(
        () =>
            gradeSubmission(
                {
                    submissionId: farahT2.id,
                    fieldScores: [{ rubricFieldId: "rf-i2", awardedPoints: 15 }],
                    markedInvalid: false,
                    gradedBy: "inst-1",
                    isFirstSolver: true,
                },
                { prisma, now: nowFn }
            ),
        /not the current earliest/
    );

    // Instructor marks Dina invalid (even if isFirstSolver: true was somehow passed, invalid NEVER wins!)
    await gradeSubmission(
        {
            submissionId: dinaT2.id,
            fieldScores: [{ rubricFieldId: "rf-i2", awardedPoints: 0 }],
            markedInvalid: true,
            gradedBy: "inst-1",
            isFirstSolver: true,
        },
        { prisma, now: nowFn }
    );

    const dinaFirstSolverTxs = Array.from(db.store.stTransactions.values()).filter(
        (t) => t.studentId === "istu-1" && t.reason === "FIRST_SOLVER"
    );
    assert.strictEqual(dinaFirstSolverTxs.length, 0, "Invalid solution must NEVER receive First Solver");

    // Suggestion now automatically advances to Farah!
    intSuggestions = await computeTaskFirstSolverSuggestions(prisma, {
        track: "INTERMEDIATE",
        groupId: "grp-int",
        tasks: [{ id: "itask-2", title: "Intermediate Task 2", type: "INTERNAL", closesAt: intDeadline }],
        now: currentTime,
    });
    assert.strictEqual(intSuggestions[0].suggestedStudentId, "istu-3", "Farah suggested after Dina invalidated");

    // Grade Farah with isFirstSolver: true -> awards +15 rubric + 5 First Solver
    const farahBalanceBefore = db.store.levelStBalances.get("istu-3:lvl-1")!.balance;
    await gradeSubmission(
        {
            submissionId: farahT2.id,
            fieldScores: [{ rubricFieldId: "rf-i2", awardedPoints: 15 }],
            markedInvalid: false,
            gradedBy: "inst-1",
            isFirstSolver: true,
        },
        { prisma, now: nowFn }
    );
    assert.strictEqual(db.store.levelStBalances.get("istu-3:lvl-1")!.balance, farahBalanceBefore + 20);

    // Equal timestamps tie-break check in rankTaskFirstSolverCandidates
    const eqTime = new Date("2026-11-10T15:00:00Z");
    const tieRanked = rankTaskFirstSolverCandidates({
        taskId: "t-tie",
        taskTitle: "Tie Task",
        track: "INTERMEDIATE",
        groupId: "grp-int",
        closesAt: intDeadline,
        now: currentTime,
        existingAward: null,
        submissions: [
            {
                id: "sub-z",
                studentId: "istu-2",
                taskId: "t-tie",
                studentName: "Ehab",
                studentGroupId: "grp-int",
                mode: "TEXT",
                fileUrl: null,
                externalLink: null,
                textContent: "ans",
                lastSavedAt: eqTime,
                createdAt: eqTime,
                gradedAt: null,
                understandingScore: null,
                approachScore: null,
                correctnessScore: null,
                implementationScore: null,
                taskGrade: null,
            },
            {
                id: "sub-a",
                studentId: "istu-1",
                taskId: "t-tie",
                studentName: "Dina",
                studentGroupId: "grp-int",
                mode: "TEXT",
                fileUrl: null,
                externalLink: null,
                textContent: "ans",
                lastSavedAt: eqTime,
                createdAt: eqTime,
                gradedAt: null,
                understandingScore: null,
                approachScore: null,
                correctnessScore: null,
                implementationScore: null,
                taskGrade: null,
            },
        ],
    });
    assert.strictEqual(tieRanked.suggestion.suggestedStudentId, "istu-1", "Deterministic tie-break selects sub-a");

    // Concurrent calls test (simultaneous finalizeWeekGrading / confirmTaskFirstSolver)
    db.store.students.set("stu-conc", { id: "stu-conc", name: "Conc", groupId: "grp-beg", avgSt: 50, beginnerSt: 50 });
    await Promise.allSettled([
        finalizeWeekGrading({ studentId: "stu-conc", weekId: "week-1", gradedBy: "inst-1", firstSolverTaskIds: [] }, { prisma, now: nowFn }),
        finalizeWeekGrading({ studentId: "stu-conc", weekId: "week-1", gradedBy: "inst-1", firstSolverTaskIds: [] }, { prisma, now: nowFn }),
    ]);
    const concFinalizedTxs = Array.from(db.store.stTransactions.values()).filter(
        (t) => t.studentId === "stu-conc" && t.reason === "TASK_NOT_SUBMITTED"
    );
    assert.strictEqual(concFinalizedTxs.length, 3, "Concurrent finalize must apply penalties only once across 3 tasks");

    // Mode switching through saveDraftSubmission & createOrUpdateSubmission + independent task timestamps
    db.store.tasks.set("btask-modes", {
        id: "btask-modes",
        title: "Mode Switch Task",
        type: "INTERNAL",
        deadline: new Date("2026-11-20T20:00:00Z"),
        isBonus: false,
        weekId: "week-modes",
        sessionId: null,
        allowedSubmissionMode: null,
        createdAt: new Date("2026-11-15T08:00:00Z"),
    });
    db.store.weeks.set("week-modes", {
        id: "week-modes",
        groupId: "grp-beg",
        startDate: new Date("2026-11-15T09:00:00Z"),
        endDate: new Date("2026-11-20T20:00:00Z"),
    });
    db.store.rubricFields.set("rf-modes", { id: "rf-modes", taskId: "btask-modes", fieldName: "Score", maxPoints: 15, order: 1 });

    currentTime = new Date("2026-11-16T10:00:00Z");
    const m1 = await saveDraftSubmission(
        { studentId: "stu-1", taskId: "btask-modes", mode: "TEXT", textContent: "https://same-value.com" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(m1.lastSavedAt?.toISOString(), "2026-11-16T10:00:00.000Z");

    // Switching mode with identical string content MUST count as a change
    currentTime = new Date("2026-11-16T10:05:00Z");
    const m2 = await saveDraftSubmission(
        { studentId: "stu-1", taskId: "btask-modes", mode: "LINK", externalLink: "https://same-value.com" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(m2.lastSavedAt?.toISOString(), "2026-11-16T10:05:00.000Z");

    // Switching to FILE updates lastSavedAt; repeating identical FILE skips write
    currentTime = new Date("2026-11-16T10:10:00Z");
    const m3 = await saveDraftSubmission(
        { studentId: "stu-1", taskId: "btask-modes", mode: "FILE", fileUrl: "btask-modes/stu-1/submission-123.pdf" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(m3.lastSavedAt?.toISOString(), "2026-11-16T10:10:00.000Z");

    currentTime = new Date("2026-11-16T10:12:00Z");
    const m4 = await saveDraftSubmission(
        { studentId: "stu-1", taskId: "btask-modes", mode: "FILE", fileUrl: "btask-modes/stu-1/submission-123.pdf" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(m4.lastSavedAt?.toISOString(), "2026-11-16T10:10:00.000Z");

    currentTime = new Date("2026-11-16T10:15:00Z");
    const m5 = await saveDraftSubmission(
        { studentId: "stu-1", taskId: "btask-modes", mode: "FILE", fileUrl: "btask-modes/stu-1/submission-456.pdf" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(m5.lastSavedAt?.toISOString(), "2026-11-16T10:15:00.000Z");

    // Equal timestamps in DB via computeTaskFirstSolverSuggestions + halved post-finalization confirm
    currentTime = new Date("2026-11-16T11:00:00Z");
    await saveDraftSubmission(
        { studentId: "stu-2", taskId: "btask-modes", mode: "TEXT", textContent: "tie b" },
        { prisma, now: nowFn }
    );
    await saveDraftSubmission(
        { studentId: "stu-3", taskId: "btask-modes", mode: "TEXT", textContent: "tie c" },
        { prisma, now: nowFn }
    );
    // stu-1 saved at 10:15 (earliest), stu-2 & stu-3 both saved at 11:00 (equal timestamps).
    // Mark stu-1 invalid, then stu-2 vs stu-3 tie must break deterministically by createdAt/id!
    const m5Sub = await prisma.submission.findUniqueOrThrow({
        where: { studentId_taskId: { studentId: "stu-1", taskId: "btask-modes" } },
    });
    await saveDraftGrade(
        {
            submissionId: m5Sub.id,
            gradedBy: "inst-1",
            fieldScores: [{ rubricFieldId: "rf-modes", awardedPoints: 0 }],
            markedInvalid: true,
        },
        { prisma }
    );

    // Give stu-2 odd rubric score (15) + finishAll (10) = 25 raw, NO accepted resource -> halved floor(25/2)=12
    const stu2ModesSub = await prisma.submission.findUniqueOrThrow({
        where: { studentId_taskId: { studentId: "stu-2", taskId: "btask-modes" } },
    });
    await saveDraftGrade(
        {
            submissionId: stu2ModesSub.id,
            gradedBy: "inst-1",
            fieldScores: [{ rubricFieldId: "rf-modes", awardedPoints: 15 }],
            markedInvalid: false,
        },
        { prisma }
    );

    currentTime = new Date("2026-11-21T00:00:00Z");
    const modeSuggestions = await suggestFirstSolvers({ weekId: "week-modes" }, { prisma, now: nowFn });
    assert.strictEqual(
        modeSuggestions[0].suggestedStudentId,
        "stu-2",
        "Tie between stu-2 and stu-3 at 11:00 must pick earlier createdAt/id (stu-2)"
    );

    // Finalize stu-2 without First Solver first (halved: floor(25/2)=12), then confirm First Solver post-finalization!
    const stu2BeforeHalved = db.store.students.get("stu-2")!.beginnerSt!;
    await finalizeWeekGrading(
        { studentId: "stu-2", weekId: "week-modes", gradedBy: "inst-1", firstSolverTaskIds: [] },
        { prisma, now: nowFn }
    );
    assert.strictEqual(db.store.students.get("stu-2")!.beginnerSt, stu2BeforeHalved + 12);

    const halvedConfirm = await confirmTaskFirstSolver(
        { taskId: "btask-modes", studentId: "stu-2", confirmedBy: "inst-1" },
        { prisma, now: nowFn }
    );
    assert.strictEqual(halvedConfirm.wasHalvedDueToLateResource, true);
    assert.strictEqual(
        halvedConfirm.awardedAmount,
        3,
        "Halved post-finalization First Solver must award floor((25+5)/2) - floor(25/2) = 15 - 12 = 3 ST"
    );
    assert.strictEqual(db.store.students.get("stu-2")!.beginnerSt, stu2BeforeHalved + 15);

    console.log("✔ INTERMEDIATE lifecycle, invalid fallback, concurrent safety, and tie-breaking verified.");
    console.log("\n🎉 ALL UNIFIED FIRST SOLVER TESTS PASSED!");
}

runTests().catch((err) => {
    console.error("❌ TEST SUITE FAILED:", err);
    process.exit(1);
});
