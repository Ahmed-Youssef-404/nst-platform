// src/lib/actions/avatar.ts
"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { validateAvatarConfig, type StudentAvatarConfig } from "@/types/avatar";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export type SaveAvatarActionResult =
    | { success: true; config: StudentAvatarConfig }
    | { success: false; error: string };

/**
 * Server Action for a student to save their avatar customization.
 *
 * Security:
 * - Always resolves studentId from the active authenticated session via getCurrentStudentId().
 * - Client-supplied IDs are neither accepted nor trusted.
 * - Validates every single field against an explicit allowlist.
 * - Only modifies `avatarConfig` on the student record — does NOT touch ST, roles, or groups.
 */
export async function saveStudentAvatarAction(
    rawConfig: unknown
): Promise<SaveAvatarActionResult> {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        return {
            success: false,
            error: "Unauthorized: You must be logged in as a student to update your avatar.",
        };
    }

    const validation = validateAvatarConfig(rawConfig);
    if (!validation.valid) {
        return {
            success: false,
            error: `Validation error: ${validation.error}`,
        };
    }

    try {
        await prisma.student.update({
            where: { id: studentId },
            data: {
                // avatarConfig is stored as JSON in students table
                avatarConfig: validation.config as unknown as Prisma.InputJsonValue,
            },
        });

        // Revalidate student profile, rankings, and dashboard pages
        revalidatePath("/student/profile");
        revalidatePath("/student/ranking");
        revalidatePath("/student");

        return {
            success: true,
            config: validation.config,
        };
    } catch (err) {
        console.error("Failed to save avatar configuration:", err);
        return {
            success: false,
            error: "An unexpected database error occurred while saving your avatar.",
        };
    }
}
