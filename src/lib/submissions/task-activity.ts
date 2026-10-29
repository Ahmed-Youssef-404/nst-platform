// src/lib/submissions/task-activity.ts
//
// Pure helpers (no Prisma, no I/O) for the "new student activity"
// indicators shown to Instructors in the grading screens.
//
// Model: every Submission row has an `activityVersion` that goes up by 1
// whenever a Student save/upload really changes the persisted answer.
// SubmissionActivityReview.reviewedVersion records the highest version an
// Instructor of the Group has seen. A task is "unreviewed" while
// activityVersion > reviewedVersion.
//
// There is exactly one Submission per (student, task), so counting
// unreviewed Submissions == counting DISTINCT tasks with new activity.

export interface SubmissionContentSnapshot {
    mode: string;
    fileUrl: string | null;
    externalLink: string | null;
    textContent: string | null;
}

function normalizeText(value: string | null | undefined): string {
    return (value ?? "").replace(/\r\n/g, "\n").trim();
}

// Did this write change the persisted answer in a way an Instructor
// should care about?
//   - first write for the (student, task)            -> yes
//   - FILE: every completed upload counts. The storage path is reused on
//     re-upload (same path => same fileUrl), so a changed file can't be
//     detected by comparing columns; the persisted upload IS the activity.
//   - mode switched (e.g. LINK -> TEXT)               -> yes
//   - LINK / TEXT: only if the content differs, ignoring surrounding
//     whitespace and CRLF-vs-LF differences          -> otherwise no-op
export function isMeaningfulSubmissionChange(
    existing: SubmissionContentSnapshot | null,
    next: SubmissionContentSnapshot
): boolean {
    if (!existing) return true;
    if (next.mode === "FILE") return true;
    if (existing.mode !== next.mode) return true;

    if (next.mode === "LINK") {
        return normalizeText(existing.externalLink) !== normalizeText(next.externalLink);
    }
    if (next.mode === "TEXT") {
        return normalizeText(existing.textContent) !== normalizeText(next.textContent);
    }
    return true;
}

// Prisma upsert fragments for the activity counter. Spread `create` into the
// upsert's create block and `update` into its update block. `increment` is
// applied by the database, so concurrent writers can't lose an update.
export function buildActivityWrite(
    existing: SubmissionContentSnapshot | null,
    next: SubmissionContentSnapshot
): {
    create: { activityVersion: number };
    update: { activityVersion?: { increment: number } };
} {
    return {
        create: { activityVersion: 1 },
        update: isMeaningfulSubmissionChange(existing, next)
            ? { activityVersion: { increment: 1 } }
            : {},
    };
}

// A graded / finalized task can no longer receive student activity, so it
// never counts as "new activity" (otherwise a save landing between an
// Instructor opening the task and grading it would leave a stuck counter).
export function isTaskActivityUnreviewed(input: {
    activityVersion: number;
    reviewedVersion?: number | null;
    isGraded: boolean;
}): boolean {
    if (input.isGraded) return false;
    return input.activityVersion > (input.reviewedVersion ?? 0);
}