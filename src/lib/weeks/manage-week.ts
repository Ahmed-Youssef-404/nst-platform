// src/lib/weeks/manage-week.ts
//
// Logic for the BEGINNER track's Week container and the Tasks/Hints inside
// it. Used by Instructors only (authorization of the ROLE happens in the
// calling Server Action via requireRole; authorization of the GROUP happens
// here, same as create-session.ts / update-session.ts).
//
// A Week is an Instructor-defined date range (startDate/endDate) - not a
// literal calendar week. It belongs to a Group of type BEGINNER and holds
// Tasks directly (no Session concept exists in this track).
//
// Editing rules (agreed with the owner):
//   - "Not started yet" is simply `now < startDate` - it is derived from
//     time, there is no Publish button and no extra Week state.
//   - BEFORE startDate: the Instructor can freely edit every Week field and
//     add / edit / delete Tasks (and their Hints).
//   - AFTER startDate: Tasks and Hints are fully locked (no add / edit /
//     delete). Only `name`, `requiredFileLabel` and `playlistUrl` can still
//     be changed. `startDate` and `endDate` are locked.
//   - `playlistUrl` is editable at ANY time.
//
// Task.deadline is never entered by the Instructor in this track: it is
// always Week.endDate. It is set here on create/update and kept in sync if
// the Week's endDate changes (only possible before startDate).
//
// Tasks are 0-3 Hints each (Instructor sets each Hint's cost freely). This
// differs from INTERMEDIATE, which requires exactly 3.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
    AddTaskToWeekInput,
    CreateWeekInput,
    DeleteWeekTaskInput,
    UpdateWeekInput,
    UpdateWeekTaskInput,
    WeekTaskInput,
    WeekWithTasks,
} from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MAX_HINTS_PER_TASK = 3;

// ---------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------

async function assertInstructorAssignedToGroup(
    instructorId: string,
    groupId: string
): Promise<void> {
    const assignment = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: { instructorId, groupId },
        },
    });

    if (!assignment) {
        throw new Error("You are not assigned to this Group.");
    }
}

function assertWeekNotStarted(startDate: Date): void {
    if (startDate <= new Date()) {
        throw new Error(
            "This Week has already started. Tasks and Hints can no longer be changed."
        );
    }
}

function assertValidUrl(value: string, label: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error(`${label} cannot be empty.`);
    }
    try {
        new URL(trimmed);
    } catch {
        throw new Error(`${label} must be a valid URL.`);
    }
    return trimmed;
}

function validateTaskInput(task: WeekTaskInput): void {
    if (!task.title.trim()) {
        throw new Error("Task title cannot be empty.");
    }
    if (!task.description.trim()) {
        throw new Error("Task description cannot be empty.");
    }

    if (task.type === "EXTERNAL" && task.allowedSubmissionMode) {
        throw new Error(
            "EXTERNAL tasks cannot have an allowedSubmissionMode (they have no submissions at all)."
        );
    }

    if (task.hints.length > MAX_HINTS_PER_TASK) {
        throw new Error(
            `A Task can have at most ${MAX_HINTS_PER_TASK} hints.`
        );
    }

    for (const [i, hint] of task.hints.entries()) {
        if (!hint.content.trim()) {
            throw new Error(`Hint #${i + 1} content cannot be empty.`);
        }
        if (!Number.isInteger(hint.cost) || hint.cost < 0) {
            throw new Error(
                `Hint #${i + 1} cost must be a whole number that is not negative.`
            );
        }
    }
}

const WEEK_WITH_TASKS_INCLUDE = {
    tasks: {
        include: { hints: { orderBy: { order: "asc" as const } } },
        orderBy: { createdAt: "asc" as const },
    },
};

// ---------------------------------------------------------------------
// Week
// ---------------------------------------------------------------------

export async function createWeek(
    input: CreateWeekInput
): Promise<WeekWithTasks> {
    const group = await prisma.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, type: true },
    });

    if (!group) {
        throw new Error("Group not found.");
    }

    if (group.type !== "BEGINNER") {
        throw new Error("Weeks can only be created for BEGINNER Groups.");
    }

    await assertInstructorAssignedToGroup(input.createdBy, group.id);

    const name = input.name.trim();
    if (!name) {
        throw new Error("Week name cannot be empty.");
    }

    const requiredFileLabel = input.requiredFileLabel.trim();
    if (!requiredFileLabel) {
        throw new Error("Required file label cannot be empty.");
    }

    const playlistUrl = assertValidUrl(input.playlistUrl, "Playlist URL");

    if (input.startDate <= new Date()) {
        throw new Error("Week startDate must be in the future.");
    }

    if (input.endDate <= input.startDate) {
        throw new Error("Week endDate must be after its startDate.");
    }

    const week = await prisma.week.create({
        data: {
            groupId: group.id,
            name,
            startDate: input.startDate,
            endDate: input.endDate,
            playlistUrl,
            requiredFileLabel,
        },
        include: WEEK_WITH_TASKS_INCLUDE,
    });

    return week as unknown as WeekWithTasks;
}

export async function updateWeek(
    input: UpdateWeekInput
): Promise<WeekWithTasks> {
    const week = await prisma.week.findUnique({
        where: { id: input.weekId },
    });

    if (!week) {
        throw new Error("Week not found.");
    }

    await assertInstructorAssignedToGroup(input.instructorId, week.groupId);

    const started = week.startDate <= new Date();

    // startDate / endDate are locked once the Week has started.
    const changesStart =
        input.startDate !== undefined &&
        input.startDate.getTime() !== week.startDate.getTime();
    const changesEnd =
        input.endDate !== undefined &&
        input.endDate.getTime() !== week.endDate.getTime();

    if (started && (changesStart || changesEnd)) {
        throw new Error(
            "This Week has already started. Its start and end dates can no longer be changed."
        );
    }

    const data: {
        name?: string;
        startDate?: Date;
        endDate?: Date;
        playlistUrl?: string;
        requiredFileLabel?: string;
    } = {};

    if (input.name !== undefined) {
        const name = input.name.trim();
        if (!name) {
            throw new Error("Week name cannot be empty.");
        }
        data.name = name;
    }

    if (input.requiredFileLabel !== undefined) {
        const label = input.requiredFileLabel.trim();
        if (!label) {
            throw new Error("Required file label cannot be empty.");
        }
        data.requiredFileLabel = label;
    }

    if (input.playlistUrl !== undefined) {
        data.playlistUrl = assertValidUrl(input.playlistUrl, "Playlist URL");
    }

    if (!started) {
        const newStart = input.startDate ?? week.startDate;
        const newEnd = input.endDate ?? week.endDate;

        if (changesStart && newStart <= new Date()) {
            throw new Error("Week startDate must be in the future.");
        }

        if (newEnd <= newStart) {
            throw new Error("Week endDate must be after its startDate.");
        }

        if (changesStart) data.startDate = newStart;
        if (changesEnd) data.endDate = newEnd;
    }

    const updated = await prisma.$transaction(async (tx) => {
        await tx.week.update({
            where: { id: week.id },
            data,
        });

        // Task.deadline is always Week.endDate - keep them in sync.
        if (data.endDate) {
            await tx.task.updateMany({
                where: { weekId: week.id },
                data: { deadline: data.endDate },
            });
        }

        return tx.week.findUniqueOrThrow({
            where: { id: week.id },
            include: WEEK_WITH_TASKS_INCLUDE,
        });
    });

    return updated as unknown as WeekWithTasks;
}

// ---------------------------------------------------------------------
// Tasks (+ Hints) inside a Week - only before Week.startDate
// ---------------------------------------------------------------------

export async function addTaskToWeek(
    input: AddTaskToWeekInput
): Promise<WeekWithTasks> {
    const week = await prisma.week.findUnique({
        where: { id: input.weekId },
        select: { id: true, groupId: true, startDate: true, endDate: true },
    });

    if (!week) {
        throw new Error("Week not found.");
    }

    await assertInstructorAssignedToGroup(input.instructorId, week.groupId);
    assertWeekNotStarted(week.startDate);
    validateTaskInput(input);

    await prisma.task.create({
        data: {
            weekId: week.id,
            title: input.title.trim(),
            description: input.description.trim(),
            type: input.type,
            deadline: week.endDate,
            isBonus: input.isBonus,
            allowedSubmissionMode: input.allowedSubmissionMode ?? null,
            hints: {
                create: input.hints.map((hint, i) => ({
                    order: i + 1,
                    content: hint.content.trim(),
                    cost: hint.cost,
                })),
            },
        },
    });

    const result = await prisma.week.findUniqueOrThrow({
        where: { id: week.id },
        include: WEEK_WITH_TASKS_INCLUDE,
    });

    return result as unknown as WeekWithTasks;
}

export async function updateWeekTask(
    input: UpdateWeekTaskInput
): Promise<WeekWithTasks> {
    const task = await prisma.task.findUnique({
        where: { id: input.taskId },
        include: { week: { select: { id: true, groupId: true, startDate: true } } },
    });

    if (!task || !task.week) {
        throw new Error("Task not found in any Week.");
    }

    await assertInstructorAssignedToGroup(input.instructorId, task.week.groupId);
    assertWeekNotStarted(task.week.startDate);
    validateTaskInput(input);

    // Hints are replaced as a whole (0-3 rows, ordered 1..n). Safe because
    // nobody can have unlocked a Hint yet - the Week hasn't started.
    await prisma.$transaction(async (tx) => {
        await tx.hint.deleteMany({ where: { taskId: task.id } });

        await tx.task.update({
            where: { id: task.id },
            data: {
                title: input.title.trim(),
                description: input.description.trim(),
                type: input.type,
                isBonus: input.isBonus,
                allowedSubmissionMode: input.allowedSubmissionMode ?? null,
                hints: {
                    create: input.hints.map((hint, i) => ({
                        order: i + 1,
                        content: hint.content.trim(),
                        cost: hint.cost,
                    })),
                },
            },
        });
    });

    const result = await prisma.week.findUniqueOrThrow({
        where: { id: task.week.id },
        include: WEEK_WITH_TASKS_INCLUDE,
    });

    return result as unknown as WeekWithTasks;
}

export async function deleteWeekTask(
    input: DeleteWeekTaskInput
): Promise<WeekWithTasks> {
    const task = await prisma.task.findUnique({
        where: { id: input.taskId },
        include: { week: { select: { id: true, groupId: true, startDate: true } } },
    });

    if (!task || !task.week) {
        throw new Error("Task not found in any Week.");
    }

    await assertInstructorAssignedToGroup(input.instructorId, task.week.groupId);
    assertWeekNotStarted(task.week.startDate);

    // Hints / rubric fields cascade via onDelete: Cascade in the schema.
    await prisma.task.delete({ where: { id: task.id } });

    const result = await prisma.week.findUniqueOrThrow({
        where: { id: task.week.id },
        include: WEEK_WITH_TASKS_INCLUDE,
    });

    return result as unknown as WeekWithTasks;
}