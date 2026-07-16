// src/lib/actions/auth.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/types";

interface LoginInput {
    email: string;
    password: string;
}

interface LoginResult {
    success: boolean;
    error?: string;
}

export async function loginAction(input: LoginInput): Promise<LoginResult> {
    const { email, password } = input;

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return {
            success: false,
            error: "Invalid email or password.",
        };
    }

    const role = data.user.app_metadata?.role as UserRole | undefined;

    if (!role) {
        // Safety net: a user without a role shouldn't be able to proceed
        await supabase.auth.signOut();
        return {
            success: false,
            error: "This account is not properly configured. Please contact support.",
        };
    }

    // Redirect to the right dashboard based on role
    const destinationByRole: Record<UserRole, string> = {
        super_admin: "/super-admin",
        instructor: "/instructor",
        student: "/student",
    };

    redirect(destinationByRole[role]);
}