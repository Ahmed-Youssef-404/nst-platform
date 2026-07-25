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
    const supabase = await createClient();

    const path = `${taskId}/${studentId}/submission.${extension}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
            upsert: true, // resubmission overwrites the previous file
            contentType: file.type,
        });

    if (error) {
        throw new Error(`File upload failed: ${error.message}`);
    }

    return path;
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