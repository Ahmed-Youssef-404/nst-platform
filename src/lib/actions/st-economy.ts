"use server";
// src/lib/actions/st-economy.ts
// Server Actions for the ST economy.
// Follows the same pattern as batch-management.ts:
//   requireRole() called OUTSIDE try/catch, business logic inside try/catch,
//   returns { success: true, data } or { success: false, error }.

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireRole } from "@/lib/auth/require-role";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { recordAttendance, recordSessionEngagement, gradeSubmission } from "@/lib/st-economy/instructor-events";
import { unlockHint } from "@/lib/st-economy/hint-unlock";
import { reconcileStudentST } from "@/lib/st-economy/reconcile";
import type {
    RecordAttendanceInput,
    RecordSessionEngagementInput,
    GradeSubmissionInput,
    UnlockHintInput,
    UserRole,
} from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ------------------------------------------------------------------
// Authorization helper: an Instructor may only act on Students in a
// Group they're assigned to (via InstructorGroup). SuperAdmin bypasses
// this check entirely - they aren't scoped to any Group.
// Without this, requireRole(["instructor", "super_admin"]) alone would
// let ANY Instructor record attendance/engagement/grades for ANY
// student, not just their own Group's - the routes/pages already filter
// by assignment, but a Server Action is directly callable regardless of
// which page rendered it.
// ------------------------------------------------------------------
async function assertInstructorOwnsStudent(
    actingUserId: string,
    actingUserRole: UserRole,
    studentId: string
) {
    if (actingUserRole === "super_admin") return;

    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: { groupId: true },
    });

    const assignment = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId: actingUserId,
                groupId: student.groupId,
            },
        },
    });

    if (!assignment) {
        throw new Error("You are not assigned to this Student's Group.");
    }
}

// ------------------------------------------------------------------
// Instructor-driven actions - Instructor or SuperAdmin only
// ------------------------------------------------------------------

export async function recordAttendanceAction(input: RecordAttendanceInput) {
    const user = await requireRole(["instructor", "super_admin"]);

    try {
        await assertInstructorOwnsStudent(user.id, user.role, input.studentId);
        const attendance = await recordAttendance(input);
        revalidatePath("/instructor");
        return { success: true, data: attendance };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function recordSessionEngagementAction(
    input: RecordSessionEngagementInput
) {
    const user = await requireRole(["instructor", "super_admin"]);

    try {
        await assertInstructorOwnsStudent(user.id, user.role, input.studentId);
        const result = await recordSessionEngagement(input);
        revalidatePath("/instructor");
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function gradeSubmissionAction(input: GradeSubmissionInput) {
    const user = await requireRole(["instructor", "super_admin"]);

    try {
        // GradeSubmissionInput only carries submissionId, not studentId -
        // look the Student up via the Submission first so we can still
        // enforce the same Group-ownership check as the other two actions.
        const submission = await prisma.submission.findUniqueOrThrow({
            where: { id: input.submissionId },
            select: { studentId: true },
        });
        await assertInstructorOwnsStudent(user.id, user.role, submission.studentId);

        const graded = await gradeSubmission(input);
        revalidatePath("/instructor");
        return { success: true, data: graded };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

// ------------------------------------------------------------------
// Student action - Student only, and only for their own account
// ------------------------------------------------------------------

export async function unlockHintAction(input: UnlockHintInput) {
    await requireRole(["student"]);
    const studentId = await getCurrentStudentId();

    if (!studentId || studentId !== input.studentId) {
        return { success: false, error: "You can only unlock hints for your own account." };
    }

    try {
        const hintUnlock = await unlockHint(input);
        revalidatePath("/student");
        return { success: true, data: hintUnlock };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

// ------------------------------------------------------------------
// Reconciliation - any authenticated role may trigger it for a student
// they're allowed to view; page-level code decides who can call this for
// whom (e.g. a student can only reconcile themselves, an instructor can
// reconcile any student in their groups). Kept permissive here since this
// action only ever creates rewards/penalties that were already earned -
// it cannot be abused to grant arbitrary ST.
// ------------------------------------------------------------------

export async function reconcileStudentSTAction(studentId: string) {
    const user = await requireRole(["student", "instructor", "super_admin"]);

    if (user.role === "student") {
        const currentStudentId = await getCurrentStudentId();
        if (!currentStudentId || currentStudentId !== studentId) {
            return { success: false, error: "You can only reconcile your own account." };
        }
    }

    try {
        const result = await reconcileStudentST(studentId);
        revalidatePath("/student");
        return { success: true, data: result };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}