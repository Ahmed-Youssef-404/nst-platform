"use server";
// src/lib/actions/submission-management.ts
// Server Actions for Students submitting/resubmitting Task work.
// Restricted to Student only. studentId always comes from
// getCurrentStudentId() (bridged via email, see get-current-user.ts) -
// never from client input.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { createOrUpdateSubmission } from "@/lib/submissions/create-submission";
import {
    uploadSubmissionFile,
    getSubmissionFileUrl,
} from "@/lib/submissions/upload-file";
import type { SubmissionModeCode } from "@/types/types";

async function resolveStudentId(): Promise<string> {
    const studentId = await getCurrentStudentId();
    if (!studentId) {
        throw new Error("Could not resolve the current student account.");
    }
    return studentId;
}

// Submits (or resubmits) a TEXT or LINK submission - no file involved.
export async function submitTextOrLinkAction(input: {
    taskId: string;
    mode: Extract<SubmissionModeCode, "TEXT" | "LINK">;
    textContent?: string;
    externalLink?: string;
}) {
    await requireRole(["student"]);

    try {
        const studentId = await resolveStudentId();

        const submission = await createOrUpdateSubmission({
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

// Submits (or resubmits) a FILE submission: uploads to Supabase Storage
// first, then writes the Submission row with the resulting path.
export async function submitFileAction(formData: FormData) {
    await requireRole(["student"]);

    try {
        const studentId = await resolveStudentId();
        const taskId = formData.get("taskId") as string;
        const file = formData.get("file") as File;

        if (!taskId || !file) {
            throw new Error("Missing taskId or file.");
        }

        const fileUrl = await uploadSubmissionFile({ taskId, studentId, file });

        const submission = await createOrUpdateSubmission({
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

// Generates a temporary signed URL so a Student can view/download their
// own previously-submitted file (the storage bucket is private).
export async function getSubmissionFileUrlAction(fileUrl: string) {
    await requireRole(["student", "instructor"]);

    try {
        const url = await getSubmissionFileUrl(fileUrl);
        return { success: true, data: url };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}