// src/lib/data/get-instructors.ts
// Fetches all Instructors for use in selection dropdowns,
// e.g. when SuperAdmin assigns an Instructor to a Group.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { InstructorOption } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function getInstructors(): Promise<InstructorOption[]> {
    const instructors = await prisma.instructor.findMany({
        orderBy: { name: "asc" },
    });

    return instructors.map((instructor) => ({
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
    }));
}