// src/lib/batches/manage-group.ts
// Functions responsible for creating and updating a Group.
// Used by SuperAdmin only (authorization check happens in the calling Server Action)
//
// Note: a Group's batchId is fixed at creation time and can never change
// afterwards (moving a Group between Batches is not supported by design).

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CreateGroupInput, UpdateGroupInput } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function createGroup(input: CreateGroupInput) {
    const name = input.name.trim();

    if (!name) {
        throw new Error("Group name cannot be empty.");
    }

    const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });

    if (!batch) {
        throw new Error("The selected Batch does not exist.");
    }

    const group = await prisma.group.create({
        data: {
            name,
            batchId: input.batchId,
        },
    });

    return group;
}

export async function updateGroup(input: UpdateGroupInput) {
    const name = input.name.trim();

    if (!name) {
        throw new Error("Group name cannot be empty.");
    }

    const existing = await prisma.group.findUnique({ where: { id: input.id } });

    if (!existing) {
        throw new Error("Group not found.");
    }

    // Only the name is updatable here - batchId is intentionally never touched
    const group = await prisma.group.update({
        where: { id: input.id },
        data: { name },
    });

    return group;
}