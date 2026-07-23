// src/lib/auth/get-current-user.ts
// Central helper to identify the currently logged-in user and their role
// This will be used by every protected Server Action and page

import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/types";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

// IMPORTANT: For students, the Supabase Auth user id (a UUID) is NOT the
// same as the `id` column in the `students` table (which is the student's
// login code, e.g. "NST-1001" - see create-student.ts). Every server-side
// query that needs the real students-table id (to read/write ST balances,
// submissions, attendance, hint unlocks, etc.) must resolve it through
// this function - bridging via the unique `email` column - rather than
// assuming CurrentUser.id can be used directly as a Student foreign key.
//
// SuperAdmin and Instructor do NOT have this mismatch (their tables use
// the Supabase Auth id directly), so this helper is student-specific.
export async function getCurrentStudentId(): Promise<string | null> {
    const user = await getCurrentUser();

    if (!user || user.role !== "student") {
        return null;
    }

    const student = await prisma.student.findUnique({
        where: { email: user.email },
        select: { id: true },
    });

    return student?.id ?? null;
}