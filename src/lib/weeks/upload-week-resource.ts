// src/lib/weeks/upload-week-resource.ts
//
// Uploads a Student's Week required deliverable file to Supabase Storage.
// Enforces a strict 1 MiB (1,048,576 bytes) file size limit and allowed MIME types.
//
// Storage layout:
//   week-resources/{weekId}/{studentId}/resource.{ext}

import { createClient } from "@/lib/supabase/server";
import {
    WEEK_RESOURCE_MAX_FILE_SIZE_BYTES,
    WEEK_RESOURCE_ALLOWED_MIME_TYPES,
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

    if (file.size > WEEK_RESOURCE_MAX_FILE_SIZE_BYTES) {
        throw new Error("File exceeds the 1MB (1,048,576 bytes) size limit.");
    }

    if (
        !WEEK_RESOURCE_ALLOWED_MIME_TYPES.includes(
            file.type as (typeof WEEK_RESOURCE_ALLOWED_MIME_TYPES)[number]
        )
    ) {
        throw new Error("Only PDF and ZIP files are allowed.");
    }

    const extension = EXTENSION_BY_MIME_TYPE[file.type] ?? "pdf";
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