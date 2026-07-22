// src/lib/data/get-batches.ts
// Fetches all Batches with their nested Groups, each Group's student count,
// and the Instructors currently assigned to it.
// Used to render the /super-admin/batches management page.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { BatchWithGroups } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function getBatches(): Promise<BatchWithGroups[]> {
    const batches = await prisma.batch.findMany({
        orderBy: { name: "asc" },
        include: {
            groups: {
                orderBy: { name: "asc" },
                include: {
                    _count: { select: { students: true } },
                    instructorGroups: {
                        include: { instructor: true },
                        orderBy: { instructor: { name: "asc" } },
                    },
                },
            },
        },
    });

    return batches.map((batch) => ({
        id: batch.id,
        name: batch.name,
        groups: batch.groups.map((group) => ({
            id: group.id,
            name: group.name,
            batchId: group.batchId,
            studentCount: group._count.students,
            instructors: group.instructorGroups.map((ig) => ({
                id: ig.instructor.id,
                name: ig.instructor.name,
                email: ig.instructor.email,
            })),
        })),
    }));
}