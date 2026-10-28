// src/lib/weeks/week-resource.ts
//
// BEGINNER track: the Week's ONE required resource (file or Google Drive link).
// Completely separate from Task submissions - one row per (studentId, weekId),
// tied to the Week's requiredFileLabel.
//
// Mutually exclusive: exactly one method (FILE or DRIVE_LINK) is active at any time.
// Replacing the resource resets status to PENDING. Switching from file to Drive
// deactivates the file and cleans up the old storage object. Switching from
// Drive to file clears the Drive URL.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
    UploadWeekResourceInput,
    SaveWeekDriveLinkInput,
    WeekResourceResult,
} from "@/types/types";
import { assertStudentCanWriteInWeek } from "@/lib/weeks/week-student-guard";
import { validateGoogleDriveUrl } from "@/lib/weeks/validate-drive-url";
import { createClient } from "@/lib/supabase/server";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BUCKET_NAME = "submissions";

export async function removeWeekResourceFile(path: string): Promise<void> {
    if (!path) return;
    try {
        const supabase = await createClient();
        await supabase.storage.from(BUCKET_NAME).remove([path]);
    } catch {
        // Safe catch to ensure cleanup failure does not break the main transaction
    }
}

/**
 * Saves or replaces the Week's deliverable using an uploaded FILE.
 * Clears any previously stored driveUrl to enforce mutual exclusion.
 */
export async function saveWeekResource(
    input: UploadWeekResourceInput
): Promise<WeekResourceResult> {
    const fileUrl = input.fileUrl?.trim();
    if (!fileUrl) {
        throw new Error("A file must be uploaded.");
    }

    await assertStudentCanWriteInWeek(prisma, {
        studentId: input.studentId,
        weekId: input.weekId,
    });

    const now = new Date();

    const resource = await prisma.weekResourceSubmission.upsert({
        where: {
            studentId_weekId: {
                studentId: input.studentId,
                weekId: input.weekId,
            },
        },
        create: {
            studentId: input.studentId,
            weekId: input.weekId,
            type: "FILE",
            fileUrl,
            driveUrl: null,
            status: "PENDING",
            submittedAt: now,
        },
        update: {
            type: "FILE",
            fileUrl,
            driveUrl: null,
            status: "PENDING",
            submittedAt: now,
        },
    });

    return resource as unknown as WeekResourceResult;
}

/**
 * Saves or replaces the Week's deliverable using a Google Drive link.
 * Clears any previously stored fileUrl and cleans up the old storage file to enforce mutual exclusion.
 */
export async function saveWeekDriveLink(
    input: SaveWeekDriveLinkInput
): Promise<WeekResourceResult> {
    const validation = validateGoogleDriveUrl(input.driveUrl);
    if (!validation.valid || !validation.normalizedUrl) {
        throw new Error(validation.error ?? "Invalid Google Drive link.");
    }

    await assertStudentCanWriteInWeek(prisma, {
        studentId: input.studentId,
        weekId: input.weekId,
    });

    const existing = await prisma.weekResourceSubmission.findUnique({
        where: {
            studentId_weekId: {
                studentId: input.studentId,
                weekId: input.weekId,
            },
        },
        select: { fileUrl: true },
    });

    const now = new Date();

    const resource = await prisma.weekResourceSubmission.upsert({
        where: {
            studentId_weekId: {
                studentId: input.studentId,
                weekId: input.weekId,
            },
        },
        create: {
            studentId: input.studentId,
            weekId: input.weekId,
            type: "DRIVE_LINK",
            driveUrl: validation.normalizedUrl,
            fileUrl: null,
            status: "PENDING",
            submittedAt: now,
        },
        update: {
            type: "DRIVE_LINK",
            driveUrl: validation.normalizedUrl,
            fileUrl: null,
            status: "PENDING",
            submittedAt: now,
        },
    });

    // Cleanup old file from storage if there was one
    if (existing?.fileUrl) {
        await removeWeekResourceFile(existing.fileUrl);
    }

    return resource as unknown as WeekResourceResult;
}