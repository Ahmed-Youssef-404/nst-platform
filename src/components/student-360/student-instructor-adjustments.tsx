// src/components/student-360/student-instructor-adjustments.tsx
"use client";

import type { Student360InstructorAdjustment } from "@/lib/data/get-student-360";
import { formatDateTime } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import {
    SlidersHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    UserCheck,
    MessageSquare,
    Coins,
    Calendar,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentInstructorAdjustments({
    adjustments,
    studentName,
    onViewAllTransactions,
}: {
    adjustments: Student360InstructorAdjustment[];
    studentName: string;
    onViewAllTransactions?: () => void;
}) {
    if (adjustments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/40 p-10 text-center backdrop-blur-md">
                <div className="flex size-12 items-center justify-center rounded-xl bg-space-850 border border-border/70 text-starlight-400 mb-3">
                    <SlidersHorizontal className="size-6" />
                </div>
                <h3 className="font-display text-base font-bold text-starlight-100">
                    No Manual Instructor Adjustments
                </h3>
                <p className="mt-1 text-xs text-starlight-400 max-w-md">
                    No instructor has manually added or deducted Star Tokens for {studentName} yet.
                    All automatic curriculum rewards and system penalties remain visible in the Complete ST History tab.
                </p>
                {onViewAllTransactions && (
                    <button
                        type="button"
                        onClick={onViewAllTransactions}
                        className="mt-4 text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors"
                    >
                        View Full ST History →
                    </button>
                )}
            </div>
        );
    }

    const totalAdded = adjustments
        .filter((a) => a.direction === "ADD")
        .reduce((sum, a) => sum + a.amount, 0);
    const totalDeducted = adjustments
        .filter((a) => a.direction === "DEDUCT")
        .reduce((sum, a) => sum + a.amount, 0);

    return (
        <div className="space-y-4">
            {/* Summary stat strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-starlight-400">Total Adjustments</span>
                        <p className="text-xl font-bold font-display text-starlight-100">{adjustments.length}</p>
                    </div>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20">
                        <SlidersHorizontal className="size-4" />
                    </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-success-400">Bonuses Awarded</span>
                        <p className="text-xl font-bold font-display text-success-400">+{totalAdded} ST</p>
                    </div>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-success-500/10 text-success-400 border border-success-500/20">
                        <ArrowUpRight className="size-4" />
                    </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-destructive">Penalties Deducted</span>
                        <p className="text-xl font-bold font-display text-destructive">-{totalDeducted} ST</p>
                    </div>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                        <ArrowDownRight className="size-4" />
                    </div>
                </div>
            </div>

            {/* List of adjustment cards */}
            <div className="space-y-2.5">
                {adjustments.map((adj) => {
                    const isAdd = adj.direction === "ADD";

                    return (
                        <div
                            key={adj.id}
                            className="p-4 rounded-xl border border-border/80 bg-space-900/70 hover:border-gold-500/35 transition-all space-y-3"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-1 font-mono font-bold px-3 py-1 rounded-lg text-xs border",
                                            isAdd
                                                ? "bg-success-500/15 text-success-400 border-success-500/30"
                                                : "bg-destructive/15 text-destructive border-destructive/30"
                                        )}
                                    >
                                        {isAdd ? (
                                            <ArrowUpRight className="size-3.5 text-success-400" />
                                        ) : (
                                            <ArrowDownRight className="size-3.5 text-destructive" />
                                        )}
                                        <span>{isAdd ? `+${adj.amount}` : `-${adj.amount}`}</span>
                                        <span className="text-[10px] opacity-80">ST</span>
                                    </span>

                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="inline-flex items-center gap-1.5 font-semibold text-violet-300">
                                            <UserCheck className="size-3.5 text-violet-400" />
                                            <span>Instructor {adj.actorName}</span>
                                        </span>
                                        {adj.actorEmail && (
                                            <span className="text-[11px] text-starlight-400 hidden sm:inline">
                                                ({adj.actorEmail})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-starlight-400">
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                        <Calendar className="size-3 text-starlight-400" />
                                        {formatDateTime(adj.createdAt)}
                                    </span>
                                    {adj.resultingBalance !== null && (
                                        <Badge
                                            variant="outline"
                                            className="font-mono text-[10px] text-gold-300 border-gold-500/30 bg-gold-500/5"
                                        >
                                            Snapshot: {adj.resultingBalance} ST
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Reason / Note */}
                            {adj.note ? (
                                <div className="flex items-start gap-2 bg-space-950/60 p-3 rounded-lg border border-border/60 text-xs text-starlight-200">
                                    <MessageSquare className="size-3.5 text-gold-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <span className="text-starlight-400 text-[10px] uppercase font-bold block mb-0.5">
                                            Instructor Reason
                                        </span>
                                        <p className="italic">&ldquo;{adj.note}&rdquo;</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] text-starlight-400/80 italic">
                                    No custom reason provided with this adjustment.
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
