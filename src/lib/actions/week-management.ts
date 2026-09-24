"use server";
// src/lib/actions/week-management.ts
// Server Actions for the BEGINNER track's Week + its Tasks/Hints.
// Restricted to Instructor only. The instructorId used for authorization
// checks always comes from the authenticated session (requireRole), never
// from client input - this prevents a client from claiming to be an
// instructor assigned to a Group they don't actually belong to.
//
// Editing rules (enforced in lib/weeks/manage-week.ts): Tasks/Hints are
// editable only before Week.startDate; after it only name,
// requiredFileLabel and playlistUrl can change.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import {
    addTaskToWeek,
    createWeek,
    deleteWeekTask,
    updateWeek,
    updateWeekTask,
} from "@/lib/weeks/manage-week";
import type {
    AddTaskToWeekInput,
    CreateWeekInput,
    DeleteWeekTaskInput,
    UpdateWeekInput,
    UpdateWeekTaskInput,
} from "@/types/types";

export async function createWeekAction(
    input: Omit<CreateWeekInput, "createdBy">
) {
    const user = await requireRole(["instructor"]);

    try {
        const week = await createWeek({ ...input, createdBy: user.id });
        revalidatePath("/instructor");
        return { success: true, data: week };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function updateWeekAction(
    input: Omit<UpdateWeekInput, "instructorId">
) {
    const user = await requireRole(["instructor"]);

    try {
        const week = await updateWeek({ ...input, instructorId: user.id });
        revalidatePath("/instructor");
        return { success: true, data: week };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function addTaskToWeekAction(
    input: Omit<AddTaskToWeekInput, "instructorId">
) {
    const user = await requireRole(["instructor"]);

    try {
        const week = await addTaskToWeek({ ...input, instructorId: user.id });
        revalidatePath("/instructor");
        return { success: true, data: week };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function updateWeekTaskAction(
    input: Omit<UpdateWeekTaskInput, "instructorId">
) {
    const user = await requireRole(["instructor"]);

    try {
        const week = await updateWeekTask({ ...input, instructorId: user.id });
        revalidatePath("/instructor");
        return { success: true, data: week };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

export async function deleteWeekTaskAction(
    input: Omit<DeleteWeekTaskInput, "instructorId">
) {
    const user = await requireRole(["instructor"]);

    try {
        const week = await deleteWeekTask({ ...input, instructorId: user.id });
        revalidatePath("/instructor");
        return { success: true, data: week };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}