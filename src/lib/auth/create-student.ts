// src/lib/auth/create-student.ts
// Function responsible for creating a new Student account
// Used by SuperAdmin only (authorization check happens in the calling Server Action)

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CreateStudentInput } from "@/types/types";
import { normalizeEmail, isValidEmail } from "@/lib/auth/normalize-email";
import { assertEmailAvailable } from "@/lib/auth/assert-email-available";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });



// Expected format: "NST-" followed by digits
const STUDENT_ID_PATTERN = /^[A-Za-z0-9]+$/;

export async function createStudent(input: CreateStudentInput) {
    const { id, name, groupId } = input;
    // Never trust the client: normalize again on the server.
    const email = normalizeEmail(input.email);

    if (!isValidEmail(email)) {
        throw new Error("Please enter a valid email address.");
    }

    // 1. Validate the ID format before doing anything else
    if (!STUDENT_ID_PATTERN.test(id)) {
        throw new Error(
            `Invalid student ID format: "${id}". Expected only English letters and numbers.`
        );
    }

    // 2. Check if this ID is already taken (IDs are final once sent to students)
    const existingStudent = await prisma.student.findUnique({
        where: { id },
    });

    if (existingStudent) {
        throw new Error(`Student ID "${id}" is already in use.`);
    }

    // 2b. Refuse if this email (any casing) already belongs to any account
    await assertEmailAvailable(prisma, email);

    // 3. Verify the group exists and check its track type (BEGINNER vs INTERMEDIATE)
    const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { type: true },
    });

    if (!group) {
        throw new Error(`Group with ID "${groupId}" does not exist.`);
    }

    const isBeginner = group.type === "BEGINNER";

    // 4. Create the user in Supabase Auth
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

    // 5. Create the corresponding record in the students table
    // Important: we use the SAME `id` here (the student's code),
    // NOT authUser.user.id - this keeps the login code consistent
    // between what the student types and what's stored in our table.
    // Beginner students start with 50 ST, intermediate students start with null
    // (their balance is tracked via LevelStBalance, starting at 50 per level).
    try {
        const student = await prisma.student.create({
            data: {
                id,
                email,
                name,
                groupId,
                beginnerSt: isBeginner ? 50 : null,
            },
        });

        return student;
    } catch (dbError) {
        // Rollback: remove the Auth user if the database insert failed
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Failed to create student record: ${dbError}`);
    }
}