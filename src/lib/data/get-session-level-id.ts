// src/lib/data/get-session-level-id.ts
// Tiny lookup: given a Session id, returns the id of the Level it belongs
// to (or null if the Session doesn't exist). This is the first step in
// resolving /student/sessions/[id] for a Session that could belong to
// ANY of the student's Levels (active or past) rather than just the
// active one - see sessions/[id]/page.tsx.
//
// This does not check ownership itself - it's deliberately unauthenticated
// and cheap. The actual authorization happens one call later, in
// getStudentLevelById, which only returns data if the resolved Level
// belongs to the requesting student's own Group.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function getSessionLevelId(sessionId: string): Promise<string | null> {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { levelId: true },
    });

    return session?.levelId ?? null;
}