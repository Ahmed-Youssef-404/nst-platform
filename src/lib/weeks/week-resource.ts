// src/lib/weeks/week-resource.ts
//
// BEGINNER track: the Week's ONE required file. Completely separate from
// Task submissions - one row per (studentId, weekId), tied to the Week's
// requiredFileLabel.
//
// A row exists ONLY once a file has been uploaded, so "row exists" ==
// "the Student has a file". The lock flow (lock-week.ts) relies on that.
//
// A Student can replace the file freely while the Week is running and not
// locked. Replacing resets status to PENDING (a previously ACCEPTED /
// REJECTED verdict never applies to a new file). In practice status can
// only be non-PENDING after the Instructor's grading step, which happens
// after endDate/lock - so this reset is a safety net, not a common path.
//
// Whether the file is ACCEPTED or REJECTED is decided later by the
// Instructor inside the Week grading screen - not here.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
    UploadWeekResourceInput,
    WeekResourceResult,
} from "@/types/types";
import { assertStudentCanWriteInWeek } from "@/lib/weeks/week-student-guard";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function saveWeekResource(
    input: UploadWeekResourceInput
): Promise<WeekResourceResult> {
    if (!input.fileUrl.trim()) {
        throw new Error("A file must be uploaded.");
    }

    await assertStudentCanWriteInWeek(prisma, {
        studentId: input.studentId,
        weekId: input.weekId,
    });

    const now = new Date();

    const resource = await prisma.weekResourceSubmission.upsert({
        where: {
            studentId_weekId: {
                studentId: input.studentId,
                weekId: input.weekId,
            },
        },
        create: {
            studentId: input.studentId,
            weekId: input.weekId,
            fileUrl: input.fileUrl,
            status: "PENDING",
            submittedAt: now,
        },
        update: {
            fileUrl: input.fileUrl,
            status: "PENDING",
            submittedAt: now,
        },
    });

    return resource as unknown as WeekResourceResult;
}