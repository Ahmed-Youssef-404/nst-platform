// src/lib/data/get-student-ranking.ts
// Read-only fetcher for the Student "Ranking" page. Ranking is always
// scoped to the requesting Student's Group - never cross-Group, even
// within the same Level "number" (see LevelStBalance redesign: Group ->
// Level is a strict 1:many, so this was already implicit, but the intent
// is explicit here too).
//
// Two kinds of ranking, both dense-ranked (ties share a rank, next
// distinct value continues at rank+1 - e.g. 1, 1, 2, 3 not 1, 1, 3, 4):
//
// 1) Per-Level ranking (`levels`): one tab per Level the Group has EVER
//    had, oldest first - including frozen (isActive: false) ones, not
//    just the current one. Each tab ranks every groupmate by their
//    LevelStBalance.balance for that specific Level. A frozen Level's
//    numbers never change again, so this tab is a permanent historical
//    record once the Group moves on.
//
// 2) Overall ranking (`overall`): ranks every groupmate by Student.avgSt
//    (the cached average across all of that student's LevelStBalance rows,
//    frozen + current). Per product decision, the UI only surfaces the
//    top 3 ranks here (ties included, so more than 3 students can appear
//    if there's a tie at rank 3) - `overall.students` is pre-filtered to
//    that, it is NOT the full group roster like the per-Level tabs are.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface RankedStudentByLevel {
    id: string;
    name: string;
    levelSt: number;
    rank: number; // dense rank, 1-based
    isCurrentStudent: boolean;
}

export interface RankedStudentByAvg {
    id: string;
    name: string;
    avgSt: number;
    rank: number; // dense rank, 1-based
    isCurrentStudent: boolean;
}

export interface LevelRankingTab {
    levelId: string;
    levelName: string;
    levelNumber: number;
    isActive: boolean;
    students: RankedStudentByLevel[]; // full group roster, sorted by rank ascending
    currentStudentRank: number;
}

export interface OverallRankingTab {
    students: RankedStudentByAvg[]; // top 3 ranks only (ties included) - see file header
    currentStudentRank: number; // the student's real rank, even if they didn't make top 3
}

export interface StudentRankingView {
    groupName: string;
    levels: LevelRankingTab[]; // oldest first; empty if the Group has no Levels yet
    overall: OverallRankingTab;
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
                        orderBy: { levelNumber: "asc" },
                        select: {
                            id: true,
                            name: true,
                            levelNumber: true,
                            isActive: true,
                            levelStBalances: {
                                select: {
                                    balance: true,
                                    student: { select: { id: true, name: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (student.group.levels.length === 0) return null;

    // --- Per-Level tabs ---
    const levels: LevelRankingTab[] = student.group.levels.map((level) => {
        const ranked = denseRank(
            level.levelStBalances,
            (b) => b.balance
        );

        const students: RankedStudentByLevel[] = ranked.map(({ item, rank }) => ({
            id: item.student.id,
            name: item.student.name,
            levelSt: item.balance,
            rank,
            isCurrentStudent: item.student.id === studentId,
        }));

        const currentStudentRank =
            students.find((s) => s.isCurrentStudent)?.rank ?? 0;

        return {
            levelId: level.id,
            levelName: level.name,
            levelNumber: level.levelNumber,
            isActive: level.isActive,
            students,
            currentStudentRank,
        };
    });

    // --- Overall (avgSt) tab ---
    const groupmates = await prisma.student.findMany({
        where: { groupId: student.groupId },
        select: { id: true, name: true, avgSt: true },
    });

    const rankedOverall = denseRank(groupmates, (s) => s.avgSt);

    const allOverallStudents: RankedStudentByAvg[] = rankedOverall.map(
        ({ item, rank }) => ({
            id: item.id,
            name: item.name,
            avgSt: item.avgSt,
            rank,
            isCurrentStudent: item.id === studentId,
        })
    );

    const currentStudentOverallRank =
        allOverallStudents.find((s) => s.isCurrentStudent)?.rank ?? 0;

    // Only ranks 1-3 are surfaced (ties at rank 3 mean more than 3 rows -
    // that's intended, see file header).
    const overallStudents = allOverallStudents.filter((s) => s.rank <= 3);

    return {
        groupName: student.group.name,
        levels,
        overall: {
            students: overallStudents,
            currentStudentRank: currentStudentOverallRank,
        },
    };
}