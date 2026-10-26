// src/lib/data/get-hint-usage.ts
// Read-only helpers for showing which hints a student has unlocked, inside the
// Instructor grading screens (Beginner week grading + Intermediate session
// grading).
//
// This reuses the existing HintUnlock records (the same source of truth that
// unlockHint() writes and the student-facing data layer reads). Nothing here
// writes to the database, and nothing is inferred from STTransaction.
//
// costPaid is the historical amount snapshotted at unlock time - never the
// hint's current cost.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface HintUsageItem {
    hintId: string;
    order: number;
    unlocked: boolean;
    // Historical HintUnlock.costPaid; null when the hint was not unlocked.
    costPaid: number | null;
}

export interface TaskHintUsage {
    totalHints: number;
    unlockedCount: number;
    totalPaid: number;
    // Every hint of the task, in hint order (unlocked or not).
    hints: HintUsageItem[];
}

// studentId -> (hintId -> costPaid)
export type HintUnlockLookup = Map<string, Map<string, number>>;

// One query for the whole screen (no N+1): every unlock of the given students
// on the given hints.
export async function getHintUnlockLookup(
    studentIds: string[],
    hintIds: string[]
): Promise<HintUnlockLookup> {
    const lookup: HintUnlockLookup = new Map();
    if (studentIds.length === 0 || hintIds.length === 0) return lookup;

    const unlocks = await prisma.hintUnlock.findMany({
        where: {
            studentId: { in: studentIds },
            hintId: { in: hintIds },
        },
        select: { studentId: true, hintId: true, costPaid: true },
    });

    for (const unlock of unlocks) {
        let perStudent = lookup.get(unlock.studentId);
        if (!perStudent) {
            perStudent = new Map();
            lookup.set(unlock.studentId, perStudent);
        }
        perStudent.set(unlock.hintId, unlock.costPaid);
    }

    return lookup;
}

// Builds the usage summary for ONE student on ONE task. Only the task's own
// hints are iterated, so an unlock can never leak in from a different task.
export function buildTaskHintUsage(
    taskHints: { id: string; order: number }[],
    studentId: string,
    lookup: HintUnlockLookup
): TaskHintUsage {
    const perStudent = lookup.get(studentId);

    const hints: HintUsageItem[] = [...taskHints]
        .sort((a, b) => a.order - b.order)
        .map((hint) => {
            const costPaid = perStudent?.get(hint.id);
            return {
                hintId: hint.id,
                order: hint.order,
                unlocked: costPaid !== undefined,
                costPaid: costPaid ?? null,
            };
        });

    return {
        totalHints: hints.length,
        unlockedCount: hints.filter((h) => h.unlocked).length,
        totalPaid: hints.reduce((sum, h) => sum + (h.costPaid ?? 0), 0),
        hints,
    };
}
