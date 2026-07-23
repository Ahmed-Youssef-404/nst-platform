"use server";
// src/lib/actions/st-economy.ts
// Server Actions for the ST economy.
// Follows the same pattern as batch-management.ts:
//   requireRole() called OUTSIDE try/catch, business logic inside try/catch,
//   returns { success: true, data } or { success: false, error }.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { recordAttendance, recordSessionEngagement, gradeSubmission } from "@/lib/st-economy/instructor-events";
import { unlockHint } from "@/lib/st-economy/hint-unlock";
import { reconcileStudentST } from "@/lib/st-economy/reconcile";
import type {
    RecordAttendanceInput,
    RecordSessionEngagementInput,
    GradeSubmissionInput,
    UnlockHintInput,
} from "@/types/types";

// ------------------------------------------------------------------
// Instructor-driven actions - Instructor or SuperAdmin only
// ------------------------------------------------------------------

export async function recordAttendanceAction(input: RecordAttendanceInput) {
    await requireRole(["instructor", "super_admin"]);

    try {
        const attendance = await recordAttendance(input);
        revalidatePath("/instructor");
        return { success: true, data: attendance };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function recordSessionEngagementAction(
    input: RecordSessionEngagementInput
) {
    await requireRole(["instructor", "super_admin"]);

    try {
        const result = await recordSessionEngagement(input);
        revalidatePath("/instructor");
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function gradeSubmissionAction(input: GradeSubmissionInput) {
    await requireRole(["instructor", "super_admin"]);

    try {
        const submission = await gradeSubmission(input);
        revalidatePath("/instructor");
        return { success: true, data: submission };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

// ------------------------------------------------------------------
// Student action - Student only, and only for their own account
// ------------------------------------------------------------------

export async function unlockHintAction(input: UnlockHintInput) {
    const user = await requireRole(["student"]);

    if (user.id !== input.studentId) {
        return { success: false, error: "You can only unlock hints for your own account." };
    }

    try {
        const hintUnlock = await unlockHint(input);
        revalidatePath("/student");
        return { success: true, data: hintUnlock };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

// ------------------------------------------------------------------
// Reconciliation - any authenticated role may trigger it for a student
// they're allowed to view; page-level code decides who can call this for
// whom (e.g. a student can only reconcile themselves, an instructor can
// reconcile any student in their groups). Kept permissive here since this
// action only ever creates rewards/penalties that were already earned -
// it cannot be abused to grant arbitrary ST.
// ------------------------------------------------------------------

export async function reconcileStudentSTAction(studentId: string) {
    const user = await requireRole(["student", "instructor", "super_admin"]);

    if (user.role === "student" && user.id !== studentId) {
        return { success: false, error: "You can only reconcile your own account." };
    }

    try {
        const result = await reconcileStudentST(studentId);
        revalidatePath("/student");
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}