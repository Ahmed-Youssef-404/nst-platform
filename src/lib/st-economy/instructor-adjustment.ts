// src/lib/st-economy/instructor-adjustment.ts
//
// Business logic for "Instructor adds/deducts ST for a student".
// Authorization is enforced HERE (not just in the Server Action), so no
// caller can skip it. The balance change itself still goes through
// applySTChange() - the single permitted entry point.
//
// Idempotency: the caller passes a key that is stored on the
// STTransaction row (unique). A repeated key returns the original result
// instead of applying ST again. If two identical requests race, the unique
// constraint fails the second one INSIDE its transaction, which rolls the
// whole thing back (balance included) - then we return the winner's result.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applySTChange } from "./create-transaction";
import type { ApplySTChangeInput } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface InstructorAdjustmentInput {
    instructorId: string; // trusted: comes from the session, never from the client
    studentId: string;
    direction: "ADD" | "DEDUCT";
    amount: number; // positive integer (validated by the caller)
    note: string | null;
    idempotencyKey: string; // already scoped to the instructor by the caller
}

export interface InstructorAdjustmentResult {
    balance: number; // the balance the student is now at (level or beginner)
    alreadyApplied: boolean;
}

async function findExisting(
    idempotencyKey: string
): Promise<InstructorAdjustmentResult | null> {
    const row = await prisma.sTTransaction.findUnique({
        where: { idempotencyKey },
        select: { levelStBalance: true, beginnerStBalance: true },
    });

    if (!row) return null;

    return {
        balance: row.levelStBalance ?? row.beginnerStBalance ?? 0,
        alreadyApplied: true,
    };
}

export async function applyInstructorAdjustment(
    input: InstructorAdjustmentInput
): Promise<InstructorAdjustmentResult> {
    // 1) Replay of an already-applied request -> same result, no new ST.
    const replay = await findExisting(input.idempotencyKey);
    if (replay) return replay;

    // 2) Authorization. The studentId is only a lookup key; the student's
    //    group comes from the DB and must be one this Instructor is
    //    assigned to. Same message for "doesn't exist" and "not yours"
    //    so the endpoint can't be used to probe student ids.
    const student = await prisma.student.findUnique({
        where: { id: input.studentId },
        select: {
            id: true,
            groupId: true,
            group: {
                select: {
                    type: true,
                    levels: {
                        where: { isActive: true },
                        take: 1,
                        select: { id: true },
                    },
                },
            },
        },
    });

    const assignment = student
        ? await prisma.instructorGroup.findUnique({
            where: {
                instructorId_groupId: {
                    instructorId: input.instructorId,
                    groupId: student.groupId,
                },
            },
            select: { id: true },
        })
        : null;

    if (!student || !assignment) {
        throw new Error("Student not found in your groups.");
    }

    // 3) Resolve the target (Level for INTERMEDIATE, ongoing Week for BEGINNER).
    const common = {
        studentId: student.id,
        type: input.direction === "ADD" ? ("REWARD" as const) : ("PENALTY" as const),
        reason: "INSTRUCTOR_ADJUSTMENT" as const,
        amount: input.amount,
        actorId: input.instructorId,
        note: input.note,
        idempotencyKey: input.idempotencyKey,
    };

    let change: ApplySTChangeInput;

    if (student.group.type === "BEGINNER") {
        const now = new Date();
        const week = await prisma.week.findFirst({
            where: {
                groupId: student.groupId,
                startDate: { lte: now },
                endDate: { gte: now },
            },
            orderBy: { startDate: "desc" },
            select: { id: true },
        });

        if (!week) {
            throw new Error(
                "This student's group has no ongoing week right now, so the adjustment can't be recorded."
            );
        }

        change = { track: "BEGINNER", weekId: week.id, ...common };
    } else {
        const level = student.group.levels[0];

        if (!level) {
            throw new Error("This student's group has no active level right now.");
        }

        change = { track: "INTERMEDIATE", levelId: level.id, ...common };
    }

    // 4) Apply atomically (balance + avgSt + transaction row in one tx).
    try {
        const result = await prisma.$transaction((tx) => applySTChange(change, tx));

        return {
            balance:
                result.track === "BEGINNER"
                    ? result.beginnerStBalance
                    : result.levelStBalance,
            alreadyApplied: false,
        };
    } catch (error) {
        // Lost a race against an identical request -> return the winner's result.
        const winner = await findExisting(input.idempotencyKey);
        if (winner) return winner;
        throw error;
    }
}
