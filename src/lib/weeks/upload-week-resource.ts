// src/lib/weeks/upload-week-resource.ts
//
// Uploads a Student's Week required file to Supabase Storage. Kept
// separate from the DB write (week-resource.ts) for the same reason as
// submissions/upload-file.ts: external I/O and the DB write are two
// different concerns - the Server Action uploads first to get the path,
// then passes it to saveWeekResource().
//
// Storage layout (same private "submissions" bucket as Task files):
//   week-resources/{weekId}/{studentId}/resource.{ext}
// The "week-resources/" prefix keeps these apart from Task submission
// files, whose paths start with a taskId ({taskId}/{studentId}/...).
// Fixed filename for the same reasons as Task files (no sanitizing of
// arbitrary user input; a re-upload overwrites in place, no history).
//
// Reading the file back reuses getSubmissionFileUrl() from
// submissions/upload-file.ts - it takes any path in the same bucket.
//
// Same limits as Task files: PDF/ZIP only, max 5MB.

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

export async function uploadWeekResourceFile(params: {
    weekId: string;
    studentId: string;
    file: File;
}): Promise<string> {
    const { weekId, studentId, file } = params;

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

    const path = `week-resources/${weekId}/${studentId}/resource.${extension}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
            upsert: true, // replacing the file overwrites the previous one
            contentType: file.type,
        });

    if (error) {
        throw new Error(`File upload failed: ${error.message}`);
    }

    return path;
}