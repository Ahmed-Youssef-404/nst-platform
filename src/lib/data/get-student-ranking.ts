// src/lib/data/get-student-ranking.ts
// Read-only fetcher for the Student "Ranking" page. Ranks every Student in
// the *same Group* as the given studentId, by their current `levelSt`
// (the balance that resets per Level - matches "ranking within this
// Level" semantics, since Level is scoped to a Group, not global).
//
// Rank is dense (ties share a rank, next distinct value continues at
// rank+1 - e.g. 1, 1, 2, 3 not 1, 1, 3, 4). No secondary tie-breaker:
// students with an equal levelSt are fully tied.
//
// A Group can have no active Level yet (same edge case as
// get-student-level.ts) - callers must handle `null`.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface RankedStudent {
    id: string;
    name: string;
    levelSt: number;
    rank: number; // dense rank, 1-based
    isCurrentStudent: boolean;
}

export interface StudentRankingView {
    groupName: string;
    levelName: string;
    students: RankedStudent[]; // sorted by rank ascending
    currentStudentRank: number; // convenience - rank of the requesting student
}

export async function getStudentRanking(
    studentId: string
): Promise<StudentRankingView | null> {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: {
            groupId: true,
            group: {
                select: {
                    name: true,
                    levels: {
                        where: { isActive: true },
                        take: 1,
                        select: { name: true },
                    },
                },
            },
        },
    });

    const activeLevel = student.group.levels[0];
    if (!activeLevel) return null;

    const groupmates = await prisma.student.findMany({
        where: { groupId: student.groupId },
        select: { id: true, name: true, levelSt: true },
        orderBy: { levelSt: "desc" },
    });

    let rank = 0;
    let previousSt: number | null = null;

    const students: RankedStudent[] = groupmates.map((s) => {
        if (previousSt === null || s.levelSt !== previousSt) {
            rank += 1;
            previousSt = s.levelSt;
        }

        return {
            id: s.id,
            name: s.name,
            levelSt: s.levelSt,
            rank,
            isCurrentStudent: s.id === studentId,
        };
    });

    const currentStudentRank =
        students.find((s) => s.isCurrentStudent)?.rank ?? 0;

    return {
        groupName: student.group.name,
        levelName: activeLevel.name,
        students,
        currentStudentRank,
    };
}