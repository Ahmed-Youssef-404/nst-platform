// src/lib/auth/assert-email-available.ts
// Server-only guard used by the account-creation flows.
//
// Supabase Auth emails are unique across ALL roles, and Auth lowercases them.
// A legacy Prisma row such as "Student@gmail.com" would not collide with a new
// "student@gmail.com" at the DB unique index (case-sensitive), but it WOULD be
// the same identity in Auth. So we check case-insensitively, across all three
// role tables, and fail with a clear error instead of overwriting anything.

import type { PrismaClient } from "@/generated/prisma/client";

export async function assertEmailAvailable(
    prisma: PrismaClient,
    normalizedEmail: string
): Promise<void> {
    const where = { email: { equals: normalizedEmail, mode: "insensitive" as const } };

    const [student, instructor, superAdmin] = await Promise.all([
        prisma.student.findFirst({ where, select: { id: true } }),
        prisma.instructor.findFirst({ where, select: { id: true } }),
        prisma.superAdmin.findFirst({ where, select: { id: true } }),
    ]);

    if (student || instructor || superAdmin) {
        throw new Error(`An account with the email "${normalizedEmail}" already exists.`);
    }
}
