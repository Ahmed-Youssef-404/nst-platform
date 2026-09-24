"use server";
// src/lib/actions/week-submission.ts
// Server Actions for a Student working inside a BEGINNER Week: saving
// Task drafts, uploading the Week's required file, and locking the Week.
// Restricted to Student only. studentId always comes from
// getCurrentStudentId() (bridged via email, see get-current-user.ts) -
// never from client input.
//
// The Instructor-side (grading screen, lazy auto-submit, ST batch) is a
// separate step and is NOT in this file.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { saveDraftSubmission } from "@/lib/weeks/save-draft-submission";
import { saveWeekResource } from "@/lib/weeks/week-resource";
import { lockWeek } from "@/lib/weeks/lock-week";
import { uploadSubmissionFile } from "@/lib/submissions/upload-file";
import { uploadWeekResourceFile } from "@/lib/weeks/upload-week-resource";
import type { SubmissionModeCode } from "@/types/types";

async function resolveStudentId(): Promise<string> {
    const studentId = await getCurrentStudentId();
    if (!studentId) {
        throw new Error("Could not resolve the current student account.");
    }
    return studentId;
}

// Saves (or re-saves) a TEXT or LINK draft - no file involved.
export async function saveDraftTextOrLinkAction(input: {
    taskId: string;
    mode: Extract<SubmissionModeCode, "TEXT" | "LINK">;
    textContent?: string;
    externalLink?: string;
}) {
    await requireRole(["student"]);

    try {
        const studentId = await resolveStudentId();

        const submission = await saveDraftSubmission({
            studentId,
            taskId: input.taskId,
            mode: input.mode,
            textContent: input.textContent ?? null,
            externalLink: input.externalLink ?? null,
        });

        revalidatePath("/student");
        return { success: true, data: submission };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

// Saves (or re-saves) a FILE draft: uploads to Supabase Storage first,
// then writes the DRAFT Submission row with the resulting path.
export async function saveDraftFileAction(formData: FormData) {
    await requireRole(["student"]);

    try {
        const studentId = await resolveStudentId();
        const taskId = formData.get("taskId") as string;
        const file = formData.get("file") as File;

        if (!taskId || !file) {
            throw new Error("Missing taskId or file.");
        }

        const fileUrl = await uploadSubmissionFile({ taskId, studentId, file });

        const submission = await saveDraftSubmission({
            studentId,
            taskId,
            mode: "FILE",
            fileUrl,
        });

        revalidatePath("/student");
        return { success: true, data: submission };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

// Uploads (or replaces) the Week's ONE required file.
export async function uploadWeekResourceAction(formData: FormData) {
    await requireRole(["student"]);

    try {
        const studentId = await resolveStudentId();
        const weekId = formData.get("weekId") as string;
        const file = formData.get("file") as File;

        if (!weekId || !file) {
            throw new Error("Missing weekId or file.");
        }

        const fileUrl = await uploadWeekResourceFile({ weekId, studentId, file });

        const resource = await saveWeekResource({ studentId, weekId, fileUrl });

        revalidatePath("/student");
        return { success: true, data: resource };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

// Locks the WHOLE Week (requires the required file to exist).
export async function lockWeekAction(input: { weekId: string }) {
    await requireRole(["student"]);

    try {
        const studentId = await resolveStudentId();

        const result = await lockWeek({ studentId, weekId: input.weekId });

        revalidatePath("/student");
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}