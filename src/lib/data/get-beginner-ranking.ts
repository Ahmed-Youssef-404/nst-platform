// src/lib/data/get-beginner-ranking.ts
//
// Read-only fetcher for the BEGINNER-track Student "Ranking" view. Mirrors
// get-student-ranking.ts's (INTERMEDIATE) shape and conventions, but much
// simpler: BEGINNER has no Levels, so there's no per-Level tabs and no
// "overall" concept - just one flat ranking for the whole Group, for the
// whole course duration.
//
// Ranking source: Student.beginnerSt (a single continuously-accumulating
// Int per student, never frozen/reset/averaged - see schema comment).
// Always scoped to the requesting Student's own Group, never cross-Group.
//
// Dense-ranked (ties share a rank, next distinct value continues at
// rank+1 - e.g. 1, 1, 2, 3 not 1, 1, 3, 4), same as INTERMEDIATE. No
// top-N filtering here - per product decision this is the full roster,
// unlike INTERMEDIATE's overall tab (top 3 only). Revisit if product
// wants that trimmed once the UI is built.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface RankedBeginnerStudent {
    id: string;
    name: string;
    beginnerSt: number;
    rank: number; // dense rank, 1-based
    isCurrentStudent: boolean;
}

export interface BeginnerStudentRankingView {
    groupName: string;
    students: RankedBeginnerStudent[]; // full group roster, sorted by rank ascending
    currentStudentRank: number;
}

function denseRank<T>(
    items: T[],
    getValue: (item: T) => number
): { item: T; rank: number }[] {
    const sorted = [...items].sort((a, b) => getValue(b) - getValue(a));

    let rank = 0;
    let previousValue: number | null = null;

    return sorted.map((item) => {
        const value = getValue(item);
        if (previousValue === null || value !== previousValue) {
            rank += 1;
            previousValue = value;
        }
        return { item, rank };
    });
}

export async function getBeginnerStudentRanking(
    studentId: string
): Promise<BeginnerStudentRankingView> {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: {
            groupId: true,
            group: { select: { name: true } },
        },
    });

    const groupmates = await prisma.student.findMany({
        where: { groupId: student.groupId },
        select: { id: true, name: true, beginnerSt: true },
    });

    // beginnerSt is nullable in the schema (null for INTERMEDIATE
    // students) - a BEGINNER Group should only ever contain BEGINNER
    // students, but coalesce to 0 defensively rather than let a stray
    // null break the sort/rank.
    const ranked = denseRank(groupmates, (s) => s.beginnerSt ?? 0);

    const students: RankedBeginnerStudent[] = ranked.map(({ item, rank }) => ({
        id: item.id,
        name: item.name,
        beginnerSt: item.beginnerSt ?? 0,
        rank,
        isCurrentStudent: item.id === studentId,
    }));

    const currentStudentRank =
        students.find((s) => s.isCurrentStudent)?.rank ?? 0;

    return {
        groupName: student.group.name,
        students,
        currentStudentRank,
    };
}