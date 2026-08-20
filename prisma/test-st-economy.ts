// prisma/test-st-economy.ts
//
// Manual end-to-end test script for the ST economy logic layer.
// Creates a fully isolated set of test data (Batch/Group/Level/Session/
// Task/Hint/Student, all prefixed "TEST-" or named clearly), exercises
// every ST-affecting function, prints the resulting balance/history after
// each step, and cleans up after itself at the end (unless --keep is passed).
//
// This does NOT touch any of your real students, groups, or batches.
//
// Updated for the LevelStBalance / avgSt redesign: balances now live in
// LevelStBalance (per Student x Level, frozen once the Level ends) rather
// than directly on Student.levelSt/totalSt. Student.avgSt is a cached
// Math.round(average) over all of a student's LevelStBalance rows. See
// create-transaction.ts for the mechanics.
//
// Run with:
//   npx tsx prisma/test-st-economy.ts
//
// To leave the test data in the database for manual inspection afterwards:
//   npx tsx prisma/test-st-economy.ts --keep

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

import { applySTChange, applySTChangeOnce, createLevelStBalanceForTransition } from "../src/lib/st-economy/create-transaction";
import { recordAttendance, recordSessionEngagement, gradeSubmission } from "../src/lib/st-economy/instructor-events";
import { unlockHint } from "../src/lib/st-economy/hint-unlock";
import { reconcileTaskDeadlines, reconcileFinishAllTasks } from "../src/lib/st-economy/deadline-events";
import { reconcileWeeklyMission } from "../src/lib/st-economy/weekly-mission";
import { getBalanceStatus } from "../src/lib/st-economy/balance-status";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const KEEP_DATA = process.argv.includes("--keep");

// ------------------------------------------------------------------
// Small reporting helpers
// ------------------------------------------------------------------
let stepNumber = 0;
let failures = 0;

function section(title: string) {
    console.log("\n" + "=".repeat(70));
    console.log(title);
    console.log("=".repeat(70));
}

async function step(label: string, fn: () => Promise<void>) {
    stepNumber++;
    console.log(`\n--- Step ${stepNumber}: ${label} ---`);
    try {
        await fn();
    } catch (error) {
        failures++;
        console.error(`❌ FAILED: ${label}`);
        console.error(error);
    }
}

function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`  ✅ ${message}`);
    } else {
        failures++;
        console.log(`  ❌ ASSERTION FAILED: ${message}`);
    }
}

// Reads a student's LevelStBalance.balance for a specific Level - the
// direct replacement for the old `student.levelSt` column read. Returns
// null if no row exists yet for that (student, level) pair.
async function getLevelStBalance(
    studentId: string,
    levelId: string
): Promise<number | null> {
    const row = await prisma.levelStBalance.findUnique({
        where: { studentId_levelId: { studentId, levelId } },
        select: { balance: true },
    });
    return row?.balance ?? null;
}

async function getAvgSt(studentId: string): Promise<number> {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: { avgSt: true },
    });
    return student.avgSt;
}

async function printBalance(studentId: string, levelId: string, label: string) {
    const levelSt = (await getLevelStBalance(studentId, levelId)) ?? 0;
    const avgSt = await getAvgSt(studentId);
    const status = getBalanceStatus(levelSt, avgSt);
    console.log(
        `  📊 [${label}] levelSt=${status.levelSt} avgSt=${status.avgSt} zone=${status.zone}`
    );
    return { levelSt, avgSt };
}

async function printHistory(studentId: string) {
    const history = await prisma.sTTransaction.findMany({
        where: { studentId },
        orderBy: { createdAt: "asc" },
    });
    console.log(`  📜 STTransaction history (${history.length} rows):`);
    for (const tx of history) {
        const sign = tx.type === "REWARD" ? "+" : "-";
        console.log(
            `     ${sign}${tx.amount} [${tx.reason}] -> levelStBalance=${tx.levelStBalance} avgStBalance=${tx.avgStBalance}`
        );
    }
}

// ------------------------------------------------------------------
// Test data setup
// ------------------------------------------------------------------
interface TestContext {
    batchId: string;
    groupId: string;
    levelId: string;
    pastSessionId: string; // startTime in the past, deadline for its task also past
    taskId: string; // non-bonus, INTERNAL, deadline already passed
    bonusTaskId: string; // bonus task, deadline already passed
    hintIds: string[]; // 3 hints for `taskId`
    studentAId: string; // will submit on time
    studentBId: string; // will NOT submit (for -10 penalty test)
    instructorId: string;
}

async function setupTestData(): Promise<TestContext> {
    const batch = await prisma.batch.create({
        data: { name: "TEST-BATCH (auto-generated, safe to delete)" },
    });

    const group = await prisma.group.create({
        data: { name: "TEST-GROUP", batchId: batch.id },
    });

    // Level started 10 days ago, so we have at least one COMPLETE week
    // (7-day window) for the Weekly Mission check.
    const levelStart = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const level = await prisma.level.create({
        data: {
            groupId: group.id,
            name: "TEST-LEVEL",
            levelNumber: 1,
            startDate: levelStart,
        },
    });

    // Session within week 0 (day 2 after level start), so attendance +
    // task submission for it can satisfy the Weekly Mission for week 0.
    const sessionStart = new Date(levelStart.getTime() + 2 * 24 * 60 * 60 * 1000);
    const session = await prisma.session.create({
        data: {
            levelId: level.id,
            title: "TEST-SESSION",
            startTime: sessionStart,
            durationMinutes: 60,
        },
    });

    // Task deadline: 1 day after session start, still well within week 0,
    // and already in the past relative to "now".
    const taskDeadline = new Date(sessionStart.getTime() + 24 * 60 * 60 * 1000);
    const task = await prisma.task.create({
        data: {
            sessionId: session.id,
            title: "TEST-TASK",
            description: "Test task for ST economy verification",
            type: "INTERNAL",
            deadline: taskDeadline,
            isBonus: false,
        },
    });

    const bonusTask = await prisma.task.create({
        data: {
            sessionId: session.id,
            title: "TEST-BONUS-TASK",
            description: "Test bonus task",
            type: "INTERNAL",
            deadline: taskDeadline,
            isBonus: true,
        },
    });

    const hints = await prisma.hint.createMany({
        data: [
            { taskId: task.id, order: 1, content: "Hint 1", cost: 5 },
            { taskId: task.id, order: 2, content: "Hint 2", cost: 15 },
            { taskId: task.id, order: 3, content: "Hint 3", cost: 30 },
        ],
    });
    const createdHints = await prisma.hint.findMany({
        where: { taskId: task.id },
        orderBy: { order: "asc" },
    });

    const stamp = Date.now();
    const studentA = await prisma.student.create({
        data: {
            id: `TEST-A-${stamp}`,
            email: `test-a-${stamp}@example.com`,
            name: "Test Student A (submits on time)",
            groupId: group.id,
        },
    });

    const studentB = await prisma.student.create({
        data: {
            id: `TEST-B-${stamp}`,
            email: `test-b-${stamp}@example.com`,
            name: "Test Student B (never submits)",
            groupId: group.id,
        },
    });

    // Every student needs a LevelStBalance row for the active Level before
    // applySTChange can operate on them - this is normally created by
    // manage-level.ts's createLevelStBalanceForTransition() at Level-
    // transition time. We call it directly here since this script creates
    // its Level manually rather than going through manage-level.ts.
    await prisma.$transaction(async (tx) => {
        await createLevelStBalanceForTransition(tx, {
            studentId: studentA.id,
            newLevelId: level.id,
        });
        await createLevelStBalanceForTransition(tx, {
            studentId: studentB.id,
            newLevelId: level.id,
        });
    });

    // Student A submits the non-bonus task BEFORE the deadline (we
    // backdate submittedAt-equivalent by simply creating it now, since
    // "now" in this script is still before we run deadline checks against
    // a deadline that's already in the past - the important thing is the
    // row exists at all, matching the app's real invariant that any
    // existing Submission row implies on-time, since creation/resubmission
    // is blocked after the deadline elsewhere in the app).
    await prisma.submission.create({
        data: {
            studentId: studentA.id,
            taskId: task.id,
            mode: "TEXT",
            textContent: "Test submission content",
        },
    });

    // Student B intentionally has NO submission for `task` (to test the
    // -10 TASK_NOT_SUBMITTED penalty) and NO submission for bonusTask.

    const instructorId = `TEST-INSTRUCTOR-${stamp}`;

    return {
        batchId: batch.id,
        groupId: group.id,
        levelId: level.id,
        pastSessionId: session.id,
        taskId: task.id,
        bonusTaskId: bonusTask.id,
        hintIds: createdHints.map((h) => h.id),
        studentAId: studentA.id,
        studentBId: studentB.id,
        instructorId,
    };
}

async function cleanupTestData(ctx: TestContext) {
    // Deletion order matters here: Group.batch has NO onDelete: Cascade
    // (by design - see manage-batch.ts / manage-group.ts: a Batch should
    // never be deletable while it still has Groups, to prevent accidental
    // data loss). So we delete bottom-up: Students first (cascades to
    // their STTransaction/HintUnlock/Attendance/Submission/LevelStBalance
    // rows), then the Group (which DOES cascade to Level -> Session ->
    // Task -> Hint, per schema.prisma), then finally the Batch.
    await prisma.student.deleteMany({
        where: { id: { in: [ctx.studentAId, ctx.studentBId] } },
    });
    await prisma.group.delete({ where: { id: ctx.groupId } });
    await prisma.batch.delete({ where: { id: ctx.batchId } });
}

// ------------------------------------------------------------------
// Main test sequence
// ------------------------------------------------------------------
async function main() {
    section("SETUP: creating isolated test data");
    const ctx = await setupTestData();
    console.log(`  Student A: ${ctx.studentAId}`);
    console.log(`  Student B: ${ctx.studentBId}`);
    console.log(`  Task (non-bonus, deadline passed): ${ctx.taskId}`);
    console.log(`  Bonus task (deadline passed): ${ctx.bonusTaskId}`);
    console.log(`  Hints: ${ctx.hintIds.join(", ")}`);

    await printBalance(ctx.studentAId, ctx.levelId, "initial");
    await step("Initial balances are 50 / 50 (one LevelStBalance row so far -> avg == that row)", async () => {
        const levelSt = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        const avgSt = await getAvgSt(ctx.studentAId);
        assert(levelSt === 50, `Student A starts at levelSt=50 (got ${levelSt})`);
        assert(avgSt === 50, `Student A starts at avgSt=50 (got ${avgSt})`);
    });

    // ================================================================
    section("TEST 1: applySTChange - basic reward and penalty");
    // ================================================================
    await step("Apply a manual +5 reward", async () => {
        await applySTChange({
            studentId: ctx.studentAId,
            levelId: ctx.levelId,
            type: "REWARD",
            reason: "MANUAL_ADJUSTMENT",
            amount: 5,
        });
        const s = await printBalance(ctx.studentAId, ctx.levelId, "after +5");
        assert(s.levelSt === 55, `levelSt is 55 (got ${s.levelSt})`);
        assert(s.avgSt === 55, `avgSt is 55 - still one Level, so avg == that Level's balance (got ${s.avgSt})`);
    });

    await step("Apply a manual -30 penalty (should allow going negative on levelSt later)", async () => {
        await applySTChange({
            studentId: ctx.studentAId,
            levelId: ctx.levelId,
            type: "PENALTY",
            reason: "MANUAL_ADJUSTMENT",
            amount: 30,
        });
        const s = await printBalance(ctx.studentAId, ctx.levelId, "after -30");
        assert(s.levelSt === 25, `levelSt is 25 (got ${s.levelSt})`);
        assert(s.avgSt === 25, `avgSt is 25 - still one Level (got ${s.avgSt})`);
    });

    await step("Balance zone is 'warning' at levelSt=25 with default threshold 300? (should be warning, 25 <= 300)", async () => {
        const levelSt = (await getLevelStBalance(ctx.studentAId, ctx.levelId))!;
        const avgSt = await getAvgSt(ctx.studentAId);
        const status = getBalanceStatus(levelSt, avgSt);
        assert(status.zone === "warning", `zone is 'warning' at levelSt=25 (got ${status.zone})`);
    });

    await step("Reject a non-positive amount", async () => {
        try {
            await applySTChange({
                studentId: ctx.studentAId,
                levelId: ctx.levelId,
                type: "REWARD",
                reason: "MANUAL_ADJUSTMENT",
                amount: -5,
            });
            assert(false, "should have thrown for negative amount");
        } catch {
            assert(true, "correctly threw for negative amount");
        }
    });

    // ================================================================
    section("TEST 2: applySTChangeOnce - idempotency");
    // ================================================================
    await step("First call applies the change", async () => {
        const result = await applySTChangeOnce({
            studentId: ctx.studentAId,
            levelId: ctx.levelId,
            type: "REWARD",
            reason: "FIRST_SOLVER",
            amount: 5,
            relatedEntityId: ctx.taskId,
        });
        assert(result !== null, "first call returns a transaction (not null)");
    });

    await step("Second call with same reason+relatedEntityId is a no-op", async () => {
        const before = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        const result = await applySTChangeOnce({
            studentId: ctx.studentAId,
            levelId: ctx.levelId,
            type: "REWARD",
            reason: "FIRST_SOLVER",
            amount: 5,
            relatedEntityId: ctx.taskId,
        });
        const after = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        assert(result === null, "second call returns null (deduped)");
        assert(before === after, "balance unchanged on the duplicate call");
    });

    // ================================================================
    section("TEST 3: Attendance (reward, penalty, correction)");
    // ================================================================
    await step("Mark Student B PRESENT -> +10", async () => {
        await recordAttendance({
            studentId: ctx.studentBId,
            sessionId: ctx.pastSessionId,
            status: "PRESENT",
            recordedBy: ctx.instructorId,
        });
        const s = await printBalance(ctx.studentBId, ctx.levelId, "after PRESENT");
        assert(s.levelSt === 60, `levelSt is 60 (got ${s.levelSt})`);
    });

    await step("Re-submitting the SAME status is a no-op (no double reward)", async () => {
        const before = await getLevelStBalance(ctx.studentBId, ctx.levelId);
        await recordAttendance({
            studentId: ctx.studentBId,
            sessionId: ctx.pastSessionId,
            status: "PRESENT",
            recordedBy: ctx.instructorId,
        });
        const after = await getLevelStBalance(ctx.studentBId, ctx.levelId);
        assert(before === after, "balance unchanged when re-submitting same status");
    });

    await step("Correcting PRESENT -> ABSENT reverses +10 and applies -20", async () => {
        await recordAttendance({
            studentId: ctx.studentBId,
            sessionId: ctx.pastSessionId,
            status: "ABSENT",
            recordedBy: ctx.instructorId,
        });
        const s = await printBalance(ctx.studentBId, ctx.levelId, "after correction to ABSENT");
        // 60 (after PRESENT) - 10 (reverse PRESENT) - 20 (apply ABSENT) = 30
        assert(s.levelSt === 30, `levelSt is 30 after reversal+penalty (got ${s.levelSt})`);
    });

    await printHistory(ctx.studentBId);

    // ================================================================
    section("TEST 4: Session engagement (+5, once per session)");
    // ================================================================
    await step("Record engagement for Student A", async () => {
        await recordSessionEngagement({
            studentId: ctx.studentAId,
            sessionId: ctx.pastSessionId,
            recordedBy: ctx.instructorId,
        });
        await printBalance(ctx.studentAId, ctx.levelId, "after engagement +5");
    });

    await step("Recording engagement twice for the same session throws", async () => {
        try {
            await recordSessionEngagement({
                studentId: ctx.studentAId,
                sessionId: ctx.pastSessionId,
                recordedBy: ctx.instructorId,
            });
            assert(false, "should have thrown on duplicate engagement");
        } catch {
            assert(true, "correctly threw on duplicate engagement");
        }
    });

    // ================================================================
    section("TEST 5: Hint unlock (deduction + duplicate protection)");
    // ================================================================
    await step("Unlock Hint 1 (-5) for Student A", async () => {
        const before = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        await unlockHint({ studentId: ctx.studentAId, hintId: ctx.hintIds[0] });
        const after = await printBalance(ctx.studentAId, ctx.levelId, "after Hint 1 unlock");
        assert(after.levelSt === before! - 5, `levelSt decreased by exactly 5 (${before} -> ${after.levelSt})`);
    });

    await step("Unlocking the SAME hint again does not charge twice", async () => {
        const before = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        await unlockHint({ studentId: ctx.studentAId, hintId: ctx.hintIds[0] });
        const after = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        assert(before === after, "no additional charge on re-unlock");
    });

    await step("Unlock Hint 2 (-15) and Hint 3 (-30)", async () => {
        await unlockHint({ studentId: ctx.studentAId, hintId: ctx.hintIds[1] });
        await unlockHint({ studentId: ctx.studentAId, hintId: ctx.hintIds[2] });
        await printBalance(ctx.studentAId, ctx.levelId, "after all 3 hints unlocked");
    });

    await step("HintUnlock rows exist for all 3 hints with correct costPaid snapshots", async () => {
        const unlocks = await prisma.hintUnlock.findMany({
            where: { studentId: ctx.studentAId },
            orderBy: { unlockedAt: "asc" },
        });
        assert(unlocks.length === 3, `3 HintUnlock rows exist (got ${unlocks.length})`);
        assert(
            unlocks.map((u) => u.costPaid).join(",") === "5,15,30",
            `costPaid snapshots are [5,15,30] (got [${unlocks.map((u) => u.costPaid).join(",")}])`
        );
    });

    // ================================================================
    section("TEST 6: Rubric grading (+ bonus task + first solver)");
    // ================================================================
    await step("Grade Student A's submission: rubric=8, first solver", async () => {
        const submission = await prisma.submission.findUniqueOrThrow({
            where: { studentId_taskId: { studentId: ctx.studentAId, taskId: ctx.taskId } },
        });
        const before = await getLevelStBalance(ctx.studentAId, ctx.levelId);

        await gradeSubmission({
            submissionId: submission.id,
            understandingScore: 2,
            approachScore: 3,
            correctnessScore: 2,
            implementationScore: 1,
            gradedBy: ctx.instructorId,
            isFirstSolver: true,
        });

        // Note: FIRST_SOLVER for ctx.taskId was already awarded in TEST 2's
        // applySTChangeOnce call above (same relatedEntityId), so this
        // should NOT add another +5 - it should be deduped.
        const after = await printBalance(ctx.studentAId, ctx.levelId, "after rubric grading (8) + first-solver attempt");
        assert(after.levelSt === before! + 8, `levelSt increased by exactly 8 (rubric only, first-solver deduped) (${before} -> ${after.levelSt})`);
    });

    await step("Submission is now locked (isLocked = true)", async () => {
        const submission = await prisma.submission.findUniqueOrThrow({
            where: { studentId_taskId: { studentId: ctx.studentAId, taskId: ctx.taskId } },
        });
        assert(submission.isLocked === true, "isLocked is true after grading");
        assert(submission.gradedAt !== null, "gradedAt is set");
    });

    await step("Re-grading an already-graded submission throws", async () => {
        const submission = await prisma.submission.findUniqueOrThrow({
            where: { studentId_taskId: { studentId: ctx.studentAId, taskId: ctx.taskId } },
        });
        try {
            await gradeSubmission({
                submissionId: submission.id,
                understandingScore: 1,
                approachScore: 1,
                correctnessScore: 1,
                implementationScore: 1,
                gradedBy: ctx.instructorId,
            });
            assert(false, "should have thrown on re-grading");
        } catch {
            assert(true, "correctly threw on re-grading");
        }
    });

    await step("Bonus task solved (+10) for Student A", async () => {
        // Student A submits the bonus task, then it's graded with correctness > 0.
        const bonusSubmission = await prisma.submission.create({
            data: {
                studentId: ctx.studentAId,
                taskId: ctx.bonusTaskId,
                mode: "TEXT",
                textContent: "Bonus submission",
            },
        });
        const before = await getLevelStBalance(ctx.studentAId, ctx.levelId);

        await gradeSubmission({
            submissionId: bonusSubmission.id,
            understandingScore: 2,
            approachScore: 3,
            correctnessScore: 3,
            implementationScore: 2,
            gradedBy: ctx.instructorId,
        });

        const after = await printBalance(ctx.studentAId, ctx.levelId, "after bonus task graded (10 rubric + 10 bonus)");
        assert(after.levelSt === before! + 20, `levelSt increased by 20 (10 rubric + 10 bonus) (${before} -> ${after.levelSt})`);
    });

    // ================================================================
    section("TEST 7: Deadline-triggered reconciliation");
    // ================================================================
    await step("reconcileTaskDeadlines: Student A (submitted on time) gets +5", async () => {
        const before = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        await reconcileTaskDeadlines(ctx.studentAId);
        const after = await printBalance(ctx.studentAId, ctx.levelId, "Student A after task-deadline reconcile");
        assert(after.levelSt === before! + 5, `levelSt increased by 5 (SUBMIT_BEFORE_DEADLINE) (${before} -> ${after.levelSt})`);
    });

    await step("reconcileTaskDeadlines: Student B (never submitted) gets -10", async () => {
        const before = await getLevelStBalance(ctx.studentBId, ctx.levelId);
        await reconcileTaskDeadlines(ctx.studentBId);
        const after = await printBalance(ctx.studentBId, ctx.levelId, "Student B after task-deadline reconcile");
        assert(after.levelSt === before! - 10, `levelSt decreased by 10 (TASK_NOT_SUBMITTED) (${before} -> ${after.levelSt})`);
    });

    await step("Running reconcileTaskDeadlines again is a no-op (idempotent)", async () => {
        const beforeA = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        const beforeB = await getLevelStBalance(ctx.studentBId, ctx.levelId);
        await reconcileTaskDeadlines(ctx.studentAId);
        await reconcileTaskDeadlines(ctx.studentBId);
        const afterA = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        const afterB = await getLevelStBalance(ctx.studentBId, ctx.levelId);
        assert(beforeA === afterA, "Student A balance unchanged on 2nd run");
        assert(beforeB === afterB, "Student B balance unchanged on 2nd run");
    });

    await step("reconcileFinishAllTasks: Student A finished the only non-bonus task in the session -> +10", async () => {
        const before = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        await reconcileFinishAllTasks(ctx.studentAId);
        const after = await printBalance(ctx.studentAId, ctx.levelId, "Student A after finish-all-tasks reconcile");
        assert(after.levelSt === before! + 10, `levelSt increased by 10 (FINISH_ALL_TASKS) (${before} -> ${after.levelSt})`);
    });

    await step("reconcileFinishAllTasks: Student B did NOT finish -> no change", async () => {
        const before = await getLevelStBalance(ctx.studentBId, ctx.levelId);
        await reconcileFinishAllTasks(ctx.studentBId);
        const after = await getLevelStBalance(ctx.studentBId, ctx.levelId);
        assert(before === after, "Student B balance unchanged (didn't finish all tasks)");
    });

    // ================================================================
    section("TEST 8: Weekly Mission");
    // ================================================================
    await step("Student A attended + submitted everything in week 0 -> +30", async () => {
        // Student A needs an Attendance=PRESENT row for pastSessionId too,
        // since Weekly Mission requires attending ALL sessions in the week.
        const beforeAttendance = await getLevelStBalance(ctx.studentAId, ctx.levelId);

        await recordAttendance({
            studentId: ctx.studentAId,
            sessionId: ctx.pastSessionId,
            status: "PRESENT",
            recordedBy: ctx.instructorId,
        });
        const afterAttendance = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        assert(afterAttendance === beforeAttendance! + 10, `attendance added exactly +10 (${beforeAttendance} -> ${afterAttendance})`);

        const beforeMission = afterAttendance;
        await reconcileWeeklyMission(ctx.studentAId);
        const afterMission = await printBalance(ctx.studentAId, ctx.levelId, "Student A after weekly mission reconcile");
        assert(afterMission.levelSt === beforeMission! + 30, `weekly mission added exactly +30 (${beforeMission} -> ${afterMission.levelSt})`);
    });

    await step("Student B did not attend/submit everything -> no Weekly Mission reward", async () => {
        const before = await getLevelStBalance(ctx.studentBId, ctx.levelId);
        await reconcileWeeklyMission(ctx.studentBId);
        const after = await getLevelStBalance(ctx.studentBId, ctx.levelId);
        // Student B's attendance for pastSessionId was set to ABSENT earlier
        // in TEST 3, so the mission should fail (not all sessions attended).
        assert(before === after, "Student B balance unchanged (mission not completed)");
    });

    await step("Running reconcileWeeklyMission again is idempotent", async () => {
        const before = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        await reconcileWeeklyMission(ctx.studentAId);
        const after = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        assert(before === after, "no double reward on 2nd Weekly Mission run");
    });

    // ================================================================
    section("TEST 9: Level transition (LevelStBalance freeze + avgSt recompute)");
    // ================================================================
    let secondLevelId = "";
    await step("Transition Student A to a brand new Level -> fresh LevelStBalance(50), old one frozen", async () => {
        const beforeOldLevelSt = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        const beforeAvgSt = await getAvgSt(ctx.studentAId);

        const secondLevel = await prisma.level.create({
            data: {
                groupId: ctx.groupId,
                name: "TEST-LEVEL-2",
                levelNumber: 2,
                isActive: true,
            },
        });
        secondLevelId = secondLevel.id;

        await prisma.$transaction(async (tx) => {
            await createLevelStBalanceForTransition(tx, {
                studentId: ctx.studentAId,
                newLevelId: secondLevel.id,
            });
        });

        const oldLevelStAfter = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        const newLevelSt = await getLevelStBalance(ctx.studentAId, secondLevel.id);
        const avgStAfter = await getAvgSt(ctx.studentAId);

        assert(oldLevelStAfter === beforeOldLevelSt, `old Level's LevelStBalance is untouched/frozen (was ${beforeOldLevelSt}, still ${oldLevelStAfter})`);
        assert(newLevelSt === 50, `new Level's LevelStBalance starts at exactly 50 (got ${newLevelSt})`);

        const expectedAvg = Math.round((beforeOldLevelSt! + 50) / 2);
        assert(avgStAfter === expectedAvg, `avgSt is Math.round(average(${beforeOldLevelSt}, 50)) = ${expectedAvg} (got ${avgStAfter}, was ${beforeAvgSt} before transition)`);
    });

    await step("A reward in the NEW Level only moves the new Level's balance, and avgSt reflects both Levels", async () => {
        const beforeOldLevelSt = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        const beforeNewLevelSt = await getLevelStBalance(ctx.studentAId, secondLevelId);

        await applySTChange({
            studentId: ctx.studentAId,
            levelId: secondLevelId,
            type: "REWARD",
            reason: "MANUAL_ADJUSTMENT",
            amount: 20,
        });

        const afterOldLevelSt = await getLevelStBalance(ctx.studentAId, ctx.levelId);
        const afterNewLevelSt = await getLevelStBalance(ctx.studentAId, secondLevelId);
        const avgStAfter = await getAvgSt(ctx.studentAId);

        assert(afterOldLevelSt === beforeOldLevelSt, "old (frozen) Level's balance did not move");
        assert(afterNewLevelSt === beforeNewLevelSt! + 20, `new Level's balance increased by exactly 20 (${beforeNewLevelSt} -> ${afterNewLevelSt})`);

        const expectedAvg = Math.round((afterOldLevelSt! + afterNewLevelSt!) / 2);
        assert(avgStAfter === expectedAvg, `avgSt recomputed correctly as Math.round(average(${afterOldLevelSt}, ${afterNewLevelSt})) = ${expectedAvg} (got ${avgStAfter})`);
    });

    // ================================================================
    section("FULL HISTORY DUMP");
    // ================================================================
    console.log("\nStudent A full history:");
    await printHistory(ctx.studentAId);
    console.log("\nStudent B full history:");
    await printHistory(ctx.studentBId);

    // ================================================================
    section("AUDIT CONSISTENCY CHECK");
    // ================================================================
    await step("Every STTransaction's levelStBalance snapshot matches the live LevelStBalance for that Level", async () => {
        for (const studentId of [ctx.studentAId, ctx.studentBId]) {
            const history = await prisma.sTTransaction.findMany({
                where: { studentId },
                orderBy: { createdAt: "asc" },
            });

            // Replay running balances PER LEVEL (not a single running
            // total anymore - each Level has its own independent history).
            const runningByLevel = new Map<string, number>();
            let ok = true;

            for (const tx of history) {
                const delta = tx.type === "REWARD" ? tx.amount : -tx.amount;
                const startingBalance = runningByLevel.has(tx.levelId)
                    ? runningByLevel.get(tx.levelId)!
                    : tx.reason === "LEVEL_RESET"
                        ? 0 // LEVEL_RESET's own row IS the first row for that Level - starts from 0 + delta(50)
                        : 50; // first transaction we see for this Level, but not a LEVEL_RESET row (shouldn't normally happen in this script, guarded defensively)
                const running = startingBalance + delta;
                runningByLevel.set(tx.levelId, running);

                if (running !== tx.levelStBalance) {
                    ok = false;
                    console.log(
                        `     mismatch at tx ${tx.id} (level ${tx.levelId}): expected levelStBalance=${running}, got ${tx.levelStBalance}`
                    );
                }
            }

            assert(ok, `${studentId}: every transaction's levelStBalance snapshot matches its Level's replayed running total`);

            // Cross-check against the live LevelStBalance rows directly -
            // the real source of truth, independent of the replay above.
            let liveMatchesReplay = true;
            for (const [levelId, replayed] of runningByLevel) {
                const live = await getLevelStBalance(studentId, levelId);
                if (live !== replayed) {
                    liveMatchesReplay = false;
                    console.log(
                        `     live LevelStBalance mismatch for level ${levelId}: replayed=${replayed}, live=${live}`
                    );
                }
            }
            assert(liveMatchesReplay, `${studentId}: live LevelStBalance rows match the replayed transaction history`);

            // avgSt should equal Math.round(average of all live LevelStBalance rows).
            const allBalances = await prisma.levelStBalance.findMany({
                where: { studentId },
                select: { balance: true },
            });
            const expectedAvg = Math.round(
                allBalances.reduce((sum, b) => sum + b.balance, 0) / allBalances.length
            );
            const liveAvg = await getAvgSt(studentId);
            assert(
                liveAvg === expectedAvg,
                `${studentId}: Student.avgSt (${liveAvg}) matches Math.round(average) of its ${allBalances.length} LevelStBalance row(s) (expected ${expectedAvg})`
            );
        }
    });

    // ================================================================
    section("CLEANUP");
    // ================================================================
    if (KEEP_DATA) {
        console.log("--keep flag passed - leaving test data in the database.");
        console.log(`Batch id to manually delete later: ${ctx.batchId}`);
    } else {
        await cleanupTestData(ctx);
        console.log("Test data deleted.");
    }

    // ================================================================
    section("SUMMARY");
    // ================================================================
    if (failures === 0) {
        console.log(`✅ All checks passed (${stepNumber} steps run).`);
    } else {
        console.log(`❌ ${failures} check(s) failed out of ${stepNumber} steps. Scroll up for details.`);
        process.exitCode = 1;
    }
}

main()
    .catch((error) => {
        console.error("\n💥 Script crashed unexpectedly:");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });