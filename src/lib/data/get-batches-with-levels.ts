// src/lib/data/get-batches-with-levels.ts
// Fetches all Batches with their nested Groups and each Group's currently
// active Level (if any). Used to render the /super-admin/levels page:
// both the "create a Level for these Groups" form (needs the full Group
// list) and the "here's what's active right now" overview.
//
// Kept separate from get-batches.ts on purpose (that file is used by the
// Batches/Instructors page and doesn't need Level data at all).

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { BatchWithGroupsAndLevels } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function getBatchesWithLevels(): Promise<BatchWithGroupsAndLevels[]> {
    const batches = await prisma.batch.findMany({
        orderBy: { name: "asc" },
        include: {
            groups: {
                orderBy: { name: "asc" },
                include: {
                    levels: {
                        where: { isActive: true },
                        take: 1,
                    },
                },
            },
        },
    });

    return batches.map((batch) => ({
        id: batch.id,
        name: batch.name,
        groups: batch.groups.map((group) => {
            const activeLevel = group.levels[0] ?? null;

            return {
                id: group.id,
                name: group.name,
                batchId: group.batchId,
                activeLevel: activeLevel
                    ? {
                        id: activeLevel.id,
                        name: activeLevel.name,
                        description: activeLevel.description,
                        levelNumber: activeLevel.levelNumber,
                        startDate: activeLevel.startDate,
                    }
                    : null,
            };
        }),
    }));
}