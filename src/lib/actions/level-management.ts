"use server";
// src/lib/actions/level-management.ts
// Server Actions for Level management.
// Restricted to SuperAdmin only.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createLevel } from "@/lib/levels/manage-level";
import type { CreateLevelInput } from "@/types/types";

export async function createLevelAction(input: CreateLevelInput) {
    // Only a SuperAdmin can create Levels
    await requireRole(["super_admin"]);

    try {
        const levels = await createLevel(input);
        revalidatePath("/super-admin/levels");
        return { success: true, data: levels };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}