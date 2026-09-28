// src/lib/data/get-super-admin-overview.ts
// Comprehensive data fetcher for the Super Admin overview dashboard.
// Fetches system stats, enrolled students, instructors with group assignments,
// and selectable groups.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { GroupOption } from "./get-groups";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface SuperAdminStudentSummary {
    id: string; // student code e.g. "NST-1001"
    name: string;
    email: string;
    avgSt: number;
    beginnerSt: number | null;
    createdAt: Date;
    groupId: string;
    groupName: string;
    groupType: "BEGINNER" | "INTERMEDIATE";
    batchName: string;
}

export interface SuperAdminInstructorSummary {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    assignedGroups: {
        id: string;
        name: string;
        batchName: string;
        type: "BEGINNER" | "INTERMEDIATE";
    }[];
}

export interface SuperAdminOverviewData {
    stats: {
        totalStudents: number;
        totalInstructors: number;
        totalBatches: number;
        totalGroups: number;
        beginnerStudentsCount: number;
        intermediateStudentsCount: number;
        beginnerGroupsCount: number;
        intermediateGroupsCount: number;
        activeLevelsCount: number;
    };
    students: SuperAdminStudentSummary[];
    instructors: SuperAdminInstructorSummary[];
    groups: GroupOption[];
}

export async function getSuperAdminOverview(): Promise<SuperAdminOverviewData> {
    const [students, instructors, batches, groups, activeLevelsCount] =
        await Promise.all([
            prisma.student.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    group: {
                        include: {
                            batch: true,
                        },
                    },
                },
            }),
            prisma.instructor.findMany({
                orderBy: { name: "asc" },
                include: {
                    instructorGroups: {
                        include: {
                            group: {
                                include: {
                                    batch: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.batch.findMany({
                select: { id: true },
            }),
            prisma.group.findMany({
                include: { batch: true },
                orderBy: [{ batch: { name: "asc" } }, { name: "asc" }],
            }),
            prisma.level.count({
                where: { isActive: true },
            }),
        ]);

    const formattedStudents: SuperAdminStudentSummary[] = students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        avgSt: s.avgSt,
        beginnerSt: s.beginnerSt,
        createdAt: s.createdAt,
        groupId: s.groupId,
        groupName: s.group.name,
        groupType: s.group.type,
        batchName: s.group.batch.name,
    }));

    const formattedInstructors: SuperAdminInstructorSummary[] = instructors.map(
        (ins) => ({
            id: ins.id,
            name: ins.name,
            email: ins.email,
            createdAt: ins.createdAt,
            assignedGroups: ins.instructorGroups.map((ig) => ({
                id: ig.group.id,
                name: ig.group.name,
                batchName: ig.group.batch.name,
                type: ig.group.type,
            })),
        })
    );

    const groupOptions: GroupOption[] = groups.map((g) => ({
        id: g.id,
        name: g.name,
        batchName: g.batch.name,
        type: g.type,
    }));

    const beginnerStudentsCount = formattedStudents.filter(
        (s) => s.groupType === "BEGINNER"
    ).length;
    const intermediateStudentsCount =
        formattedStudents.length - beginnerStudentsCount;

    const beginnerGroupsCount = groups.filter(
        (g) => g.type === "BEGINNER"
    ).length;
    const intermediateGroupsCount = groups.length - beginnerGroupsCount;

    return {
        stats: {
            totalStudents: students.length,
            totalInstructors: instructors.length,
            totalBatches: batches.length,
            totalGroups: groups.length,
            beginnerStudentsCount,
            intermediateStudentsCount,
            beginnerGroupsCount,
            intermediateGroupsCount,
            activeLevelsCount,
        },
        students: formattedStudents,
        instructors: formattedInstructors,
        groups: groupOptions,
    };
}
