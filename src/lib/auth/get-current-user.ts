// src/lib/auth/get-current-user.ts
// Central helper to identify the currently logged-in user and their role
// This will be used by every protected Server Action and page

import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/types";

export interface CurrentUser {
    id: string;
    email: string;
    role: UserRole;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    const role = user.app_metadata?.role as UserRole | undefined;

    if (!role) {
        // A logged-in user with no role assigned is a data integrity problem
        // Treat it as "not authenticated" rather than guessing
        return null;
    }

    return {
        id: user.id,
        email: user.email!,
        role,
    };
}