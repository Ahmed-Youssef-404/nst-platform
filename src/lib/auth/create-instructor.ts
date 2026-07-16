// src/lib/auth/create-instructor.ts
// Function responsible for creating a new Instructor account
// Used only by SuperAdmin (we'll verify this permission later in the Server Action that calls it)

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CreateInstructorInput } from "@/types/types";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function createInstructor(input: CreateInstructorInput) {
    const { email, password, name } = input;

    // 1. Create user in Supabase Auth
    const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            app_metadata: {
                role: "instructor",
            },
        });

    if (authError) {
        // Throw error instead of just printing - so the calling code can handle it
        throw new Error(`Failed to create user in Auth: ${authError.message}`);
    }

    // 2. Create corresponding record in instructors table
    try {
        const instructor = await prisma.instructor.create({
            data: {
                id: authUser.user.id,
                email,
                name,
            },
        });

        return instructor;
    } catch (dbError) {
        // Important: If record creation fails in instructors table after Auth succeeded,
        // we'll have an "orphan" user (exists in Auth but not in our table)
        // So we delete it from Auth to maintain data consistency
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Failed to create record in database: ${dbError}`);
    }
}