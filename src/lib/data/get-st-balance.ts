// src/lib/data/get-st-balance.ts
// Read-only fetcher for ST balance + status + history.
// Does NOT reconcile - call reconcileStudentSTAction first (or let the
// calling page do it) if you need up-to-date deadline-triggered results
// before reading. Kept separate so reads stay cheap when reconciliation
// isn't needed (e.g. an instructor scanning a list of many students).

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getBalanceStatus } from "@/lib/st-economy/balance-status";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function getStudentBalance(studentId: string) {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: { name: true, levelSt: true, totalSt: true },
    });

    return {
        name: student.name,
        ...getBalanceStatus(student.levelSt, student.totalSt),
    };
}

export async function getStudentSTHistory(studentId: string, limit = 50) {
    return prisma.sTTransaction.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}