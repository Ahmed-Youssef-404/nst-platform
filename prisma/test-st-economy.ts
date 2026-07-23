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
// Run with:
//   npx tsx prisma/test-st-economy.ts
//
// To leave the test data in the database for manual inspection afterwards:
//   npx tsx prisma/test-st-economy.ts --keep

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

import { applySTChange, applySTChangeOnce } from "../src/lib/st-economy/create-transaction";
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

async function printBalance(studentId: string, label: string) {
    const student = await prisma.student.findUniqueOrThrow({
        where: { id: studentId },
        select: { levelSt: true, totalSt: true },
    });
    const status = getBalanceStatus(student.levelSt, student.totalSt);
    console.log(
        `  📊 [${label}] levelSt=${status.levelSt} totalSt=${status.totalSt} zone=${status.zone}`
    );
    return student;
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
            `     ${sign}${tx.amount} [${tx.reason}] -> levelSt=${tx.levelStBalance} totalSt=${tx.totalStBalance}`
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
    // Deleting the Batch cascades through Group -> Level -> Session ->
    // Task -> Hint/Submission, and Student -> STTransaction/HintUnlock/
    // Attendance, per the onDelete: Cascade relations in schema.prisma.
    await prisma.student.deleteMany({
        where: { id: { in: [ctx.studentAId, ctx.studentBId] } },
    });
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

    await printBalance(ctx.studentAId, "initial");
    await step("Initial balances are the schema defaults (50 / 0)", async () => {
        const s = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        assert(s.levelSt === 50, `Student A starts at levelSt=50 (got ${s.levelSt})`);
        assert(s.totalSt === 0, `Student A starts at totalSt=0 (got ${s.totalSt})`);
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
        const s = await printBalance(ctx.studentAId, "after +5");
        assert(s.levelSt === 55, `levelSt is 55 (got ${s.levelSt})`);
        assert(s.totalSt === 5, `totalSt is 5 (got ${s.totalSt})`);
    });

    await step("Apply a manual -30 penalty (should allow going negative on levelSt later)", async () => {
        await applySTChange({
            studentId: ctx.studentAId,
            levelId: ctx.levelId,
            type: "PENALTY",
            reason: "MANUAL_ADJUSTMENT",
            amount: 30,
        });
        const s = await printBalance(ctx.studentAId, "after -30");
        assert(s.levelSt === 25, `levelSt is 25 (got ${s.levelSt})`);
        assert(s.totalSt === -25, `totalSt is -25 (got ${s.totalSt})`);
    });

    await step("Balance zone is 'warning' at levelSt=25 with default threshold 20? (should be normal, 25 > 20)", async () => {
        const s = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        const status = getBalanceStatus(s.levelSt, s.totalSt);
        assert(status.zone === "normal", `zone is 'normal' at levelSt=25 (got ${status.zone})`);
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
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        const result = await applySTChangeOnce({
            studentId: ctx.studentAId,
            levelId: ctx.levelId,
            type: "REWARD",
            reason: "FIRST_SOLVER",
            amount: 5,
            relatedEntityId: ctx.taskId,
        });
        const after = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        assert(result === null, "second call returns null (deduped)");
        assert(before.levelSt === after.levelSt, "balance unchanged on the duplicate call");
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
        const s = await printBalance(ctx.studentBId, "after PRESENT");
        assert(s.levelSt === 60, `levelSt is 60 (got ${s.levelSt})`);
    });

    await step("Re-submitting the SAME status is a no-op (no double reward)", async () => {
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentBId } });
        await recordAttendance({
            studentId: ctx.studentBId,
            sessionId: ctx.pastSessionId,
            status: "PRESENT",
            recordedBy: ctx.instructorId,
        });
        const after = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentBId } });
        assert(before.levelSt === after.levelSt, "balance unchanged when re-submitting same status");
    });

    await step("Correcting PRESENT -> ABSENT reverses +10 and applies -20", async () => {
        await recordAttendance({
            studentId: ctx.studentBId,
            sessionId: ctx.pastSessionId,
            status: "ABSENT",
            recordedBy: ctx.instructorId,
        });
        const s = await printBalance(ctx.studentBId, "after correction to ABSENT");
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
        await printBalance(ctx.studentAId, "after engagement +5");
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
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        await unlockHint({ studentId: ctx.studentAId, hintId: ctx.hintIds[0] });
        const after = await printBalance(ctx.studentAId, "after Hint 1 unlock");
        assert(after.levelSt === before.levelSt - 5, `levelSt decreased by exactly 5 (${before.levelSt} -> ${after.levelSt})`);
    });

    await step("Unlocking the SAME hint again does not charge twice", async () => {
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        await unlockHint({ studentId: ctx.studentAId, hintId: ctx.hintIds[0] });
        const after = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        assert(before.levelSt === after.levelSt, "no additional charge on re-unlock");
    });

    await step("Unlock Hint 2 (-15) and Hint 3 (-30)", async () => {
        await unlockHint({ studentId: ctx.studentAId, hintId: ctx.hintIds[1] });
        await unlockHint({ studentId: ctx.studentAId, hintId: ctx.hintIds[2] });
        await printBalance(ctx.studentAId, "after all 3 hints unlocked");
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
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });

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
        const after = await printBalance(ctx.studentAId, "after rubric grading (8) + first-solver attempt");
        assert(after.levelSt === before.levelSt + 8, `levelSt increased by exactly 8 (rubric only, first-solver deduped) (${before.levelSt} -> ${after.levelSt})`);
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
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });

        await gradeSubmission({
            submissionId: bonusSubmission.id,
            understandingScore: 2,
            approachScore: 3,
            correctnessScore: 3,
            implementationScore: 2,
            gradedBy: ctx.instructorId,
        });

        const after = await printBalance(ctx.studentAId, "after bonus task graded (10 rubric + 10 bonus)");
        assert(after.levelSt === before.levelSt + 20, `levelSt increased by 20 (10 rubric + 10 bonus) (${before.levelSt} -> ${after.levelSt})`);
    });

    // ================================================================
    section("TEST 7: Deadline-triggered reconciliation");
    // ================================================================
    await step("reconcileTaskDeadlines: Student A (submitted on time) gets +5", async () => {
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        await reconcileTaskDeadlines(ctx.studentAId);
        const after = await printBalance(ctx.studentAId, "Student A after task-deadline reconcile");
        assert(after.levelSt === before.levelSt + 5, `levelSt increased by 5 (SUBMIT_BEFORE_DEADLINE) (${before.levelSt} -> ${after.levelSt})`);
    });

    await step("reconcileTaskDeadlines: Student B (never submitted) gets -10", async () => {
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentBId } });
        await reconcileTaskDeadlines(ctx.studentBId);
        const after = await printBalance(ctx.studentBId, "Student B after task-deadline reconcile");
        assert(after.levelSt === before.levelSt - 10, `levelSt decreased by 10 (TASK_NOT_SUBMITTED) (${before.levelSt} -> ${after.levelSt})`);
    });

    await step("Running reconcileTaskDeadlines again is a no-op (idempotent)", async () => {
        const beforeA = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        const beforeB = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentBId } });
        await reconcileTaskDeadlines(ctx.studentAId);
        await reconcileTaskDeadlines(ctx.studentBId);
        const afterA = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        const afterB = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentBId } });
        assert(beforeA.levelSt === afterA.levelSt, "Student A balance unchanged on 2nd run");
        assert(beforeB.levelSt === afterB.levelSt, "Student B balance unchanged on 2nd run");
    });

    await step("reconcileFinishAllTasks: Student A finished the only non-bonus task in the session -> +10", async () => {
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        await reconcileFinishAllTasks(ctx.studentAId);
        const after = await printBalance(ctx.studentAId, "Student A after finish-all-tasks reconcile");
        assert(after.levelSt === before.levelSt + 10, `levelSt increased by 10 (FINISH_ALL_TASKS) (${before.levelSt} -> ${after.levelSt})`);
    });

    await step("reconcileFinishAllTasks: Student B did NOT finish -> no change", async () => {
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentBId } });
        await reconcileFinishAllTasks(ctx.studentBId);
        const after = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentBId } });
        assert(before.levelSt === after.levelSt, "Student B balance unchanged (didn't finish all tasks)");
    });

    // ================================================================
    section("TEST 8: Weekly Mission");
    // ================================================================
    await step("Student A attended + submitted everything in week 0 -> +30", async () => {
        // Student A needs an Attendance=PRESENT row for pastSessionId too,
        // since Weekly Mission requires attending ALL sessions in the week.
        await recordAttendance({
            studentId: ctx.studentAId,
            sessionId: ctx.pastSessionId,
            status: "PRESENT",
            recordedBy: ctx.instructorId,
        });

        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        await reconcileWeeklyMission(ctx.studentAId);
        const after = await printBalance(ctx.studentAId, "Student A after weekly mission reconcile");
        assert(after.levelSt === before.levelSt + 30 + 10, `levelSt increased by 40 (attendance +10, then weekly mission +30) (${before.levelSt} -> ${after.levelSt})`);
    });

    await step("Student B did not attend/submit everything -> no Weekly Mission reward", async () => {
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentBId } });
        await reconcileWeeklyMission(ctx.studentBId);
        const after = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentBId } });
        // Student B's attendance for pastSessionId was set to ABSENT earlier
        // in TEST 3, so the mission should fail (not all sessions attended).
        assert(before.levelSt === after.levelSt, "Student B balance unchanged (mission not completed)");
    });

    await step("Running reconcileWeeklyMission again is idempotent", async () => {
        const before = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        await reconcileWeeklyMission(ctx.studentAId);
        const after = await prisma.student.findUniqueOrThrow({ where: { id: ctx.studentAId } });
        assert(before.levelSt === after.levelSt, "no double reward on 2nd Weekly Mission run");
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
    await step("Every STTransaction's levelStBalance snapshot matches a real running total", async () => {
        for (const studentId of [ctx.studentAId, ctx.studentBId]) {
            const history = await prisma.sTTransaction.findMany({
                where: { studentId },
                orderBy: { createdAt: "asc" },
            });
            let runningLevel = 50;
            let runningTotal = 0;
            let ok = true;
            for (const tx of history) {
                const delta = tx.type === "REWARD" ? tx.amount : -tx.amount;
                runningLevel += delta;
                runningTotal += delta;
                if (runningLevel !== tx.levelStBalance || runningTotal !== tx.totalStBalance) {
                    ok = false;
                    console.log(
                        `     mismatch at tx ${tx.id}: expected level=${runningLevel} total=${runningTotal}, got level=${tx.levelStBalance} total=${tx.totalStBalance}`
                    );
                }
            }
            const finalStudent = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
            assert(ok, `${studentId}: running snapshot total matches every recorded transaction`);
            assert(
                finalStudent.levelSt === runningLevel && finalStudent.totalSt === runningTotal,
                `${studentId}: final Student row (levelSt=${finalStudent.levelSt}, totalSt=${finalStudent.totalSt}) matches replayed history (level=${runningLevel}, total=${runningTotal})`
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