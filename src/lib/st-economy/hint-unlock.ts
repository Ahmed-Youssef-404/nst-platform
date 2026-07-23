// src/lib/st-economy/hint-unlock.ts
//
// Flow: student clicks "Unlock Hint" -> UI shows a confirmation popup with
// the hint's cost (read-only, no DB write yet) -> student confirms ->
// unlockHint() runs. Once unlocked, it's permanent for that student
// (enforced by the existing unique(studentId, hintId) constraint).
//
// costPaid is snapshotted onto HintUnlock at unlock time, so if a hint's
// price changes later, historical unlocks stay accurate - this mirrors
// exactly what applySTChange already does for balances.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applySTChange } from "./create-transaction";
import { UnlockHintInput } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function unlockHint(input: UnlockHintInput) {
    const alreadyUnlocked = await prisma.hintUnlock.findUnique({
        where: {
            studentId_hintId: {
                studentId: input.studentId,
                hintId: input.hintId,
            },
        },
    });

    if (alreadyUnlocked) {
        // Already paid for - just return it, no re-charge.
        return alreadyUnlocked;
    }

    const hint = await prisma.hint.findUniqueOrThrow({
        where: { id: input.hintId },
        include: { task: { select: { session: { select: { levelId: true } } } } },
    });

    const levelId = hint.task.session.levelId;

    // Deduct ST first (applySTChange is atomic on its own), then record the
    // unlock. If the unlock insert fails after a successful deduction
    // (e.g. a genuine concurrent double-click racing past the check above),
    // the unique constraint on HintUnlock will throw and the student keeps
    // their ST deducted without an unlock row - see note below.
    await applySTChange({
        studentId: input.studentId,
        levelId,
        type: "PENALTY",
        reason: "HINT_UNLOCK",
        amount: hint.cost,
        relatedEntityId: hint.id,
    });

    try {
        const hintUnlock = await prisma.hintUnlock.create({
            data: {
                studentId: input.studentId,
                hintId: input.hintId,
                costPaid: hint.cost,
            },
        });
        return hintUnlock;
    } catch (error) {
        // Race condition fallback: two simultaneous unlock clicks both
        // passed the "already unlocked?" check, both deducted ST, but only
        // one HintUnlock row can exist (unique constraint). Refund the
        // loser's deduction and return the winner's existing row, so the
        // student is never double-charged for one hint.
        const winner = await prisma.hintUnlock.findUnique({
            where: {
                studentId_hintId: {
                    studentId: input.studentId,
                    hintId: input.hintId,
                },
            },
        });

        if (winner) {
            await applySTChange({
                studentId: input.studentId,
                levelId,
                type: "REWARD",
                reason: "MANUAL_ADJUSTMENT",
                amount: hint.cost,
                relatedEntityId: hint.id,
            });
            return winner;
        }

        throw error;
    }
}