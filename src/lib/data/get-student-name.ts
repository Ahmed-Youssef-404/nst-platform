// src/lib/data/get-student-name.ts
// Minimal fetcher used by the Student layout (sidebar footer). Kept
// separate from get-st-balance.ts so the layout - which wraps every
// Student page - doesn't need to also read/compute balance-status on
// every navigation just to show a name.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function getStudentName(studentId: string): Promise<string> {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: { name: true },
    });

    return student.name;
}