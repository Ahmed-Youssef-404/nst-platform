"use server";
// src/lib/actions/instructor-st.ts
// Server Action: an Instructor adds/deducts ST for a student in one of
// their assigned groups. requireRole() is called OUTSIDE try/catch, per
// the project pattern. The acting instructor id always comes from the
// session - never from the client.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { applyInstructorAdjustment } from "@/lib/st-economy/instructor-adjustment";
import {
    ST_ADJUST_MAX_AMOUNT,
    ST_ADJUST_MAX_NOTE_LENGTH,
} from "@/lib/st-economy/instructor-adjustment-limits";

export interface AdjustStudentSTInput {
    studentId: string;
    direction: "ADD" | "DEDUCT";
    amount: number;
    note?: string;
    requestId: string; // client-generated UUID, one per dialog session
}

export type AdjustStudentSTResult =
    | { success: true; data: { balance: number; alreadyApplied: boolean } }
    | { success: false; error: string };

export async function adjustStudentSTAction(
    input: AdjustStudentSTInput
): Promise<AdjustStudentSTResult> {
    const user = await requireRole(["instructor"]);

    try {
        // Runtime validation - server actions are callable with anything.
        if (typeof input?.studentId !== "string" || input.studentId.length === 0) {
            throw new Error("Invalid student.");
        }
        if (input.direction !== "ADD" && input.direction !== "DEDUCT") {
            throw new Error("Invalid operation.");
        }
        if (
            !Number.isInteger(input.amount) ||
            input.amount < 1 ||
            input.amount > ST_ADJUST_MAX_AMOUNT
        ) {
            throw new Error(
                `Amount must be a whole number between 1 and ${ST_ADJUST_MAX_AMOUNT}.`
            );
        }
        if (
            typeof input.requestId !== "string" ||
            !/^[A-Za-z0-9-]{8,64}$/.test(input.requestId)
        ) {
            throw new Error("Invalid request.");
        }

        const note = typeof input.note === "string" ? input.note.trim() : "";
        if (note.length > ST_ADJUST_MAX_NOTE_LENGTH) {
            throw new Error(
                `Reason must be ${ST_ADJUST_MAX_NOTE_LENGTH} characters or fewer.`
            );
        }

        const result = await applyInstructorAdjustment({
            instructorId: user.id,
            studentId: input.studentId,
            direction: input.direction,
            amount: input.amount,
            note: note.length > 0 ? note : null,
            idempotencyKey: `inst-adj:${user.id}:${input.requestId}`,
        });

        revalidatePath("/instructor/students");
        revalidatePath("/student", "layout");

        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
