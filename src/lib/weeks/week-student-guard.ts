// src/lib/weeks/week-student-guard.ts
//
// Shared guard for every Student-side write inside a BEGINNER Week
// (save-draft, upload required file, lock). Kept in one place so the
// "is this Student allowed to change things right now?" rules can never
// drift between the three flows.
//
// A Student may write inside a Week only if ALL of these hold:
//   1. The Week exists and belongs to the Student's own Group, and that
//      Group is BEGINNER.
//   2. startDate <= now < endDate  (Week is running).
//   3. The Student has not locked the Week manually (lockedAt is null).
//
// Rule #3 is intentionally NOT checked when `allowLocked` is true - only
// the lock action itself needs that, to give a clear "already locked"
// error instead of a generic one (see lock-week.ts).

import type { PrismaClient } from "@/generated/prisma/client";

type PrismaLike = Pick<
    PrismaClient,
    "week" | "student" | "weekResourceSubmission"
>;

export interface StudentWeekContext {
    week: {
        id: string;
        groupId: string;
        startDate: Date;
        endDate: Date;
    };
    lockedAt: Date | null;
    hasResource: boolean;
}

export async function assertStudentCanWriteInWeek(
    prisma: PrismaLike,
    params: {
        studentId: string;
        weekId: string;
        allowLocked?: boolean;
    }
): Promise<StudentWeekContext> {
    const { studentId, weekId, allowLocked = false } = params;

    const week = await prisma.week.findUnique({
        where: { id: weekId },
        select: {
            id: true,
            groupId: true,
            startDate: true,
            endDate: true,
            group: { select: { type: true } },
        },
    });

    if (!week) {
        throw new Error("Week not found.");
    }

    if (week.group.type !== "BEGINNER") {
        throw new Error("This Week does not belong to a BEGINNER Group.");
    }

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { groupId: true },
    });

    if (!student || student.groupId !== week.groupId) {
        throw new Error("This Week does not belong to your Group.");
    }

    const now = new Date();

    if (now < week.startDate) {
        throw new Error("This Week has not started yet.");
    }

    if (now >= week.endDate) {
        throw new Error(
            "This Week has ended. Submissions are no longer accepted."
        );
    }

    const resource = await prisma.weekResourceSubmission.findUnique({
        where: { studentId_weekId: { studentId, weekId } },
        select: { lockedAt: true },
    });

    if (!allowLocked && resource?.lockedAt) {
        throw new Error(
            "You have already locked this Week. It can no longer be changed."
        );
    }

    return {
        week: {
            id: week.id,
            groupId: week.groupId,
            startDate: week.startDate,
            endDate: week.endDate,
        },
        lockedAt: resource?.lockedAt ?? null,
        hasResource: resource !== null,
    };
}