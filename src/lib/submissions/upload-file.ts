// src/lib/submissions/upload-file.ts
//
// Handles uploading a Submission's file to Supabase Storage, for
// mode = FILE submissions only. This is kept separate from
// create-submission.ts because the upload (external I/O) and the DB
// write (Submission row) are two different concerns - the Server Action
// calls this first to get a fileUrl, then passes that fileUrl into
// createOrUpdateSubmission().
//
// Storage layout: submissions/{taskId}/{studentId}/submission-{sha256}.{ext}
// - The folder (taskId/studentId) isolates each student's submission files per task,
//   and the 16-char SHA-256 content-hash suffix ensures different file bytes
//   produce distinct `fileUrl`s (updating `lastSavedAt`) while re-uploading the
//   exact same bytes resolves to the exact same path (`upsert: true`).
// - When a submission replaces or removes its active file in the database,
//   cleanupUnusedSubmissionFile() runs strictly post-commit to delete the old
//   object only if no submission/resource row still references it.
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

const uploadLocks = new Map<string, Promise<void>>();
const mutationLocks = new Map<string, Promise<void>>();

async function runWithKeyedLock<T>(
    lockMap: Map<string, Promise<void>>,
    key: string,
    fn: () => Promise<T>
): Promise<T> {
    const previous = lockMap.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
        release = resolve;
    });
    const queued = previous.then(() => current);
    lockMap.set(key, queued);

    await previous;
    try {
        return await fn();
    } finally {
        release();
        if (lockMap.get(key) === queued) {
            lockMap.delete(key);
        }
    }
}

/**
 * Serializes upload + DB save + cleanup across concurrent Server Action requests
 * for the same (taskId, studentId) within the current server process.
 */
export function withSubmissionUploadLock<T>(
    taskId: string,
    studentId: string,
    fn: () => Promise<T>
): Promise<T> {
    return runWithKeyedLock(uploadLocks, `${taskId}:${studentId}`, fn);
}

/**
 * Serializes DB commit + post-commit old-file cleanup for the same (taskId, studentId)
 * within the current server process so an overlapping update cannot switch back to
 * oldFileUrl between the DB commit and Storage deletion.
 */
export function withSubmissionMutationLock<T>(
    taskId: string,
    studentId: string,
    fn: () => Promise<T>
): Promise<T> {
    return runWithKeyedLock(mutationLocks, `${taskId}:${studentId}`, fn);
}

export async function uploadSubmissionFile(
    params: {
        taskId: string;
        studentId: string;
        file: File;
    },
    options?: {
        uploadObject?: (
            path: string,
            buffer: Buffer,
            contentType: string
        ) => Promise<void>;
    }
): Promise<string> {
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

    // Include a content hash in the object path so replacing a file with
    // different bytes changes `fileUrl` (updating lastSavedAt), while
    // re-uploading identical bytes yields the exact same `fileUrl`.
    const path = `${taskId}/${studentId}/submission-${contentHash}.${extension}`;

    if (options?.uploadObject) {
        await options.uploadObject(path, buffer, file.type);
        return path;
    }

    const supabase = await createClient();

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
 * Extracts a Supabase Storage object path inside the `"submissions"` bucket from
 * either a persisted relative path (`{taskId}/{studentId}/...`) or a Supabase
 * Storage URL. Returns null for external links, other buckets, `week-resources/`,
 * or invalid paths so unrelated objects are never targeted.
 */
export function extractSubmissionStoragePath(
    fileUrl: string | null | undefined
): string | null {
    const trimmed = fileUrl?.trim();
    if (!trimmed) {
        return null;
    }

    let candidate = trimmed;

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            const match =
                /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/.exec(
                    parsed.pathname
                );
            if (!match || match[1] !== BUCKET_NAME) {
                return null;
            }
            candidate = decodeURIComponent(match[2]);
        } catch {
            return null;
        }
    }

    candidate = candidate.replace(/^\/+/, "");
    if (candidate.startsWith(`${BUCKET_NAME}/`)) {
        candidate = candidate.slice(BUCKET_NAME.length + 1);
    }

    if (
        !candidate ||
        candidate.startsWith("week-resources/") ||
        candidate.includes("..")
    ) {
        return null;
    }

    return candidate;
}

/**
 * Safely deletes a superseded submission file from Supabase Storage ONLY AFTER
 * the database transaction committing the new submission has succeeded.
 * Refuses to delete if the old path matches the new path, belongs to week
 * deliverables or another student/task, or is still referenced elsewhere.
 * Never throws so cleanup failures cannot fail or reverse a committed save.
 */
export async function cleanupUnusedSubmissionFile(params: {
    prisma: Pick<PrismaClient, "submission" | "weekResourceSubmission">;
    oldFileUrl: string | null | undefined;
    newFileUrl: string | null | undefined;
    taskId?: string;
    studentId?: string;
    deleteFile?: (path: string) => Promise<void>;
}): Promise<boolean> {
    const { prisma, oldFileUrl, newFileUrl, taskId, studentId, deleteFile } =
        params;

    const oldStoragePath = extractSubmissionStoragePath(oldFileUrl);
    if (!oldStoragePath) {
        return false;
    }

    const newStoragePath = extractSubmissionStoragePath(newFileUrl);
    if (oldStoragePath === newStoragePath) {
        return false;
    }

    if (
        taskId &&
        studentId &&
        !oldStoragePath.startsWith(`${taskId}/${studentId}/`)
    ) {
        return false;
    }

    const refCandidates = Array.from(
        new Set([oldFileUrl!.trim(), oldStoragePath])
    );

    try {
        const [submissionRefs, resourceRefs] = await Promise.all([
            prisma.submission.count({
                where: { fileUrl: { in: refCandidates } },
            }),
            prisma.weekResourceSubmission.count({
                where: { fileUrl: { in: refCandidates } },
            }),
        ]);

        if (submissionRefs > 0 || resourceRefs > 0) {
            return false;
        }

        if (deleteFile) {
            await deleteFile(oldStoragePath);
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
            .remove([oldStoragePath]);

        if (error) {
            console.warn(
                `Failed to delete superseded submission file (bucket="${BUCKET_NAME}", path="${oldStoragePath}", taskId="${taskId ?? ""}", studentId="${studentId ?? ""}"): ${error.message}`
            );
            return false;
        }

        return true;
    } catch (error) {
        console.warn(
            `Failed to delete superseded submission file (bucket="${BUCKET_NAME}", path="${oldStoragePath}", taskId="${taskId ?? ""}", studentId="${studentId ?? ""}"):`,
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