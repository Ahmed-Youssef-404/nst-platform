"use server";
// src/lib/actions/feedback.ts
// Server Action for the Send Feedback feature. Student-only. Deliberately
// has no DB write - the feedback goes straight to Telegram and nowhere
// else (client decision, see types.ts / send-feedback.ts). If the
// Telegram send fails, this returns {success: false} so the Student can
// retry - there is no persisted copy to fall back on.

import { requireRole } from "@/lib/auth/require-role";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentContact } from "@/lib/data/get-student-contact";
import { sendFeedbackToTelegram } from "@/lib/telegram/send-feedback";
import type { SubmitFeedbackInput } from "@/types/types";

const MAX_FEEDBACK_MESSAGE_LENGTH = 2000;

export async function submitFeedbackAction(input: SubmitFeedbackInput) {
    await requireRole(["student"]);

    try {
        const message = input.message.trim();

        if (!message) {
            throw new Error("Please write your feedback before submitting.");
        }
        if (message.length > MAX_FEEDBACK_MESSAGE_LENGTH) {
            throw new Error(
                `Feedback is too long (max ${MAX_FEEDBACK_MESSAGE_LENGTH} characters).`
            );
        }

        const studentId = await getCurrentStudentId();
        if (!studentId) {
            throw new Error("Could not resolve the current student account.");
        }

        const student = await getStudentContact(studentId);

        await sendFeedbackToTelegram({
            studentName: student.name,
            studentEmail: student.email,
            type: input.type,
            message,
        });

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}