// src/app/api/student/weeks/[id]/resource/upload/route.ts
//
// Dedicated API route handler for uploading Beginner week deliverable files.
// Used with XMLHttpRequest to provide real byte-accurate progress reporting,
// upload cancellation, and strict 1 MiB server enforcement.
//
// Bypasses the 1MB Server Action request-body limitation while preserving
// authentication, authorization, ownership checks, and atomic cleanup on error.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { uploadWeekResourceFile } from "@/lib/weeks/upload-week-resource";
import { saveWeekResource, removeWeekResourceFile } from "@/lib/weeks/week-resource";
import {
    WEEK_RESOURCE_MAX_FILE_SIZE_BYTES,
    WEEK_RESOURCE_ALLOWED_MIME_TYPES,
} from "@/types/types";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await requireRole(["student"]);
        const studentId = await getCurrentStudentId();
        if (!studentId) {
            return NextResponse.json(
                { success: false, error: "Could not resolve the current student account." },
                { status: 401 }
            );
        }

        const { id: weekId } = await context.params;
        if (!weekId) {
            return NextResponse.json(
                { success: false, error: "Missing weekId parameter." },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file was uploaded." },
                { status: 400 }
            );
        }

        // Strict 1 MiB server-side check
        if (file.size > WEEK_RESOURCE_MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                {
                    success: false,
                    error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the strict 1 MB (1,048,576 bytes) limit.`,
                },
                { status: 400 }
            );
        }

        if (
            !WEEK_RESOURCE_ALLOWED_MIME_TYPES.includes(
                file.type as (typeof WEEK_RESOURCE_ALLOWED_MIME_TYPES)[number]
            )
        ) {
            return NextResponse.json(
                { success: false, error: "Only PDF and ZIP files are allowed." },
                { status: 400 }
            );
        }

        // 1. Upload to storage
        const fileUrl = await uploadWeekResourceFile({
            weekId,
            studentId,
            file,
        });

        // 2. Persist to database, with orphan cleanup if DB write fails
        let resource;
        try {
            resource = await saveWeekResource({
                studentId,
                weekId,
                fileUrl,
            });
        } catch (dbError) {
            // Clean up the uploaded file so no orphaned objects exist
            await removeWeekResourceFile(fileUrl);
            throw dbError;
        }

        revalidatePath("/student");
        return NextResponse.json({ success: true, data: resource });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to upload deliverable.",
            },
            { status: 500 }
        );
    }
}
