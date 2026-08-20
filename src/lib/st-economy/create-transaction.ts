// src/lib/st-economy/create-transaction.ts
//
// THE single entry point for changing a student's ST balance.
// No other file in the codebase is allowed to touch LevelStBalance.balance or
// Student.avgSt directly. Every reward/penalty in the whole system -
// instructor-driven, deadline-triggered, hint unlocks, store purchases,
// manual adjustments, level resets - must go through applySTChange().
//
// Why this exists as one chokepoint:
// - Atomicity: balance update + average recompute + snapshot + transaction
//   row all happen in ONE database transaction. If any step fails,
//   everything rolls back.
// - Race safety: we use Prisma's atomic `increment`/`decrement` inside the
//   update, so the database computes the new value itself. Two concurrent
//   calls (e.g. a student unlocking a hint twice in two tabs) can never
//   produce a "lost update" - Postgres serializes the two UPDATEs on the
//   same row, and each one reads the truly-latest value at write time.
// - Single audit trail: every balance change - no matter the source -
//   always produces exactly one STTransaction row with a post-transaction
//   snapshot (levelStBalance/avgStBalance), so history is always
//   reconstructable and consistent with the live balance.
//
// avgSt mechanics (LevelStBalance / avgSt redesign):
// Student.avgSt is a cached, computed value - Math.round(average of every
// LevelStBalance.balance row belonging to that student, across every Level
// they've ever been in, frozen ones included). It is NOT incremented
// directly; every write here recomputes it from the full set of
// LevelStBalance rows so it can never drift out of sync.

import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ApplySTChangeInput, STTransactionResult } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Recomputes and persists Student.avgSt from the full set of that student's
// LevelStBalance rows. Must be called inside the same `tx` as the balance
// write it's reacting to, so the cached average is never one write behind
// the real per-Level balances.
async function recomputeAvgSt(
    tx: Prisma.TransactionClient,
    studentId: string
): Promise<number> {
    const balances = await tx.levelStBalance.findMany({
        where: { studentId },
        select: { balance: true },
    });

    // Should never be empty in practice - every student gets a
    // LevelStBalance row the moment they're placed in a Level - but guard
    // against division by zero rather than throwing, in case this runs
    // mid-migration or against stale test data.
    const avg =
        balances.length === 0
            ? 50
            : Math.round(
                  balances.reduce((sum, b) => sum + b.balance, 0) / balances.length
              );

    await tx.student.update({
        where: { id: studentId },
        data: { avgSt: avg },
    });

    return avg;
}

export async function applySTChange(
    input: ApplySTChangeInput
): Promise<STTransactionResult> {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
        throw new Error(
            "ST amount must be a positive integer. Sign is derived from `type`, not from the amount itself."
        );
    }

    const signedDelta = input.type === "REWARD" ? input.amount : -input.amount;

    // A single interactive transaction: upsert the per-Level balance
    // atomically via increment, recompute the cached average, then create
    // the audit row using the balances the update itself produced (so the
    // snapshot can never drift from reality).
    const result = await prisma.$transaction(async (tx) => {
        // Upsert, not just update: the student's LevelStBalance row for
        // this Level should already exist (created at Level-transition
        // time), but upserting keeps this resilient rather than throwing
        // if it's somehow missing - it lands on 50 + this delta, same
        // starting point a fresh row would have had.
        const updatedBalance = await tx.levelStBalance.upsert({
            where: {
                studentId_levelId: {
                    studentId: input.studentId,
                    levelId: input.levelId,
                },
            },
            create: {
                studentId: input.studentId,
                levelId: input.levelId,
                balance: 50 + signedDelta,
            },
            update: {
                balance: { increment: signedDelta },
            },
            select: { balance: true },
        });

        const avgSt = await recomputeAvgSt(tx, input.studentId);

        const transaction = await tx.sTTransaction.create({
            data: {
                studentId: input.studentId,
                levelId: input.levelId,
                type: input.type,
                reason: input.reason,
                amount: input.amount,
                relatedEntityId: input.relatedEntityId ?? null,
                levelStBalance: updatedBalance.balance,
                avgStBalance: avgSt,
            },
        });

        return transaction;
    });

    return result as STTransactionResult;
}

// Convenience wrapper: some callers (deadline reconciliation, level reset)
// need to guarantee a given (studentId, reason, relatedEntityId) combo is
// only ever rewarded/penalized ONCE, even if the check runs many times
// (e.g. every time a student opens their dashboard). This checks first,
// then delegates to applySTChange. The check-then-act is not itself atomic
// against a genuine simultaneous double-call, but the practical risk here
// is near zero (same student triggering the exact same lazy check twice in
// the same millisecond) - see reconcile.ts for how callers avoid this in
// practice by scoping calls per request.
export async function applySTChangeOnce(
    input: ApplySTChangeInput
): Promise<STTransactionResult | null> {
    if (!input.relatedEntityId) {
        throw new Error(
            "applySTChangeOnce requires relatedEntityId to deduplicate against."
        );
    }

    const existing = await prisma.sTTransaction.findFirst({
        where: {
            studentId: input.studentId,
            reason: input.reason,
            relatedEntityId: input.relatedEntityId,
        },
        select: { id: true },
    });

    if (existing) {
        return null; // already applied - no-op
    }

    return applySTChange(input);
}

// ------------------------------------------------------------------
// Level transition: creates the new Level's LevelStBalance row. The old
// Level's LevelStBalance row is untouched by design - it's the "freeze":
// once a Group moves on, that row stops changing forever and becomes pure
// history, still counted in every future avgSt average.
//
// Still produces exactly one STTransaction row per student, same audit
// guarantee as applySTChange - a REWARD of 50, reason LEVEL_RESET. Always
// exactly 50 now (unlike the old reset-a-column version, there is no "gap
// from the old balance" to compute - this is a brand new row, so the
// starting balance simply IS 50). The reason code (LEVEL_RESET) is what
// actually tells the student/instructor "this was a Level transition", not
// the type - see reason-labels.ts, which renders it neutrally either way.
//
// Meant to be called from inside the same $transaction as the Level
// create/deactivate in manage-level.ts, via the `tx` client passed in -
// so the Level change and every Student's new balance either all land
// together or all roll back together.
export async function createLevelStBalanceForTransition(
    tx: Prisma.TransactionClient,
    input: { studentId: string; newLevelId: string }
): Promise<STTransactionResult> {
    const STARTING_BALANCE = 50;

    // create, not upsert: a LevelStBalance row for (studentId, newLevelId)
    // should never already exist - newLevelId was just created in the same
    // transaction this is called from. If it somehow does exist, that's a
    // real bug worth surfacing loudly rather than silently overwriting it.
    const newBalance = await tx.levelStBalance.create({
        data: {
            studentId: input.studentId,
            levelId: input.newLevelId,
            balance: STARTING_BALANCE,
        },
    });

    const avgSt = await recomputeAvgSt(tx, input.studentId);

    const transaction = await tx.sTTransaction.create({
        data: {
            studentId: input.studentId,
            levelId: input.newLevelId,
            type: "REWARD",
            reason: "LEVEL_RESET",
            amount: STARTING_BALANCE,
            relatedEntityId: input.newLevelId,
            levelStBalance: newBalance.balance,
            avgStBalance: avgSt,
        },
    });

    return transaction as STTransactionResult;
}