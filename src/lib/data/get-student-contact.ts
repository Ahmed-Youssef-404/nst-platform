// src/lib/data/get-student-contact.ts
// Minimal fetcher used by the Send Feedback action - needs both name and
// email (unlike get-student-name.ts, which only needs the name for the
// sidebar footer).

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface StudentContact {
    name: string;
    email: string;
}

export async function getStudentContact(studentId: string): Promise<StudentContact> {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: { name: true, email: true },
    });

    return student;
}