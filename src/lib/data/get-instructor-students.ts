// src/lib/data/get-instructor-students.ts
// Read-only: every Group the Instructor is assigned to, with its students
// and each student's CURRENT balance (active Level balance for
// INTERMEDIATE, beginnerSt for BEGINNER) - same source of truth as
// getStudentBalance().

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { StudentAvatarConfig } from "@/types/avatar";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface STAdjustStudent {
    id: string;
    name: string;
    email: string;
    balance: number;
    avatarConfig?: StudentAvatarConfig | null;
}

export interface STAdjustGroup {
    id: string;
    name: string;
    batchName: string;
    type: "BEGINNER" | "INTERMEDIATE";
    students: STAdjustStudent[];
}

export async function getInstructorStudentsForST(
    instructorId: string
): Promise<STAdjustGroup[]> {
    const rows = await prisma.instructorGroup.findMany({
        where: { instructorId },
        select: {
            group: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    batch: { select: { name: true } },
                    students: {
                        orderBy: { name: "asc" },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarConfig: true,
                            beginnerSt: true,
                            levelStBalances: {
                                where: { level: { isActive: true } },
                                select: {
                                    balance: true,
                                    level: { select: { groupId: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [{ group: { batch: { name: "asc" } } }, { group: { name: "asc" } }],
    });

    return rows.map(({ group }) => ({
        id: group.id,
        name: group.name,
        batchName: group.batch.name,
        type: group.type,
        students: group.students.map((student) => {
            const levelBalance = student.levelStBalances.find(
                (b) => b.level.groupId === group.id
            )?.balance;

            return {
                id: student.id,
                name: student.name,
                email: student.email,
                avatarConfig: (student.avatarConfig as unknown as StudentAvatarConfig) ?? null,
                balance:
                    group.type === "BEGINNER"
                        ? (student.beginnerSt ?? 50)
                        : (levelBalance ?? 50),
            };
        }),
    }));
}