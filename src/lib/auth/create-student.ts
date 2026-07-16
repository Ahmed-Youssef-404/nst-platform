// src/lib/auth/create-student.ts
// Function responsible for creating a new Student account
// Used by SuperAdmin only (authorization check happens in the calling Server Action)

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CreateStudentInput } from "@/types/types";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });



// Expected format: "NST-" followed by digits
const STUDENT_ID_PATTERN = /^NST-\d+$/;

export async function createStudent(input: CreateStudentInput) {
    const { id, email, name, groupId } = input;

    // 1. Validate the ID format before doing anything else
    if (!STUDENT_ID_PATTERN.test(id)) {
        throw new Error(
            `Invalid student ID format: "${id}". Expected format: NST-1001`
        );
    }

    // 2. Check if this ID is already taken (IDs are final once sent to students)
    const existingStudent = await prisma.student.findUnique({
        where: { id },
    });

    if (existingStudent) {
        throw new Error(`Student ID "${id}" is already in use.`);
    }

    // 3. Create the user in Supabase Auth
    // Note: we use the student's `id` as their password
    const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
            email,
            password: id,
            email_confirm: true,
            app_metadata: {
                role: "student",
            },
        });

    if (authError) {
        throw new Error(`Failed to create user in Auth: ${authError.message}`);
    }

    // 4. Create the corresponding record in the students table
    // Important: we use the SAME `id` here (the student's code),
    // NOT authUser.user.id - this keeps the login code consistent
    // between what the student types and what's stored in our table
    try {
        const student = await prisma.student.create({
            data: {
                id,
                email,
                name,
                groupId,
            },
        });

        return student;
    } catch (dbError) {
        // Rollback: remove the Auth user if the database insert failed
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Failed to create student record: ${dbError}`);
    }
}