// src/lib/st-economy/create-transaction.ts
//
// THE single entry point for changing a student's ST balance.
// No other file in the codebase is allowed to touch Student.levelSt or
// Student.totalSt directly. Every reward/penalty in the whole system -
// instructor-driven, deadline-triggered, hint unlocks, store purchases,
// manual adjustments, level resets - must go through applySTChange().
//
// Why this exists as one chokepoint:
// - Atomicity: balance update + snapshot + transaction row all happen in
//   ONE database transaction. If any step fails, everything rolls back.
// - Race safety: we use Prisma's atomic `increment`/`decrement` inside the
//   update, so the database computes the new value itself. Two concurrent
//   calls (e.g. a student unlocking a hint twice in two tabs) can never
//   produce a "lost update" - Postgres serializes the two UPDATEs on the
//   same row, and each one reads the truly-latest value at write time.
// - Single audit trail: every balance change - no matter the source -
//   always produces exactly one STTransaction row with a post-transaction
//   snapshot (levelStBalance/totalStBalance), so history is always
//   reconstructable and consistent with the live balance.

import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ApplySTChangeInput, STTransactionResult } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function applySTChange(
    input: ApplySTChangeInput
): Promise<STTransactionResult> {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
        throw new Error(
            "ST amount must be a positive integer. Sign is derived from `type`, not from the amount itself."
        );
    }

    const signedDelta = input.type === "REWARD" ? input.amount : -input.amount;

    // A single interactive transaction: update balances atomically via
    // increment, then create the audit row using the balances the update
    // itself returned (so the snapshot can never drift from reality).
    const result = await prisma.$transaction(async (tx) => {
        const updatedStudent = await tx.student.update({
            where: { id: input.studentId },
            data: {
                levelSt: { increment: signedDelta },
                totalSt: { increment: signedDelta },
            },
            select: { levelSt: true, totalSt: true },
        });

        const transaction = await tx.sTTransaction.create({
            data: {
                studentId: input.studentId,
                levelId: input.levelId,
                type: input.type,
                reason: input.reason,
                amount: input.amount,
                relatedEntityId: input.relatedEntityId ?? null,
                levelStBalance: updatedStudent.levelSt,
                totalStBalance: updatedStudent.totalSt,
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
// Level transition reset: the one exception to "always increment/decrement".
// When a Group moves to a new Level, every Student's levelSt must land on
// EXACTLY 50, regardless of what it was before (could be negative, could
// be 300) - so this uses `set`, not `increment`. totalSt is untouched by
// design (it's the cumulative, never-resets balance).
//
// Still produces exactly one STTransaction row per student, same audit
// guarantee as applySTChange: type/amount are derived from the gap between
// the old balance and 50 purely so the ledger records a real, non-zero
// delta (an entry showing "amount: 0" would look like a no-op transaction
// in the history UI). The reason code (LEVEL_RESET) is what actually tells
// the student/instructor "this was a Level transition", not the type -
// see reason-labels.ts, which renders it neutrally either way.
//
// Meant to be called from inside the same $transaction as the Level
// create/deactivate in manage-level.ts, via the `tx` client passed in -
// so the Level change and every Student's reset either all land together
// or all roll back together.
export async function resetLevelStForTransition(
    tx: Prisma.TransactionClient,
    input: { studentId: string; newLevelId: string }
): Promise<STTransactionResult | null> {
    const TARGET = 50;

    const student = await tx.student.findUniqueOrThrow({
        where: { id: input.studentId },
        select: { levelSt: true, totalSt: true },
    });

    const delta = TARGET - student.levelSt;

    // Already at 50 (e.g. a brand-new student who never earned/spent
    // anything yet in the old Level) - nothing to record, totalSt is
    // never touched here anyway.
    if (delta === 0) return null;

    const updatedStudent = await tx.student.update({
        where: { id: input.studentId },
        data: { levelSt: TARGET }, // set, not increment - the whole point
        select: { levelSt: true, totalSt: true },
    });

    const transaction = await tx.sTTransaction.create({
        data: {
            studentId: input.studentId,
            levelId: input.newLevelId,
            type: delta > 0 ? "REWARD" : "PENALTY",
            reason: "LEVEL_RESET",
            amount: Math.abs(delta),
            relatedEntityId: input.newLevelId,
            levelStBalance: updatedStudent.levelSt,
            totalStBalance: updatedStudent.totalSt,
        },
    });

    return transaction as STTransactionResult;
}