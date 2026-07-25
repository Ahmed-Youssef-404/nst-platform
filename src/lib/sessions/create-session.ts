// src/lib/sessions/create-session.ts
//
// Creates a Session together with all of its Tasks and Hints in a single
// atomic operation. This is intentional: Sessions, Tasks and Hints are
// permanent content once created - Tasks/Hints can NEVER be edited or
// deleted afterwards, and Session itself only allows a narrow set of
// field edits later (see update-session.ts). So everything that defines
// the "content" of a Session must be correct and validated up front,
// before a single row is written.
//
// Validation order (all checked BEFORE any INSERT):
//   1. The instructor is actually assigned to the Group that owns this Level.
//   2. startTime is in the future (a Session must start out "upcoming").
//   3. Per task:
//      a. EXTERNAL tasks must have allowedSubmissionMode = null (no submissions
//         exist for EXTERNAL tasks at all).
//      b. deadline must be after this Session's startTime.
//      c. deadline must be before the startTime of the next Session in the
//         same Level (the closest one after this Session's startTime, based
//         on Sessions that exist at creation time) - UNLESS there is no such
//         Session yet, in which case there's no upper bound and the
//         instructor picks any reasonable future date.
//      d. Exactly 3 hints, each with non-empty content.
//
// Everything then runs inside a single prisma.$transaction - the Session,
// every Task, and every Hint (3 per task) are all created together or not
// at all.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CreateSessionInput, SessionWithTasks } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function createSession(
    input: CreateSessionInput
): Promise<SessionWithTasks> {
    // ---- 1. Instructor must be assigned to the Group that owns this Level ----
    const level = await prisma.level.findUnique({
        where: { id: input.levelId },
        select: { id: true, groupId: true },
    });

    if (!level) {
        throw new Error("Level not found.");
    }

    const assignment = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId: input.createdBy,
                groupId: level.groupId,
            },
        },
    });

    if (!assignment) {
        throw new Error(
            "You are not assigned to the Group this Level belongs to."
        );
    }

    // ---- 2. startTime must be in the future ----
    const now = new Date();
    if (input.startTime <= now) {
        throw new Error("Session startTime must be in the future.");
    }

    if (input.durationMinutes <= 0) {
        throw new Error("durationMinutes must be a positive number.");
    }

    // ---- 3. Find the closest existing Session in this Level that starts
    // after this new Session's startTime, to bound Task deadlines ----
    const nextSession = await prisma.session.findFirst({
        where: {
            levelId: input.levelId,
            startTime: { gt: input.startTime },
        },
        orderBy: { startTime: "asc" },
        select: { startTime: true },
    });

    // ---- 4. Validate every task ----
    for (const [index, task] of input.tasks.entries()) {
        const taskLabel = `Task #${index + 1} ("${task.title}")`;

        if (task.type === "EXTERNAL" && task.allowedSubmissionMode) {
            throw new Error(
                `${taskLabel}: EXTERNAL tasks cannot have an allowedSubmissionMode (they have no submissions at all).`
            );
        }

        if (task.deadline <= input.startTime) {
            throw new Error(
                `${taskLabel}: deadline must be after this Session's startTime.`
            );
        }

        if (nextSession && task.deadline >= nextSession.startTime) {
            throw new Error(
                `${taskLabel}: deadline must be before the next Session's startTime (${nextSession.startTime.toISOString()}).`
            );
        }

        if (task.hints.length !== 3) {
            throw new Error(`${taskLabel}: exactly 3 hints are required.`);
        }

        for (const [hintIndex, hint] of task.hints.entries()) {
            if (!hint.content.trim()) {
                throw new Error(
                    `${taskLabel}: hint #${hintIndex + 1} content cannot be empty.`
                );
            }
            if (hint.cost < 0) {
                throw new Error(
                    `${taskLabel}: hint #${hintIndex + 1} cost cannot be negative.`
                );
            }
        }
    }

    // ---- 5. Create everything atomically ----
    const created = await prisma.$transaction(async (tx) => {
        const session = await tx.session.create({
            data: {
                levelId: input.levelId,
                title: input.title,
                startTime: input.startTime,
                durationMinutes: input.durationMinutes,
                recordingLink: input.recordingLink ?? null,
            },
        });

        for (const task of input.tasks) {
            await tx.task.create({
                data: {
                    sessionId: session.id,
                    title: task.title,
                    description: task.description,
                    type: task.type,
                    deadline: task.deadline,
                    isBonus: task.isBonus,
                    allowedSubmissionMode: task.allowedSubmissionMode ?? null,
                    hints: {
                        create: task.hints.map((hint, i) => ({
                            order: i + 1,
                            content: hint.content,
                            cost: hint.cost,
                        })),
                    },
                },
            });
        }

        return tx.session.findUniqueOrThrow({
            where: { id: session.id },
            include: {
                tasks: {
                    include: { hints: { orderBy: { order: "asc" } } },
                },
            },
        });
    });

    return created as unknown as SessionWithTasks;
}