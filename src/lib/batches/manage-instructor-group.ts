// src/lib/batches/manage-instructor-group.ts
// Functions responsible for linking/unlinking an Instructor and a Group.
// Used by SuperAdmin only (authorization check happens in the calling Server Action)
//
// Note: this is a many-to-many relationship - an Instructor can be assigned
// to multiple Groups, and a Group can have multiple Instructors.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AssignInstructorInput, UnassignInstructorInput } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function assignInstructorToGroup(input: AssignInstructorInput) {
    const [instructor, group] = await Promise.all([
        prisma.instructor.findUnique({ where: { id: input.instructorId } }),
        prisma.group.findUnique({ where: { id: input.groupId } }),
    ]);

    if (!instructor) {
        throw new Error("Instructor not found.");
    }

    if (!group) {
        throw new Error("Group not found.");
    }

    const existing = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId: input.instructorId,
                groupId: input.groupId,
            },
        },
    });

    if (existing) {
        throw new Error("This Instructor is already assigned to this Group.");
    }

    const instructorGroup = await prisma.instructorGroup.create({
        data: {
            instructorId: input.instructorId,
            groupId: input.groupId,
        },
    });

    return instructorGroup;
}

export async function unassignInstructorFromGroup(input: UnassignInstructorInput) {
    const existing = await prisma.instructorGroup.findUnique({
        where: {
            instructorId_groupId: {
                instructorId: input.instructorId,
                groupId: input.groupId,
            },
        },
    });

    if (!existing) {
        throw new Error("This Instructor is not assigned to this Group.");
    }

    await prisma.instructorGroup.delete({
        where: {
            instructorId_groupId: {
                instructorId: input.instructorId,
                groupId: input.groupId,
            },
        },
    });

    return { success: true };
}