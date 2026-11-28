// src/lib/submissions/upload-file.ts
//
// Handles uploading a Submission's file to Supabase Storage, for
// mode = FILE submissions only. This is kept separate from
// create-submission.ts because the upload (external I/O) and the DB
// write (Submission row) are two different concerns - the Server Action
// calls this first to get a fileUrl, then passes that fileUrl into
// createOrUpdateSubmission().
//
// Storage layout: submissions/{taskId}/{studentId}/submission.{ext}
// - The folder (taskId/studentId) is already unique and deterministic,
//   matching the DB's own uniqueness rule (one Submission per
//   studentId+taskId) - so the filename itself doesn't need to be
//   unique or descriptive. We deliberately use a FIXED name
//   ("submission.pdf" / "submission.zip") instead of the student's
//   original filename, to avoid sanitizing arbitrary user input
//   (Arabic text, spaces, symbols) into a valid storage path.
// - A resubmit uploads to the same path; upsert: true overwrites the
//   previous file in place (no history is kept, matching the Submission
//   row itself having no history table).
//
// A separate, human-readable name (student name + task title) is only
// generated at DOWNLOAD time via buildSubmissionDownloadName() - that's
// just a display label for the browser's save dialog, not a real path,
// so it's free to contain spaces, Arabic, etc.
//
// Bucket: "submissions" (private - not publicly readable; access should
// go through signed URLs generated on demand, not a public bucket).

import { createHash } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { createClient } from "@/lib/supabase/server";
import {
    SUBMISSION_MAX_FILE_SIZE_BYTES,
    SUBMISSION_ALLOWED_MIME_TYPES,
} from "@/types/types";

const BUCKET_NAME = "submissions";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
};

export async function uploadSubmissionFile(params: {
    taskId: string;
    studentId: string;
    file: File;
}): Promise<string> {
    const { taskId, studentId, file } = params;

    if (file.size > SUBMISSION_MAX_FILE_SIZE_BYTES) {
        throw new Error("File exceeds the 5MB size limit.");
    }

    if (
        !SUBMISSION_ALLOWED_MIME_TYPES.includes(
            file.type as (typeof SUBMISSION_ALLOWED_MIME_TYPES)[number]
        )
    ) {
        throw new Error("Only PDF and ZIP files are allowed.");
    }

    const extension = EXTENSION_BY_MIME_TYPE[file.type];
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentHash = createHash("sha256")
        .update(buffer)
        .digest("hex")
        .slice(0, 16);
    const supabase = await createClient();

    // Include a content hash in the object path so replacing a file with
    // different bytes changes `fileUrl` (updating lastSavedAt), while
    // re-uploading identical bytes yields the exact same `fileUrl`.
    const path = `${taskId}/${studentId}/submission-${contentHash}.${extension}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, buffer, {
            upsert: true,
            contentType: file.type,
        });

    if (error) {
        throw new Error(`File upload failed: ${error.message}`);
    }

    return path;
}

/**
 * Best-effort post-commit cleanup for a superseded task submission file.
 * Runs ONLY after the database update succeeds, never deletes when the path
 * matches the new file or is still referenced by any submission/resource row,
 * and never throws so cleanup failures cannot invalidate a successful save.
 */
export async function cleanupUnusedSubmissionFile(params: {
    prisma: Pick<PrismaClient, "submission" | "weekResourceSubmission">;
    oldFileUrl: string | null | undefined;
    newFileUrl: string | null | undefined;
    deleteFile?: (path: string) => Promise<void>;
}): Promise<boolean> {
    const { prisma, oldFileUrl, newFileUrl, deleteFile } = params;

    if (!oldFileUrl || oldFileUrl === newFileUrl) {
        return false;
    }

    if (oldFileUrl.startsWith("week-resources/")) {
        return false;
    }

    try {
        const [submissionRefs, resourceRefs] = await Promise.all([
            prisma.submission.count({ where: { fileUrl: oldFileUrl } }),
            prisma.weekResourceSubmission.count({ where: { fileUrl: oldFileUrl } }),
        ]);

        if (submissionRefs > 0 || resourceRefs > 0) {
            return false;
        }

        if (deleteFile) {
            await deleteFile(oldFileUrl);
            return true;
        }

        if (
            !process.env.NEXT_PUBLIC_SUPABASE_URL ||
            !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ) {
            return false;
        }

        const supabase = await createClient();
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([oldFileUrl]);

        if (error) {
            console.warn(
                `Failed to clean up superseded submission file "${oldFileUrl}": ${error.message}`
            );
            return false;
        }

        return true;
    } catch (error) {
        console.warn(
            `Failed to clean up superseded submission file "${oldFileUrl}":`,
            error instanceof Error ? error.message : error
        );
        return false;
    }
}

// Generates a short-lived signed URL to view/download a submitted file.
// Used by the Instructor (grading) and the Student (viewing their own
// submission) - the bucket itself is private, so this is the only way
// to actually read a file back.
export async function getSubmissionFileUrl(
    path: string,
    expiresInSeconds: number = 60 * 10
): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, expiresInSeconds);

    if (error || !data) {
        throw new Error(
            `Could not generate a download link: ${error?.message ?? "unknown error"}`
        );
    }

    return data.signedUrl;
}

// Builds a human-readable filename for the browser's download dialog only
// (e.g. "Ahmed - Create Simple Landing Page.pdf"). This is NOT the storage
// path - it's purely cosmetic, generated fresh at download time from the
// student's name and task title, so it's free to contain spaces, Arabic
// characters, etc. The actual storage `path` (fixed name) is unaffected.
export function buildSubmissionDownloadName(params: {
    studentName: string;
    taskTitle: string;
    storagePath: string;
}): string {
    const extension = params.storagePath.split(".").pop() ?? "pdf";
    const safeLabel = `${params.studentName} - ${params.taskTitle}`.trim();
    return `${safeLabel}.${extension}`;
}