"use server";
// src/lib/actions/session-feedback.ts
// Server Action for Intermediate students submitting Session rating and feedback.
// Rating is mandatory (1-10), comment is optional.
// Once submitted, rating cannot be edited or resubmitted.

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireRole } from "@/lib/auth/require-role";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import type { SubmitSessionFeedbackInput } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function submitSessionFeedbackAction(input: SubmitSessionFeedbackInput) {
    await requireRole(["student"]);

    try {
        const studentId = await getCurrentStudentId();
        if (!studentId) {
            throw new Error("Could not resolve current student account.");
        }

        const rating = Number(input.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
            throw new Error("Session rating must be an integer between 1 and 10.");
        }

        if (!input.sessionId) {
            throw new Error("Session ID is required.");
        }

        // Verify the student exists and retrieve group info
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { group: true },
        });

        if (!student) {
            throw new Error("Student record not found.");
        }

        if (student.group.type !== "INTERMEDIATE") {
            throw new Error("Session ratings are only applicable to the Intermediate track.");
        }

        // Verify the session exists and belongs to the student's group
        const session = await prisma.session.findUnique({
            where: { id: input.sessionId },
            include: {
                level: true,
            },
        });

        if (!session || session.level.groupId !== student.groupId) {
            throw new Error("Session not found or does not belong to your group.");
        }

        // Check if student has already submitted feedback for this session
        const existing = await prisma.sessionFeedback.findUnique({
            where: {
                sessionId_studentId: {
                    sessionId: input.sessionId,
                    studentId,
                },
            },
        });

        if (existing) {
            throw new Error("You have already submitted feedback for this session. It cannot be modified.");
        }

        const trimmedComment = input.comment?.trim() ? input.comment.trim() : null;

        const feedback = await prisma.sessionFeedback.create({
            data: {
                sessionId: input.sessionId,
                studentId,
                rating,
                comment: trimmedComment,
            },
        });

        revalidatePath("/student");
        revalidatePath(`/student/sessions/${input.sessionId}`);
        revalidatePath(`/instructor/sessions/${input.sessionId}`);

        return {
            success: true,
            data: {
                id: feedback.id,
                rating: feedback.rating,
                comment: feedback.comment,
                createdAt: feedback.createdAt,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
