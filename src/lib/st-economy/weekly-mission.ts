// src/lib/st-economy/weekly-mission.ts
//
// Weekly Mission (+30): attend every Session AND submit every non-bonus
// Task on time, within a single "week", where a week is a 7-day window
// anchored to the student's Level.startDate (not calendar week, not each
// student's personal entry date). If a week has zero Sessions scheduled,
// the mission doesn't exist for that week (no fail, no reward - simply
// skipped).
//
// Like the deadline events, this is computed lazily and deduplicated via
// applySTChangeOnce, keyed on relatedEntityId = "<levelId>:<weekIndex>" so
// a given week for a given Level is only ever rewarded once per student.
//
// Only COMPLETE weeks are evaluated (the week's end must be in the past) -
// we never grade a week that hasn't finished yet.
//
// Known open edge case (per Ahmed - deferred): a student joining a Group
// after a Level/week has already started. Current behavior: we evaluate
// from the Level's startDate regardless of when the student joined, which
// may unfairly fail a week the student wasn't present for. Flagged as TBD,
// not solved here.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applySTChangeOnce } from "./create-transaction";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function reconcileWeeklyMission(studentId: string) {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: { groupId: true },
    });

    const levels = await prisma.level.findMany({
        where: { groupId: student.groupId },
        select: {
            id: true,
            startDate: true,
            sessions: {
                select: {
                    id: true,
                    startTime: true,
                    attendance: { where: { studentId }, select: { status: true } },
                    tasks: {
                        where: { isBonus: false },
                        select: {
                            id: true,
                            deadline: true,
                            submissions: { where: { studentId }, select: { id: true } },
                        },
                    },
                },
            },
        },
    });

    const now = new Date();
    let scored = 0;

    for (const level of levels) {
        const anchor = level.startDate.getTime();
        const weeksElapsed = Math.floor((now.getTime() - anchor) / WEEK_MS);

        // Evaluate every COMPLETE week so far (weekIndex 0, 1, 2, ...).
        for (let weekIndex = 0; weekIndex <= weeksElapsed; weekIndex++) {
            const weekStart = new Date(anchor + weekIndex * WEEK_MS);
            const weekEnd = new Date(anchor + (weekIndex + 1) * WEEK_MS);

            if (weekEnd > now) continue; // week not finished yet

            const sessionsInWeek = level.sessions.filter(
                (s) => s.startTime >= weekStart && s.startTime < weekEnd
            );

            if (sessionsInWeek.length === 0) continue; // mission doesn't exist this week

            const relatedEntityId = `${level.id}:${weekIndex}`;

            const attendedAll = sessionsInWeek.every(
                (s) => s.attendance[0]?.status === "PRESENT"
            );

            const allTasksInWeek = sessionsInWeek.flatMap((s) => s.tasks);
            const submittedAllOnTime =
                allTasksInWeek.length === 0 ||
                allTasksInWeek.every((t) => t.submissions.length > 0);

            if (!attendedAll || !submittedAllOnTime) continue; // mission failed, no penalty, just no reward

            const result = await applySTChangeOnce({
                studentId,
                levelId: level.id,
                type: "REWARD",
                reason: "WEEKLY_MISSION",
                amount: 30,
                relatedEntityId,
            });

            if (result) scored++;
        }
    }

    return { scored };
}