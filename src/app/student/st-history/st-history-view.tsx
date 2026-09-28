// src/app/student/st-history/st-history-view.tsx
// Client Component - renders the ST transaction timeline and owns pagination.

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
    TrendingUp,
    TrendingDown,
    Filter,
    Loader2,
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

type FilterType = "ALL" | "REWARDS" | "PENALTIES";

export function StudentSTHistoryView({ initialPage }: { initialPage: STHistoryPage }) {
    const [transactions, setTransactions] = useState(initialPage.transactions);
    const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>("ALL");
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

    const filteredTransactions = transactions.filter((tx) => {
        if (filter === "REWARDS") return tx.type === "REWARD";
        if (filter === "PENALTIES") return tx.type === "PENALTY";
        return true;
    });

    const rewardsCount = transactions.filter((t) => t.type === "REWARD").length;
    const penaltiesCount = transactions.filter((t) => t.type === "PENALTY").length;

    if (transactions.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border/80 bg-space-900/30 p-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400 border border-gold-500/20 mb-3 shadow-gold">
                    <Coins className="size-6 text-gold-400" />
                </div>
                <h3 className="font-display text-base font-bold text-starlight-100">
                    No Star Token Activity Yet
                </h3>
                <p className="mt-1 text-xs text-starlight-400 max-w-sm mx-auto">
                    Your ledger is clear. As you participate in sessions and submit assignments, transaction events will appear here in chronological order.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border/70 bg-space-900/70 p-5 space-y-1">
                    <span className="text-xs font-semibold text-starlight-400 uppercase tracking-wider block">
                        Logged Transactions
                    </span>
                    <p className="font-mono text-2xl font-bold text-starlight-100">
                        {transactions.length}
                    </p>
                    <p className="text-[11px] text-starlight-400">total records in ledger</p>
                </div>

                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-5 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                            Rewards Earned
                        </span>
                        <TrendingUp className="size-4 text-emerald-400" />
                    </div>
                    <p className="font-mono text-2xl font-bold text-emerald-300">
                        {rewardsCount}
                    </p>
                    <p className="text-[11px] text-emerald-400/80">positive bonuses & credits</p>
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-red-950/15 p-5 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider block">
                            Deductions & Unlocks
                        </span>
                        <TrendingDown className="size-4 text-red-400" />
                    </div>
                    <p className="font-mono text-2xl font-bold text-red-300">
                        {penaltiesCount}
                    </p>
                    <p className="text-[11px] text-red-400/80">hints unlocked & penalties</p>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-1.5">
                    <Button
                        type="button"
                        size="sm"
                        variant={filter === "ALL" ? "default" : "outline"}
                        onClick={() => setFilter("ALL")}
                        className={`text-xs h-8 rounded-lg ${
                            filter === "ALL"
                                ? "bg-gold-500 text-space-950 font-bold hover:bg-gold-400"
                                : "border-border/70 bg-space-900 text-starlight-300 hover:bg-space-850"
                        }`}
                    >
                        All Activity ({transactions.length})
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        variant={filter === "REWARDS" ? "default" : "outline"}
                        onClick={() => setFilter("REWARDS")}
                        className={`text-xs h-8 rounded-lg ${
                            filter === "REWARDS"
                                ? "bg-emerald-500 text-space-950 font-bold hover:bg-emerald-400"
                                : "border-border/70 bg-space-900 text-starlight-300 hover:bg-space-850"
                        }`}
                    >
                        Rewards ({rewardsCount})
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        variant={filter === "PENALTIES" ? "default" : "outline"}
                        onClick={() => setFilter("PENALTIES")}
                        className={`text-xs h-8 rounded-lg ${
                            filter === "PENALTIES"
                                ? "bg-red-500 text-white font-bold hover:bg-red-400"
                                : "border-border/70 bg-space-900 text-starlight-300 hover:bg-space-850"
                        }`}
                    >
                        Deductions ({penaltiesCount})
                    </Button>
                </div>
            </div>

            {/* Transactions Timeline */}
            <div className="rounded-2xl border border-border/70 bg-space-900/60 overflow-hidden divide-y divide-border/60 shadow-xl">
                {filteredTransactions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-starlight-400">
                        No transactions match the selected filter.
                    </div>
                ) : (
                    filteredTransactions.map((tx) => (
                        <STHistoryRow key={tx.id} transaction={tx} />
                    ))
                )}
            </div>

            {error && (
                <p className="text-center text-xs text-red-400">{error}</p>
            )}

            {/* Load More Action */}
            {nextCursor && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isPending}
                        className="rounded-xl border-gold-500/40 bg-space-900/80 hover:bg-space-850 text-gold-300 font-semibold px-6 shadow-gold text-xs h-10"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin text-gold-400" />
                                Loading older transactions...
                            </>
                        ) : (
                            "Load More Records"
                        )}
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
        <div className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-space-850/50">
            <div className="flex min-w-0 items-center gap-3.5">
                <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                        isReward
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-xs"
                            : "bg-red-500/15 text-red-400 border-red-500/30"
                    }`}
                >
                    <Icon className="size-5" />
                </div>

                <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-semibold text-starlight-100">
                        {getReasonLabel(transaction.reason)}
                    </p>
                    <p className="text-xs text-starlight-400 font-mono">
                        {formatDateTime(transaction.createdAt)}
                    </p>
                </div>
            </div>

            <div className="text-right shrink-0">
                <span
                    className={`font-mono text-base font-extrabold tabular-nums ${
                        isReward ? "text-gold-300" : "text-red-400"
                    }`}
                >
                    {signedAmount} ST
                </span>
            </div>
        </div>
    );
}