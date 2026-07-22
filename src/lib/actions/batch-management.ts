"use server";
// src/lib/actions/batch-management.ts
// Server Actions for Batch/Group management.
// All actions are restricted to SuperAdmin only.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createBatch, updateBatch } from "@/lib/batches/manage-batch";
import { createGroup, updateGroup } from "@/lib/batches/manage-group";
import {
    assignInstructorToGroup,
    unassignInstructorFromGroup,
} from "@/lib/batches/manage-instructor-group";
import type {
    CreateBatchInput,
    UpdateBatchInput,
    CreateGroupInput,
    UpdateGroupInput,
    AssignInstructorInput,
    UnassignInstructorInput,
} from "@/types/types";

export async function createBatchAction(input: CreateBatchInput) {
    // Only a SuperAdmin can create Batches
    await requireRole(["super_admin"]);

    try {
        const batch = await createBatch(input);
        revalidatePath("/super-admin/batches");
        return { success: true, data: batch };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function updateBatchAction(input: UpdateBatchInput) {
    // Only a SuperAdmin can rename Batches
    await requireRole(["super_admin"]);

    try {
        const batch = await updateBatch(input);
        revalidatePath("/super-admin/batches");
        return { success: true, data: batch };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function createGroupAction(input: CreateGroupInput) {
    // Only a SuperAdmin can create Groups
    await requireRole(["super_admin"]);

    try {
        const group = await createGroup(input);
        revalidatePath("/super-admin/batches");
        return { success: true, data: group };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function updateGroupAction(input: UpdateGroupInput) {
    // Only a SuperAdmin can rename Groups
    await requireRole(["super_admin"]);

    try {
        const group = await updateGroup(input);
        revalidatePath("/super-admin/batches");
        return { success: true, data: group };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function assignInstructorAction(input: AssignInstructorInput) {
    // Only a SuperAdmin can assign Instructors to Groups
    await requireRole(["super_admin"]);

    try {
        const instructorGroup = await assignInstructorToGroup(input);
        revalidatePath("/super-admin/batches");
        return { success: true, data: instructorGroup };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function unassignInstructorAction(input: UnassignInstructorInput) {
    // Only a SuperAdmin can unassign Instructors from Groups
    await requireRole(["super_admin"]);

    try {
        await unassignInstructorFromGroup(input);
        revalidatePath("/super-admin/batches");
        return { success: true, data: null };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}