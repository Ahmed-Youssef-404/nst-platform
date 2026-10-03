// src/lib/actions/profile.ts
"use server";
// Server Actions for the My Profile feature.
//
// Scope (deliberately small):
//   - updateProfileNameAction : SuperAdmin + Instructor can change their OWN
//     display name. `name` lives only in Prisma (Supabase Auth stores no
//     name for these accounts - see create-instructor.ts), so a single
//     Prisma update keeps everything consistent.
//   - changePasswordAction    : SuperAdmin + Instructor can change their OWN
//     password after proving they know the current one.
//
// Intentionally NOT here:
//   - Students: their name/code/group are institutional data, and their
//     password IS their student code (see create-student.ts + the login
//     form), with no reset flow - so there is nothing safe to edit.
//   - Email: it is the sign-in identity (and the Auth<->Student bridge), so
//     changing it needs Supabase's verification flow, which isn't built.
//
// Ownership: the target record ALWAYS comes from getCurrentUser() (the
// verified session), never from anything the client sends. These actions
// accept no id/role/email parameter at all.

import { revalidatePath } from "next/cache";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import {
    normalizeName,
    validateName,
    validatePasswordChange,
    type PasswordChangeInput,
    type PasswordField,
} from "@/lib/profile/validation";
import type { ProfileActionResult } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function updateProfileNameAction(
    input: { name: string }
): Promise<ProfileActionResult<"name">> {
    const user = await requireRole(["super_admin", "instructor"]);

    try {
        const nameError = validateName(String(input?.name ?? ""));
        if (nameError) {
            return { success: false, error: nameError, fieldErrors: { name: nameError } };
        }

        const name = normalizeName(String(input.name));

        // updateMany scoped to the session's own id: touches exactly one
        // row (the caller's) and reports count 0 instead of throwing if the
        // record is somehow missing.
        const result =
            user.role === "super_admin"
                ? await prisma.superAdmin.updateMany({ where: { id: user.id }, data: { name } })
                : await prisma.instructor.updateMany({ where: { id: user.id }, data: { name } });

        if (result.count !== 1) {
            return { success: false, error: "Could not find your profile record." };
        }

        // The sidebar footer + top bar read the name in the role layout, so
        // revalidate the whole layout segment, not just the profile page.
        revalidatePath(user.role === "super_admin" ? "/super-admin" : "/instructor", "layout");

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Something went wrong while saving. Please try again.",
        };
    }
}

export async function changePasswordAction(
    input: PasswordChangeInput
): Promise<ProfileActionResult<PasswordField>> {
    const user = await requireRole(["super_admin", "instructor"]);

    try {
        const payload: PasswordChangeInput = {
            currentPassword: String(input?.currentPassword ?? ""),
            newPassword: String(input?.newPassword ?? ""),
            confirmPassword: String(input?.confirmPassword ?? ""),
        };

        const fieldErrors = validatePasswordChange(payload);
        if (Object.keys(fieldErrors).length > 0) {
            return {
                success: false,
                error: "Please fix the highlighted fields.",
                fieldErrors,
            };
        }

        // 1) Prove the caller knows the current password. A throwaway,
        //    session-less client is used so this check can't rotate or
        //    overwrite the real session cookies. The email comes from the
        //    verified session, not from the client.
        const verifier = createStatelessClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );

        const { error: verifyError } = await verifier.auth.signInWithPassword({
            email: user.email,
            password: payload.currentPassword,
        });

        if (verifyError) {
            return {
                success: false,
                error: "Your current password is incorrect.",
                fieldErrors: { currentPassword: "Your current password is incorrect." },
            };
        }

        // 2) Update through the caller's own session, so Supabase applies
        //    the change to the authenticated user only.
        const supabase = await createClient();
        const { error: updateError } = await supabase.auth.updateUser({
            password: payload.newPassword,
        });

        if (updateError) {
            return {
                success: false,
                error: updateError.message || "Could not update your password. Please try again.",
            };
        }

        return { success: true };
    } catch {
        return {
            success: false,
            error: "Something went wrong while updating your password. Please try again.",
        };
    }
}
