// src/lib/data/get-landing-stats.ts
// Public, read-only aggregate counts for the landing page hero. Counts only:
// no student names, emails or any per-person data ever leave this file.
// Returns null on any failure so the landing page always renders (it falls
// back to the previously published figures).

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { LandingLiveCounts } from "@/components/landing/data/landing-content";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function getLandingStats(): Promise<LandingLiveCounts | null> {
    try {
        const [students, tasks, submissions] = await Promise.all([
            prisma.student.count(),
            prisma.task.count(),
            prisma.submission.count({ where: { status: "SUBMITTED" } }),
        ]);
        return { students, tasks, submissions };
    } catch {
        return null;
    }
}
