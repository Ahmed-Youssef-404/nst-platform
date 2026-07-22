// src/lib/batches/manage-batch.ts
// Functions responsible for creating and updating a Batch.
// Used by SuperAdmin only (authorization check happens in the calling Server Action)

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CreateBatchInput, UpdateBatchInput } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function createBatch(input: CreateBatchInput) {
    const name = input.name.trim();

    if (!name) {
        throw new Error("Batch name cannot be empty.");
    }

    const batch = await prisma.batch.create({
        data: { name },
    });

    return batch;
}

export async function updateBatch(input: UpdateBatchInput) {
    const name = input.name.trim();

    if (!name) {
        throw new Error("Batch name cannot be empty.");
    }

    const existing = await prisma.batch.findUnique({ where: { id: input.id } });

    if (!existing) {
        throw new Error("Batch not found.");
    }

    const batch = await prisma.batch.update({
        where: { id: input.id },
        data: { name },
    });

    return batch;
}