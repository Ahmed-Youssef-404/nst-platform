// src/lib/weeks/resource-eligibility.ts
//
// Centralized, authoritative resource eligibility and state evaluation service.
// Both file uploads and Google Drive links are representations of the SAME
// required weekly resource.
//
// Invariants:
// - FILE: a valid uploaded file reference exists and no Drive URL is active.
// - DRIVE_LINK: a valid Drive URL exists and no uploaded file reference is active.
// - No submission: neither method is active.
// - Any row with both or neither populated is not treated as a valid resource submission.
//
// Both methods follow the exact same review, halving, locking, and penalty rules.

import type {
    WeekResourceStatusCode,
    WeekResourceTypeCode,
} from "@/types/types";
import { validateGoogleDriveUrl } from "@/lib/weeks/validate-drive-url";

export interface WeekResourceRecord {
    id?: string;
    type?: WeekResourceTypeCode | null;
    fileUrl?: string | null;
    driveUrl?: string | null;
    status: WeekResourceStatusCode;
    submittedAt?: Date | null;
    lockedAt?: Date | null;
}

export type ResourceSubmissionState =
    | { state: "NONE" }
    | {
          state: "VALID_FILE";
          fileUrl: string;
          status: WeekResourceStatusCode;
          isLocked: boolean;
          submittedAt: Date | null;
          lockedAt: Date | null;
      }
    | {
          state: "VALID_DRIVE_LINK";
          driveUrl: string;
          status: WeekResourceStatusCode;
          isLocked: boolean;
          submittedAt: Date | null;
          lockedAt: Date | null;
      }
    | { state: "INVALID"; reason: string };

/**
 * Returns the granular state of a WeekResourceSubmission row.
 */
export function getResourceSubmissionState(
    resource: WeekResourceRecord | null | undefined
): ResourceSubmissionState {
    if (!resource) {
        return { state: "NONE" };
    }

    const hasFile = Boolean(resource.fileUrl && resource.fileUrl.trim().length > 0);
    const hasDrive = Boolean(resource.driveUrl && resource.driveUrl.trim().length > 0);

    // Mutual exclusion violation: both populated
    if (hasFile && hasDrive) {
        return {
            state: "INVALID",
            reason: "Both file and Drive link are populated. Submissions must be mutually exclusive.",
        };
    }

    // Neither populated
    if (!hasFile && !hasDrive) {
        return { state: "NONE" };
    }

    const isLocked = Boolean(resource.lockedAt);
    const submittedAt = resource.submittedAt ?? null;
    const lockedAt = resource.lockedAt ?? null;

    // FILE method
    if (hasFile && (!resource.type || resource.type === "FILE")) {
        return {
            state: "VALID_FILE",
            fileUrl: resource.fileUrl!.trim(),
            status: resource.status,
            isLocked,
            submittedAt,
            lockedAt,
        };
    }

    // DRIVE_LINK method
    if (hasDrive && (!resource.type || resource.type === "DRIVE_LINK")) {
        const driveUrl = resource.driveUrl!.trim();
        const validation = validateGoogleDriveUrl(driveUrl);
        if (!validation.valid) {
            return {
                state: "INVALID",
                reason: validation.error ?? "Invalid Google Drive link format.",
            };
        }

        return {
            state: "VALID_DRIVE_LINK",
            driveUrl: validation.normalizedUrl ?? driveUrl,
            status: resource.status,
            isLocked,
            submittedAt,
            lockedAt,
        };
    }

    return {
        state: "INVALID",
        reason: "Mismatch between resource type and populated content.",
    };
}

/**
 * Checks whether a student has a valid, authoritative persisted resource submission.
 * Returns true if and only if exactly one valid method (FILE or DRIVE_LINK) is active.
 */
export function hasValidResourceSubmission(
    resource: WeekResourceRecord | null | undefined
): boolean {
    const state = getResourceSubmissionState(resource);
    return state.state === "VALID_FILE" || state.state === "VALID_DRIVE_LINK";
}

/**
 * Checks whether the instructor has reviewed and ACCEPTED the submitted deliverable.
 */
export function isResourceAccepted(
    resource: WeekResourceRecord | null | undefined
): boolean {
    if (!hasValidResourceSubmission(resource)) {
        return false;
    }
    return resource?.status === "ACCEPTED";
}

/**
 * Standard rule for positive reward halving in Beginner track:
 * All positive rewards are halved unless the student submitted a valid resource
 * AND the instructor explicitly ACCEPTED it.
 * (PENDING, REJECTED, or missing resources all result in halving positive rewards).
 */
export function isRewardHalvedForResource(
    resource: WeekResourceRecord | null | undefined
): boolean {
    return !isResourceAccepted(resource);
}

/**
 * Validates whether a task submission has valid content matching its mode.
 */
export function hasValidTaskSubmissionContent(submission: {
    mode: string;
    fileUrl?: string | null;
    externalLink?: string | null;
    textContent?: string | null;
} | null | undefined): boolean {
    if (!submission) return false;

    switch (submission.mode) {
        case "FILE":
            return Boolean(submission.fileUrl && submission.fileUrl.trim().length > 0);
        case "LINK":
            return Boolean(submission.externalLink && submission.externalLink.trim().length > 0);
        case "TEXT":
            return Boolean(submission.textContent && submission.textContent.trim().length > 0);
        default:
            return false;
    }
}
