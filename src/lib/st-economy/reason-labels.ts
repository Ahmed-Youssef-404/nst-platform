// src/lib/st-economy/reason-labels.ts
// Human-readable labels for STReasonCode, for any UI that displays ST
// transaction history (currently: student ST History page).
//
// Kept separate from balance-status.ts since that file is about deriving
// the current zone (normal/warning/danger), not about describing individual
// past transactions.

import type { STReasonCode } from "@/types/types";

export const ST_REASON_LABELS: Record<STReasonCode, string> = {
    ATTENDANCE: "Attendance",
    SESSION_ENGAGEMENT: "Session engagement",
    SUBMIT_BEFORE_DEADLINE: "Submitted before deadline",
    BONUS_TASK_SOLVED: "Bonus task solved",
    FIRST_SOLVER: "First solver in group",
    FINISH_ALL_TASKS: "Finished all tasks before deadline",
    RUBRIC_GRADING: "Task graded",
    WEEKLY_MISSION: "Weekly Mission",
    HINT_UNLOCK: "Hint unlocked",
    MISSED_SESSION: "Missed session",
    TASK_NOT_SUBMITTED: "Task not submitted",
    STORE_PURCHASE: "Store purchase",
    MANUAL_ADJUSTMENT: "Manual adjustment",
    LEVEL_RESET: "Level reset",
};

// Fallback for any reason code not yet in the map above (defensive - keeps
// the UI from breaking if a new STReason is added to the Prisma enum but
// this map isn't updated yet).
export function getReasonLabel(reason: STReasonCode): string {
    return ST_REASON_LABELS[reason] ?? reason;
}