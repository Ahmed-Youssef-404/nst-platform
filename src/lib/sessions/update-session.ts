// src/lib/sessions/update-session.ts
//
// Sessions are otherwise immutable, but a narrow set of fields (title,
// startTime, durationMinutes, recordingLink) can still be corrected as
// long as the Session hasn't started yet ("upcoming"). Once startTime has
// passed, the Session is permanently locked - no further edits, ever.
//
// Tasks and Hints are NEVER editable, regardless of Session status - see
// create-session.ts for why.
//
// If startTime is being changed, we must re-validate that every existing
// Task's deadline still makes sense against the new startTime (still after
// it) and against the next Session in the Level (still before it, if one
// exists). We do NOT retroactively re-check Sessions that come after this
// one - see the note in create-session.ts about instructors adding Sessions
// in chronological order being an accepted assumption, not an enforced rule.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { UpdateSessionInput, SessionWithTasks } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function updateSession(
    input: UpdateSessionInput
): Promise<SessionWithTasks> {
    const session = await prisma.session.findUnique({
        where: { id: input.sessionId },
        include: { tasks: true, level: { select: { groupId: true } } },
    });

    if (!session) {
        throw new Error("Session not found.");
    }

    // ---- Instructor must be assigned to the Group that owns this Session's Level ----
    const assignment = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId: input.instructorId,
                groupId: session.level.groupId,
            },
        },
    });

    if (!assignment) {
        throw new Error(
            "You are not assigned to the Group this Session belongs to."
        );
    }

    // ---- Session must still be upcoming ----
    const now = new Date();
    if (session.startTime <= now) {
        throw new Error(
            "This Session has already started or ended and can no longer be edited."
        );
    }

    const newStartTime = input.startTime ?? session.startTime;
    const newDurationMinutes = input.durationMinutes ?? session.durationMinutes;

    if (newStartTime <= now) {
        throw new Error("Session startTime must be in the future.");
    }

    if (newDurationMinutes <= 0) {
        throw new Error("durationMinutes must be a positive number.");
    }

    // ---- If startTime is changing, re-validate existing Task deadlines ----
    if (input.startTime && input.startTime.getTime() !== session.startTime.getTime()) {
        for (const task of session.tasks) {
            if (task.deadline <= newStartTime) {
                throw new Error(
                    `Cannot update startTime: Task "${task.title}" has a deadline (${task.deadline.toISOString()}) that would no longer be after the new startTime.`
                );
            }
        }

        const nextSession = await prisma.session.findFirst({
            where: {
                levelId: session.levelId,
                startTime: { gt: newStartTime },
                id: { not: session.id },
            },
            orderBy: { startTime: "asc" },
            select: { startTime: true },
        });

        if (nextSession) {
            for (const task of session.tasks) {
                if (task.deadline >= nextSession.startTime) {
                    throw new Error(
                        `Cannot update startTime: Task "${task.title}" has a deadline that would no longer be before the next Session's startTime.`
                    );
                }
            }
        }
    }

    const updated = await prisma.session.update({
        where: { id: input.sessionId },
        data: {
            title: input.title ?? undefined,
            startTime: input.startTime ?? undefined,
            durationMinutes: input.durationMinutes ?? undefined,
            recordingLink:
                input.recordingLink === undefined ? undefined : input.recordingLink,
        },
        include: {
            tasks: {
                include: { hints: { orderBy: { order: "asc" } } },
            },
        },
    });

    return updated as unknown as SessionWithTasks;
}