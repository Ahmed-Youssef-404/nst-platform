// src/app/student/st-history/st-history-view.tsx
// Client Component - renders the ST transaction timeline and owns the
// "Load more" pagination state. Receives the first page as a prop from
// the Server Component (page.tsx) so the initial render has no loading
// flash, then fetches further pages itself via getStudentSTHistoryAction.
//
// Simple timeline list per design decision (not a table, no filters) -
// one row per transaction: icon + reason + timestamp on the left,
// signed amount on the right. Reward rows use the "success" token,
// Penalty rows use the "error" token (same tokens STBalanceCard already
// uses for its zone styling, so the color language stays consistent
// across the Student area).

"use client";

import { useState, useTransition } from "react";
import {
    CalendarCheck,
    Users,
    Clock3,
    Sparkles,
    Trophy,
    ListChecks,
    ClipboardCheck,
    Target,
    Lightbulb,
    CalendarX,
    FileX,
    ShoppingBag,
    SlidersHorizontal,
    RotateCcw,
    Coins,
    type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStudentSTHistoryAction } from "@/lib/actions/st-economy";
import { getReasonLabel } from "@/lib/st-economy/reason-labels";
import { formatDateTime } from "@/lib/format-date";
import type { STHistoryPage } from "@/lib/data/get-st-balance";
import type { STReasonCode, STTransactionResult } from "@/types/types";

const REASON_ICONS: Record<STReasonCode, LucideIcon> = {
    ATTENDANCE: CalendarCheck,
    SESSION_ENGAGEMENT: Users,
    SUBMIT_BEFORE_DEADLINE: Clock3,
    BONUS_TASK_SOLVED: Sparkles,
    FIRST_SOLVER: Trophy,
    FINISH_ALL_TASKS: ListChecks,
    RUBRIC_GRADING: ClipboardCheck,
    WEEKLY_MISSION: Target,
    HINT_UNLOCK: Lightbulb,
    MISSED_SESSION: CalendarX,
    TASK_NOT_SUBMITTED: FileX,
    STORE_PURCHASE: ShoppingBag,
    MANUAL_ADJUSTMENT: SlidersHorizontal,
    LEVEL_RESET: RotateCcw,
};

export function StudentSTHistoryView({ initialPage }: { initialPage: STHistoryPage }) {
    const [transactions, setTransactions] = useState(initialPage.transactions);
    const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleLoadMore() {
        if (!nextCursor) return;
        setError(null);

        startTransition(async () => {
            const result = await getStudentSTHistoryAction(nextCursor);

            if (!result.success || !result.data) {
                setError(result.error ?? "Could not load more transactions.");
                return;
            }

            setTransactions((prev) => [...prev, ...result.data.transactions]);
            setNextCursor(result.data.nextCursor);
        });
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
                <Coins className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    No ST activity yet. Rewards and penalties will show up here as you go.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border">
                {transactions.map((transaction) => (
                    <STHistoryRow key={transaction.id} transaction={transaction} />
                ))}
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            {nextCursor && (
                <div className="flex justify-center">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isPending}
                    >
                        {isPending ? "Loading..." : "Load more"}
                    </Button>
                </div>
            )}
        </div>
    );
}

function STHistoryRow({ transaction }: { transaction: STTransactionResult }) {
    const isReward = transaction.type === "REWARD";
    const Icon = REASON_ICONS[transaction.reason] ?? Coins;
    const signedAmount = isReward ? `+${transaction.amount}` : `-${transaction.amount}`;

    return (
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5 last:border-b-0">
            <div className="flex min-w-0 items-center gap-3">
                <span
                    className={
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
                        (isReward ? "bg-success-bg text-success" : "bg-error-bg text-error")
                    }
                >
                    <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                        {getReasonLabel(transaction.reason)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatDateTime(transaction.createdAt)}
                    </p>
                </div>
            </div>
            <span
                className={
                    "shrink-0 text-sm font-semibold tabular-nums " +
                    (isReward ? "text-success" : "text-error")
                }
            >
                {signedAmount} ST
            </span>
        </div>
    );
}