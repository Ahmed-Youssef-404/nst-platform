"use server";
// src/lib/actions/week-grading.ts
// Server Actions for grading BEGINNER track Weeks.
// Restricted to Instructor only. Instructor identity always resolved
// from authenticated session (requireRole).

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireRole } from "@/lib/auth/require-role";
import {
    saveDraftGrade,
    finalizeWeekGrading,
} from "@/lib/weeks/grade-week";
import type {
    SaveDraftGradeInput,
    FinalizeWeekGradingInput,
    WeekResourceStatusCode,
} from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export type SaveDraftGradeActionInput =
    | {
          submissionId: string;
          fieldScores: { rubricFieldId: string; awardedPoints: number }[];
          markedInvalid: boolean;
      }
    | {
          studentId: string;
          taskId: string;
          fieldScores: { rubricFieldId: string; awardedPoints: number }[];
          markedInvalid: boolean;
      };

export async function saveDraftGradeAction(input: SaveDraftGradeActionInput) {
    const user = await requireRole(["instructor"]);

    try {
        const result =
            "submissionId" in input
                ? await saveDraftGrade({
                      submissionId: input.submissionId,
                      fieldScores: input.fieldScores,
                      markedInvalid: input.markedInvalid,
                      gradedBy: user.id,
                  })
                : await saveDraftGrade({
                      studentId: input.studentId,
                      taskId: input.taskId,
                      fieldScores: input.fieldScores,
                      markedInvalid: input.markedInvalid,
                      gradedBy: user.id,
                  });

        revalidatePath("/instructor");
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function setWeekResourceStatusAction(input: {
    studentId: string;
    weekId: string;
    status: WeekResourceStatusCode;
}) {
    const user = await requireRole(["instructor"]);

    try {
        const week = await prisma.week.findUniqueOrThrow({
            where: { id: input.weekId },
            select: { groupId: true },
        });

        const assignment = await prisma.instructorGroup.findUnique({
            where: {
                instructorId_groupId: {
                    instructorId: user.id,
                    groupId: week.groupId,
                },
            },
        });

        if (!assignment) {
            throw new Error("You are not assigned to this Student's Group.");
        }

        const updated = await prisma.weekResourceSubmission.update({
            where: {
                studentId_weekId: {
                    studentId: input.studentId,
                    weekId: input.weekId,
                },
            },
            data: {
                status: input.status,
            },
        });

        revalidatePath("/instructor");
        return { success: true, data: updated };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function finalizeWeekGradingAction(
    input: Omit<FinalizeWeekGradingInput, "gradedBy">
) {
    const user = await requireRole(["instructor"]);

    try {
        const result = await finalizeWeekGrading({
            ...input,
            gradedBy: user.id,
        });

        revalidatePath("/instructor");
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
