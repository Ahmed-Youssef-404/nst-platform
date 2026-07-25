"use server";
// src/lib/actions/session-management.ts
// Server Actions for Session/Task/Hint creation and Session editing.
// Restricted to Instructor only. The instructorId used for authorization
// checks always comes from the authenticated session (requireRole), never
// from client input - this prevents a client from claiming to be an
// instructor assigned to a Group they don't actually belong to.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createSession } from "@/lib/sessions/create-session";
import { updateSession } from "@/lib/sessions/update-session";
import type {
    CreateSessionInput,
    UpdateSessionInput,
} from "@/types/types";

export async function createSessionAction(
    input: Omit<CreateSessionInput, "createdBy">
) {
    // Only an Instructor can create Sessions
    const user = await requireRole(["instructor"]);

    try {
        const session = await createSession({
            ...input,
            createdBy: user.id,
        });
        revalidatePath("/instructor/sessions");
        return { success: true, data: session };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function updateSessionAction(
    input: Omit<UpdateSessionInput, "instructorId">
) {
    // Only an Instructor can edit a Session, and only while it's upcoming
    const user = await requireRole(["instructor"]);

    try {
        const session = await updateSession({
            ...input,
            instructorId: user.id,
        });
        revalidatePath("/instructor/sessions");
        return { success: true, data: session };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}