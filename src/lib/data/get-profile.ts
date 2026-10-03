// src/lib/data/get-profile.ts
// Read-only fetchers for the My Profile pages (one per role).
//
// Every fetcher takes the id that the CALLER already resolved from the
// session (getCurrentUser().id for SuperAdmin/Instructor, and
// getCurrentStudentId() for Student - never the Supabase Auth UUID) and
// returns null when no matching record exists, so the page can render an
// honest "profile unavailable" state instead of placeholder data.
//
// Each query is a single round-trip (nested select, no per-row follow-up
// queries), so there is no N+1 even for instructors with many groups.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
    InstructorProfileData,
    StudentProfileData,
    SuperAdminProfileData,
} from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function getSuperAdminProfile(
    superAdminId: string
): Promise<SuperAdminProfileData | null> {
    return prisma.superAdmin.findUnique({
        where: { id: superAdminId },
        select: { name: true, email: true, createdAt: true },
    });
}

export async function getInstructorProfile(
    instructorId: string
): Promise<InstructorProfileData | null> {
    const now = new Date();

    const instructor = await prisma.instructor.findUnique({
        where: { id: instructorId },
        select: {
            name: true,
            email: true,
            createdAt: true,
            instructorGroups: {
                orderBy: [{ group: { batch: { name: "asc" } } }, { group: { name: "asc" } }],
                select: {
                    group: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            batch: { select: { name: true } },
                            _count: { select: { students: true } },
                            levels: {
                                where: { isActive: true },
                                take: 1,
                                select: { name: true, levelNumber: true },
                            },
                            weeks: {
                                where: { startDate: { lte: now }, endDate: { gte: now } },
                                orderBy: { startDate: "desc" },
                                take: 1,
                                select: { id: true, name: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!instructor) return null;

    return {
        name: instructor.name,
        email: instructor.email,
        createdAt: instructor.createdAt,
        groups: instructor.instructorGroups.map(({ group }) => ({
            id: group.id,
            name: group.name,
            batchName: group.batch.name,
            type: group.type,
            studentCount: group._count.students,
            activeLevel: group.type === "INTERMEDIATE" ? (group.levels[0] ?? null) : null,
            ongoingWeek: group.type === "BEGINNER" ? (group.weeks[0] ?? null) : null,
        })),
    };
}

export async function getStudentProfileData(
    studentId: string
): Promise<StudentProfileData | null> {
    const now = new Date();

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            avgSt: true,
            beginnerSt: true,
            group: {
                select: {
                    name: true,
                    type: true,
                    batch: { select: { name: true } },
                    levels: {
                        where: { isActive: true },
                        take: 1,
                        select: {
                            name: true,
                            levelNumber: true,
                            // Scoped to THIS student only
                            levelStBalances: {
                                where: { studentId },
                                take: 1,
                                select: { balance: true },
                            },
                        },
                    },
                    weeks: {
                        where: { startDate: { lte: now }, endDate: { gte: now } },
                        orderBy: { startDate: "desc" },
                        take: 1,
                        select: { id: true, name: true },
                    },
                },
            },
        },
    });

    if (!student) return null;

    const isBeginner = student.group.type === "BEGINNER";
    const level = isBeginner ? null : (student.group.levels[0] ?? null);

    return {
        studentCode: student.id,
        name: student.name,
        email: student.email,
        createdAt: student.createdAt,
        groupName: student.group.name,
        batchName: student.group.batch.name,
        groupType: student.group.type,
        activeLevel: level
            ? { name: level.name, levelNumber: level.levelNumber }
            : null,
        // null (not a made-up default) when the Group has no active Level
        // yet or the balance row doesn't exist - the UI shows "-" for it.
        levelSt: level?.levelStBalances[0]?.balance ?? null,
        avgSt: student.avgSt,
        ongoingWeek: isBeginner ? (student.group.weeks[0] ?? null) : null,
        // Same fallback getStudentBalance() uses for a BEGINNER student
        beginnerSt: student.beginnerSt ?? 0,
    };
}
