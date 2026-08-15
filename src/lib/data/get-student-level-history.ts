// src/lib/data/get-student-level-history.ts
// Lightweight summary of every Level (active AND past) in the logged-in
// Student's Group, for the "Level History" list page
// (src/app/student/levels). Deliberately shallow - just enough per Level
// to render a card and link into it - the full Session/Task/Hint tree for
// a single Level is fetched separately by getStudentLevelById only when
// the student actually opens it (see /student/levels/[id]).

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface StudentLevelSummary {
    id: string;
    name: string;
    levelNumber: number;
    isActive: boolean;
    startDate: Date;
    sessionCount: number;
}

export async function getStudentLevelHistory(
    studentId: string
): Promise<StudentLevelSummary[]> {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: {
            group: {
                select: {
                    levels: {
                        orderBy: { startDate: "desc" },
                        select: {
                            id: true,
                            name: true,
                            levelNumber: true,
                            isActive: true,
                            startDate: true,
                            _count: { select: { sessions: true } },
                        },
                    },
                },
            },
        },
    });

    return student.group.levels.map((level) => ({
        id: level.id,
        name: level.name,
        levelNumber: level.levelNumber,
        isActive: level.isActive,
        startDate: level.startDate,
        sessionCount: level._count.sessions,
    }));
}