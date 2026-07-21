// src/lib/data/get-groups.ts
// Fetches all Groups (with their Batch name) for use in selection dropdowns,
// e.g. when SuperAdmin picks a Group while creating a new Student.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface GroupOption {
    id: string;
    name: string;
    batchName: string;
}

export async function getGroups(): Promise<GroupOption[]> {
    const groups = await prisma.group.findMany({
        include: { batch: true },
        orderBy: [{ batch: { name: "asc" } }, { name: "asc" }],
    });

    return groups.map((group) => ({
        id: group.id,
        name: group.name,
        batchName: group.batch.name,
    }));
}