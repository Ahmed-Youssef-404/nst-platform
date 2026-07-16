// src/lib/actions/user-management.ts
"use server";

import { requireRole } from "@/lib/auth/require-role";
import { createInstructor } from "@/lib/auth/create-instructor";
import { createStudent } from "@/lib/auth/create-student";
import type {
    CreateInstructorInput,
    CreateStudentInput,
} from "@/types/types";

export async function createInstructorAction(input: CreateInstructorInput) {
    // Only a SuperAdmin can create Instructor accounts
    await requireRole(["super_admin"]);

    try {
        const instructor = await createInstructor(input);
        return { success: true, data: instructor };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function createStudentAction(input: CreateStudentInput) {
    // Only a SuperAdmin can create Student accounts
    await requireRole(["super_admin"]);

    try {
        const student = await createStudent(input);
        return { success: true, data: student };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}