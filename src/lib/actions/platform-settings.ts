"use server";
// src/lib/actions/platform-settings.ts
// Server Actions for global platform settings.
// Restricted to SuperAdmin only - enforced here, not just in the UI.

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireRole } from "@/lib/auth/require-role";
import { PLATFORM_SETTING_ID } from "@/lib/data/get-maintenance-state";
import { MAINTENANCE_MESSAGE_MAX } from "@/lib/maintenance-constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });


export interface SetMaintenanceInput {
    enabled: boolean;
    message?: string | null;
}

export type SetMaintenanceResult =
    | { success: true; enabled: boolean; message: string | null }
    | { success: false; error: string };

export async function setMaintenanceModeAction(
    input: SetMaintenanceInput
): Promise<SetMaintenanceResult> {
    // 1. Verified server-side role check (session -> Supabase -> app_metadata.role)
    let userId: string;
    try {
        const user = await requireRole(["super_admin"]);
        userId = user.id;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Access denied.",
        };
    }

    // 2. Validate input (never trust the client)
    if (typeof input?.enabled !== "boolean") {
        return { success: false, error: "Invalid request." };
    }
    const message =
        typeof input.message === "string"
            ? input.message.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim()
            : "";
    if (message.length > MAINTENANCE_MESSAGE_MAX) {
        return {
            success: false,
            error: `Message must be ${MAINTENANCE_MESSAGE_MAX} characters or fewer.`,
        };
    }

    // 3. Persist (singleton row)
    try {
        const saved = await prisma.platformSetting.upsert({
            where: { id: PLATFORM_SETTING_ID },
            create: {
                id: PLATFORM_SETTING_ID,
                maintenanceMode: input.enabled,
                maintenanceMessage: message || null,
                updatedById: userId,
            },
            update: {
                maintenanceMode: input.enabled,
                maintenanceMessage: message || null,
                updatedById: userId,
            },
            select: { maintenanceMode: true, maintenanceMessage: true },
        });

        revalidatePath("/student", "layout");
        revalidatePath("/super-admin/settings");

        return {
            success: true,
            enabled: saved.maintenanceMode,
            message: saved.maintenanceMessage,
        };
    } catch (error) {
        console.error("[maintenance] Failed to save platform setting:", error);
        return {
            success: false,
            error: "Could not save the setting. Nothing was changed - please try again.",
        };
    }
}
