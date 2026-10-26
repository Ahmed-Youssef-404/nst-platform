"use server";
// src/lib/actions/student-360.ts
// Server action for loading the complete Student 360° Profile on demand.
// Role-protected:
//   - SuperAdmin has full access.
//   - Instructor access is strictly checked against InstructorGroup assignments.

import { requireRole } from "@/lib/auth/require-role";
import { getStudent360, type Student360ProfileData } from "@/lib/data/get-student-360";

export type Student360ActionResult =
    | { success: true; data: Student360ProfileData }
    | { success: false; error: string };

export async function getStudent360Action(
    studentId: string
): Promise<Student360ActionResult> {
    const user = await requireRole(["super_admin", "instructor"]);

    try {
        if (!studentId || typeof studentId !== "string") {
            throw new Error("Invalid student ID.");
        }

        const data = await getStudent360(studentId, {
            instructorId: user.role === "instructor" ? user.id : undefined,
        });

        if (!data) {
            throw new Error(
                user.role === "instructor"
                    ? "Student not found or not assigned to your authorized groups."
                    : "Student not found."
            );
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to load student 360 profile.",
        };
    }
}
