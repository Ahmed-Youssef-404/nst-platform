// src/lib/data/get-st-balance.ts
// Read-only fetcher for ST balance + status + history.
// Does NOT reconcile - call reconcileStudentSTAction first (or let the
// calling page do it) if you need up-to-date deadline-triggered results
// before reading. Kept separate so reads stay cheap when reconciliation
// isn't needed (e.g. an instructor scanning a list of many students).

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getBalanceStatus } from "@/lib/st-economy/balance-status";
import type { STTransactionResult } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function getStudentBalance(studentId: string) {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: {
            name: true,
            avgSt: true,
            group: {
                select: {
                    levels: {
                        where: { isActive: true },
                        select: {
                            levelStBalances: {
                                where: { studentId },
                                select: { balance: true },
                            },
                        },
                    },
                },
            },
        },
    });

    // A Student's Group should always have exactly one active Level, and
    // that Level should always have a LevelStBalance row for this student
    // (created at Level-transition time) - see manage-level.ts. Falling
    // back to 50 rather than throwing keeps this read-only fetcher
    // resilient for the rare edge case (e.g. a brand-new Group with no
    // Level created yet) instead of breaking the whole dashboard.
    const levelSt =
        student.group.levels[0]?.levelStBalances[0]?.balance ?? 50;

    return {
        name: student.name,
        ...getBalanceStatus(levelSt, student.avgSt),
    };
}

export interface STHistoryPage {
    transactions: STTransactionResult[];
    nextCursor: string | null; // id of the last row returned, or null if no more pages
}

// Cursor-paginated (not offset) since this list can grow indefinitely over
// a student's time on the platform and rows are only ever appended, never
// reordered - cursor pagination stays correct and cheap regardless of how
// many transactions already exist.
export async function getStudentSTHistory(
    studentId: string,
    { limit = 20, cursor }: { limit?: number; cursor?: string } = {}
): Promise<STHistoryPage> {
    const rows = await prisma.sTTransaction.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        take: limit + 1, // fetch one extra to know if there's a next page
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = rows.length > limit;
    const transactions = (hasMore ? rows.slice(0, limit) : rows) as STTransactionResult[];

    return {
        transactions,
        nextCursor: hasMore ? transactions[transactions.length - 1].id : null,
    };
}