"use server";
// src/lib/actions/task-activity.ts
// Server Action: an Instructor registers that they opened a task and saw the
// student's activity up to `seenVersion`.
// Same pattern as st-economy.ts: requireRole() OUTSIDE try/catch, business
// logic inside, returns { success, data } | { success: false, error }.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { reviewTaskActivity } from "@/lib/submissions/review-task-activity";

export async function markTaskActivityReviewedAction(input: {
    submissionId: string;
    seenVersion: number;
}) {
    const user = await requireRole(["instructor", "super_admin"]);

    try {
        // Review state belongs to the Group's Instructors. A SuperAdmin
        // browsing the page must not clear indicators for them.
        if (user.role === "super_admin") {
            return { success: true, data: { reviewed: false, reviewedVersion: 0 } };
        }

        const result = await reviewTaskActivity({
            instructorId: user.id,
            submissionId: input.submissionId,
            seenVersion: input.seenVersion,
        });

        if (result.reviewed) {
            revalidatePath("/instructor");
        }
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}