// src/lib/data/get-maintenance-state.ts
// Reads the global Maintenance Mode setting straight from the database on
// every call. Deliberately NOT cached (no unstable_cache / "use cache"): the
// student layout is dynamic (it reads auth cookies), so every request sees the
// current value and a toggle takes effect on the next navigation or refresh.
//
// Failure policy: if the setting cannot be read we return `unknown: true`.
// Callers treat "unknown" like maintenance, so the student UI is never shown
// as definitely available when the platform cannot determine its own status.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const PLATFORM_SETTING_ID = "platform";

export interface MaintenanceState {
    enabled: boolean;
    message: string | null;
    /** True when the setting could not be read (database error). */
    unknown: boolean;
}

export async function getMaintenanceState(): Promise<MaintenanceState> {
    try {
        const row = await prisma.platformSetting.findUnique({
            where: { id: PLATFORM_SETTING_ID },
            select: { maintenanceMode: true, maintenanceMessage: true },
        });

        // No row yet = never configured = platform online.
        return {
            enabled: row?.maintenanceMode ?? false,
            message: row?.maintenanceMessage ?? null,
            unknown: false,
        };
    } catch (error) {
        console.error("[maintenance] Failed to read platform setting:", error);
        return { enabled: false, message: null, unknown: true };
    }
}
