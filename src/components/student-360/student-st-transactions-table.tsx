// src/components/student-360/student-st-transactions-table.tsx
"use client";

import { useState, useMemo } from "react";
import type { Student360STTransaction } from "@/lib/data/get-student-360";
import { formatDateTime } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Coins,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    UserCheck,
    Cpu,
    Sparkles,
    Calendar,
    ChevronLeft,
    ChevronRight,
    FileText,
    Info,
    X,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
    ATTENDANCE: "Session Attendance",
    SESSION_ENGAGEMENT: "Session Engagement",
    SUBMIT_BEFORE_DEADLINE: "Submitted On Time",
    BONUS_TASK_SOLVED: "Bonus Task Solved",
    FIRST_SOLVER: "First Solver Bonus",
    FINISH_ALL_TASKS: "Completed All Tasks",
    RUBRIC_GRADING: "Rubric Grading",
    WEEKLY_MISSION: "Weekly Mission",
    HINT_UNLOCK: "Hint Unlocked",
    MISSED_SESSION: "Missed Session",
    TASK_NOT_SUBMITTED: "Task Not Submitted",
    STORE_PURCHASE: "Store Item Purchase",
    MANUAL_ADJUSTMENT: "System Adjustment",
    LEVEL_RESET: "Level Transition Initialization",
    INSTRUCTOR_ADJUSTMENT: "Instructor ST Adjustment",
};

export function StudentSTTransactionsTable({
    transactions,
    isBeginner = false,
}: {
    transactions: Student360STTransaction[];
    isBeginner?: boolean;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"ALL" | "REWARD" | "PENALTY" | "INSTRUCTOR">("ALL");
    const [selectedTx, setSelectedTx] = useState<Student360STTransaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;

    const filteredTransactions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return transactions.filter((tx) => {
            // Type filter
            if (typeFilter === "REWARD" && tx.type !== "REWARD") return false;
            if (typeFilter === "PENALTY" && tx.type !== "PENALTY") return false;
            if (typeFilter === "INSTRUCTOR" && tx.reason !== "INSTRUCTOR_ADJUSTMENT") return false;

            // Search query
            if (!q) return true;
            const humanReason = (REASON_LABELS[tx.reason] || tx.reason).toLowerCase();
            const note = (tx.note || "").toLowerCase();
            const entity = (tx.relatedEntityName || "").toLowerCase();
            const actor = (tx.actorName || "").toLowerCase();

            return (
                humanReason.includes(q) ||
                note.includes(q) ||
                entity.includes(q) ||
                actor.includes(q)
            );
        });
    }, [transactions, searchQuery, typeFilter]);

    const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTransactions.slice(start, start + pageSize);
    }, [filteredTransactions, currentPage, pageSize]);

    return (
        <div className="space-y-4">
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-starlight-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by reason, note, task, or instructor..."
                        className="pl-9 h-10 bg-space-900/70 border-border/80 text-starlight-100 placeholder:text-starlight-400 focus-visible:border-gold-500/50"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setCurrentPage(1);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-starlight-400 hover:text-starlight-100"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-space-950/60 border border-border/80 shrink-0 overflow-x-auto">
                    {(
                        [
                            { id: "ALL", label: "All Records" },
                            { id: "REWARD", label: "Rewards (+)" },
                            { id: "PENALTY", label: "Penalties (-)" },
                            { id: "INSTRUCTOR", label: "Instructor Adjustments" },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setTypeFilter(tab.id);
                                setCurrentPage(1);
                            }}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                                typeFilter === tab.id
                                    ? "bg-gold-500/15 text-gold-300 border border-gold-500/35 shadow-gold"
                                    : "text-starlight-400 hover:text-starlight-100 hover:bg-space-850"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-2xl border border-border/80 bg-space-900/70 overflow-hidden shadow-2 backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-border/70 bg-space-950/60 text-[11px] font-bold uppercase tracking-wider text-starlight-400">
                            <tr>
                                <th className="px-5 py-3.5 whitespace-nowrap">Date & Time</th>
                                <th className="px-5 py-3.5 whitespace-nowrap">Type & Amount</th>
                                <th className="px-5 py-3.5">Reason & Description</th>
                                <th className="px-5 py-3.5 whitespace-nowrap">Snapshot Balance</th>
                                <th className="px-5 py-3.5 whitespace-nowrap">Related Entity</th>
                                <th className="px-5 py-3.5 whitespace-nowrap">Source / Actor</th>
                                <th className="px-4 py-3.5 text-right">Details</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-border/60 text-starlight-200">
                            {paginatedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-starlight-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-space-850 border border-border/80 text-starlight-400">
                                                <Coins className="size-5" />
                                            </div>
                                            <p className="font-semibold text-starlight-200">
                                                {searchQuery || typeFilter !== "ALL"
                                                    ? "No ST transactions match your active filters."
                                                    : "No ST transactions recorded for this cadet yet."}
                                            </p>
                                            <p className="text-xs text-starlight-400">
                                                Every reward, penalty, and adjustment will appear here in chronological order.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTransactions.map((tx) => {
                                    const isReward = tx.type === "REWARD";
                                    const reasonLabel = REASON_LABELS[tx.reason] || tx.reason.replace(/_/g, " ");

                                    return (
                                        <tr
                                            key={tx.id}
                                            className="hover:bg-space-850/50 transition-colors group cursor-pointer"
                                            onClick={() => setSelectedTx(tx)}
                                        >
                                            {/* 1. Date */}
                                            <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-starlight-400">
                                                {formatDateTime(tx.createdAt)}
                                            </td>

                                            {/* 2. Amount & Type */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-lg text-xs border",
                                                        isReward
                                                            ? "bg-success-500/10 text-success-400 border-success-500/25"
                                                            : "bg-destructive/10 text-destructive border-destructive/25"
                                                    )}
                                                >
                                                    {isReward ? (
                                                        <ArrowUpRight className="size-3.5 text-success-400" />
                                                    ) : (
                                                        <ArrowDownRight className="size-3.5 text-destructive" />
                                                    )}
                                                    <span>{isReward ? `+${tx.amount}` : `-${tx.amount}`}</span>
                                                    <span className="text-[10px] opacity-80">ST</span>
                                                </span>
                                            </td>

                                            {/* 3. Reason & Note */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-starlight-100 group-hover:text-gold-300 transition-colors">
                                                        {reasonLabel}
                                                    </span>
                                                    {tx.note && (
                                                        <span className="text-[11px] text-starlight-400 line-clamp-1 italic">
                                                            &ldquo;{tx.note}&rdquo;
                                                        </span>
                                                    )}
                                                    {tx.wasHalvedDueToLateResource && (
                                                        <span className="text-[10px] text-amber-400 font-semibold">
                                                            ⚠ Halved due to missing/late weekly file
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 4. Resulting Snapshot */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {tx.resultingBalanceSnapshot !== null ? (
                                                    <div className="flex items-center gap-1.5 font-mono text-starlight-300">
                                                        <span className="font-bold text-starlight-100">
                                                            {tx.resultingBalanceSnapshot}
                                                        </span>
                                                        <span className="text-[10px] text-starlight-400">ST</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-starlight-400/60">—</span>
                                                )}
                                            </td>

                                            {/* 5. Related Entity */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {tx.relatedEntityName ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-space-850 border border-border/70 text-[11px] font-medium text-starlight-200 max-w-[200px] truncate">
                                                        <FileText className="size-3 text-gold-400 shrink-0" />
                                                        <span className="truncate">{tx.relatedEntityName}</span>
                                                    </span>
                                                ) : tx.weekName ? (
                                                    <span className="text-[11px] text-starlight-400">
                                                        Week: {tx.weekName}
                                                    </span>
                                                ) : tx.levelName ? (
                                                    <span className="text-[11px] text-starlight-400">
                                                        Level {tx.levelNumber}: {tx.levelName}
                                                    </span>
                                                ) : (
                                                    <span className="text-starlight-400/60">—</span>
                                                )}
                                            </td>

                                            {/* 6. Source / Actor */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {tx.actorName ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-violet-300 font-medium">
                                                        <UserCheck className="size-3 text-violet-400" />
                                                        <span>{tx.actorName}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-starlight-400">
                                                        <Cpu className="size-3 text-starlight-400" />
                                                        <span>System Automated</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* 7. Action */}
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="size-7 p-0 text-starlight-400 hover:text-gold-300 hover:bg-space-800"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTx(tx);
                                                    }}
                                                >
                                                    <Info className="size-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredTransactions.length > pageSize && (
                    <div className="flex items-center justify-between border-t border-border/70 bg-space-950/60 px-5 py-3">
                        <span className="text-xs text-starlight-400 font-mono">
                            Page {currentPage} of {totalPages} ({filteredTransactions.length} total entries)
                        </span>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="h-8 rounded-lg border-border/80 text-xs text-starlight-300 disabled:opacity-40"
                            >
                                <ChevronLeft className="size-3.5 mr-1" />
                                Previous
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="h-8 rounded-lg border-border/80 text-xs text-starlight-300 disabled:opacity-40"
                            >
                                Next
                                <ChevronRight className="size-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Transaction Dialog */}
            {selectedTx && (
                <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
                    <DialogContent className="border border-border/80 bg-space-900 text-starlight-100 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
                                <Coins className="size-5 text-gold-400" />
                                ST Transaction Record
                            </DialogTitle>
                            <DialogDescription className="text-xs text-starlight-400 font-mono">
                                Audit ID: {selectedTx.id}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-2 text-xs">
                            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-space-950/70 border border-border/70">
                                <div>
                                    <p className="text-starlight-400 text-[10px] uppercase font-bold">Transaction Type</p>
                                    <p className="text-sm font-bold text-starlight-100 mt-0.5">{selectedTx.type}</p>
                                </div>
                                <div>
                                    <p className="text-starlight-400 text-[10px] uppercase font-bold">Amount Applied</p>
                                    <p
                                        className={cn(
                                            "text-sm font-bold font-mono mt-0.5",
                                            selectedTx.type === "REWARD" ? "text-success-400" : "text-destructive"
                                        )}
                                    >
                                        {selectedTx.type === "REWARD" ? `+${selectedTx.amount}` : `-${selectedTx.amount}`} ST
                                    </p>
                                </div>
                                <div>
                                    <p className="text-starlight-400 text-[10px] uppercase font-bold">Reason Code</p>
                                    <p className="font-semibold text-starlight-200 mt-0.5">
                                        {REASON_LABELS[selectedTx.reason] || selectedTx.reason}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-starlight-400 text-[10px] uppercase font-bold">Resulting Snapshot</p>
                                    <p className="font-bold font-mono text-gold-300 mt-0.5">
                                        {selectedTx.resultingBalanceSnapshot !== null
                                            ? `${selectedTx.resultingBalanceSnapshot} ST`
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 p-3.5 rounded-xl bg-space-950/70 border border-border/70">
                                <div>
                                    <span className="text-starlight-400 text-[10px] uppercase font-bold block">
                                        Timestamp
                                    </span>
                                    <span className="font-mono text-starlight-200">
                                        {formatDateTime(selectedTx.createdAt)}
                                    </span>
                                </div>

                                {selectedTx.actorName && (
                                    <div>
                                        <span className="text-starlight-400 text-[10px] uppercase font-bold block">
                                            Executed By
                                        </span>
                                        <span className="text-starlight-200">
                                            Instructor {selectedTx.actorName} ({selectedTx.actorEmail})
                                        </span>
                                    </div>
                                )}

                                {selectedTx.relatedEntityName && (
                                    <div>
                                        <span className="text-starlight-400 text-[10px] uppercase font-bold block">
                                            Related Entity
                                        </span>
                                        <span className="text-starlight-200">
                                            [{selectedTx.relatedEntityType}] {selectedTx.relatedEntityName}
                                        </span>
                                    </div>
                                )}

                                {selectedTx.note && (
                                    <div>
                                        <span className="text-starlight-400 text-[10px] uppercase font-bold block">
                                            Instructor Note / Reason
                                        </span>
                                        <p className="text-starlight-200 italic mt-0.5 bg-space-900 p-2.5 rounded-lg border border-border/60">
                                            &ldquo;{selectedTx.note}&rdquo;
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
