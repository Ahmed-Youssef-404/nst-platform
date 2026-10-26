// src/components/student-360/student-360-header.tsx
"use client";

import { StudentAvatar } from "@/components/avatar/student-avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import type { Student360Overview } from "@/lib/data/get-student-360";
import {
    Coins,
    Trophy,
    Calendar,
    Layers,
    Compass,
    Mail,
    Hash,
    Sparkles,
    ShieldAlert,
    CheckCircle2,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Student360Header({
    overview,
    role = "super_admin",
}: {
    overview: Student360Overview;
    role?: "super_admin" | "instructor";
}) {
    const isBeginner = overview.group.type === "BEGINNER";
    const balanceZone = overview.balance.balanceStatus.zone;

    const zoneBadge = {
        normal: {
            label: "Optimal Balance",
            class: "bg-success-500/15 text-success-400 border-success-500/30",
        },
        warning: {
            label: "Warning Threshold",
            class: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        },
        danger: {
            label: "Negative Balance Danger",
            class: "bg-destructive/15 text-destructive border-destructive/30 animate-pulse",
        },
    }[balanceZone];

    return (
        <div className="rounded-2xl border border-border/80 bg-space-900/80 p-6 backdrop-blur-md shadow-3 space-y-6">
            {/* Top row: Avatar & Identity */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <StudentAvatar
                        avatarConfig={overview.avatarConfig}
                        name={overview.name}
                        size="xl"
                        className="size-20 shrink-0 border-2 border-gold-500/40 shadow-gold ring-2 ring-gold-500/20"
                    />

                    <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-starlight-100">
                                {overview.name}
                            </h1>
                            <Badge
                                className={cn(
                                    "font-semibold text-xs px-3 py-1 rounded-full",
                                    isBeginner
                                        ? "bg-violet-500/15 text-violet-300 border-violet-500/35"
                                        : "bg-gold-500/15 text-gold-300 border-gold-500/35 shadow-gold"
                                )}
                            >
                                {isBeginner ? "✦ Beginner Track" : "◆ Intermediate Track"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-starlight-300 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 font-mono text-starlight-300 bg-space-850 px-2.5 py-1 rounded-lg border border-border/60">
                                <Hash className="size-3.5 text-gold-400" />
                                <span>{overview.id}</span>
                            </span>

                            <span className="inline-flex items-center gap-1.5 text-starlight-300">
                                <Mail className="size-3.5 text-starlight-400" />
                                <span>{overview.email}</span>
                            </span>

                            <span className="inline-flex items-center gap-1.5 text-starlight-400">
                                <Calendar className="size-3.5 text-starlight-400" />
                                <span>Enrolled {formatDate(overview.createdAt)}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 text-xs">
                            <span className="text-starlight-400">Cohort (Batch):</span>
                            <span className="font-semibold text-starlight-200">
                                {overview.group.batchName}
                            </span>
                            <span className="text-starlight-400">·</span>
                            <span className="text-starlight-400">Group:</span>
                            <span className="font-semibold text-starlight-200">
                                {overview.group.name}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Top right badges: Current Academic Context & Rank */}
                <div className="flex flex-row md:flex-col items-end gap-2.5 shrink-0 self-start">
                    <div className="flex items-center gap-2 rounded-xl bg-space-850 border border-border/70 px-3.5 py-2">
                        {isBeginner ? (
                            <Compass className="size-4 text-violet-400 shrink-0" />
                        ) : (
                            <Layers className="size-4 text-gold-400 shrink-0" />
                        )}
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold tracking-wider text-starlight-400">
                                {isBeginner ? "Current Week" : "Active Level"}
                            </p>
                            <p className="text-xs font-semibold text-starlight-100">
                                {isBeginner
                                    ? overview.academicContext.currentWeekName || "Active Period"
                                    : overview.academicContext.currentLevelName
                                        ? `Level ${overview.academicContext.currentLevelNumber}: ${overview.academicContext.currentLevelName}`
                                        : "No Active Level"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-gold-500/10 border border-gold-500/25 px-3.5 py-2 text-right">
                        <Trophy className="size-4 text-gold-400 shrink-0" />
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-gold-400/90">
                                Group Leaderboard
                            </p>
                            <p className="text-xs font-bold text-gold-300">
                                Rank #{overview.ranking.currentRank} of {overview.ranking.totalPeers}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom row: Authoritative Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 border-t border-border/70">
                {/* 1. Authoritative ST Balance */}
                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-starlight-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Coins className="size-3.5 text-gold-400" />
                            {isBeginner ? "Beginner ST" : "Active Level ST"}
                        </span>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", zoneBadge.class)}>
                            {balanceZone}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-display text-2xl font-bold text-gold-300">
                            {overview.balance.authoritativeBalance}
                        </span>
                        <span className="text-xs text-starlight-400 font-semibold">ST</span>
                    </div>
                    <p className="text-[10px] text-starlight-400 truncate">
                        {isBeginner
                            ? "Cumulative course balance"
                            : `Overall Avg ST: ${overview.balance.avgSt}`}
                    </p>
                </div>

                {/* 2. Secondary Balance Context */}
                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1.5">
                    <span className="text-[11px] font-semibold text-starlight-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-blue-400" />
                        {isBeginner ? "Ranking Metric" : "Avg ST Balance"}
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="font-display text-2xl font-bold text-starlight-100">
                            {isBeginner ? overview.ranking.metricScore : overview.balance.avgSt}
                        </span>
                        <span className="text-xs text-starlight-400 font-semibold">ST</span>
                    </div>
                    <p className="text-[10px] text-starlight-400 truncate">
                        {isBeginner ? "Group competitive score" : "Average across all levels"}
                    </p>
                </div>

                {/* 3. Task Progress */}
                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-starlight-400 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-success-400" />
                            Task Progress
                        </span>
                        <span className="text-xs font-bold text-success-400">
                            {overview.progressSummary.completionPercentage}%
                        </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-space-800 overflow-hidden mt-1">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                overview.progressSummary.completionPercentage >= 75
                                    ? "bg-success-400"
                                    : overview.progressSummary.completionPercentage >= 40
                                        ? "bg-gold-400"
                                        : "bg-amber-500"
                            )}
                            style={{
                                width: `${Math.min(100, overview.progressSummary.completionPercentage)}%`,
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-starlight-400">
                        {overview.progressSummary.totalTasksSubmitted} of{" "}
                        {overview.progressSummary.totalTasksAvailable} submitted (
                        {overview.progressSummary.totalTasksGraded} graded)
                    </p>
                </div>

                {/* 4. Attendance Summary */}
                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-starlight-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="size-3.5 text-violet-400" />
                            Attendance
                        </span>
                        {overview.attendanceSummary.supported && (
                            <span className="text-xs font-bold text-starlight-100">
                                {overview.attendanceSummary.attendancePercentage}%
                            </span>
                        )}
                    </div>
                    {overview.attendanceSummary.supported ? (
                        <>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-2xl font-bold text-starlight-100">
                                    {overview.attendanceSummary.attendedSessions}
                                </span>
                                <span className="text-xs text-starlight-400">
                                    / {overview.attendanceSummary.totalRecordedSessions} sessions
                                </span>
                            </div>
                            <p className="text-[10px] text-starlight-400 truncate">
                                {overview.attendanceSummary.missedSessions} missed
                                {overview.attendanceSummary.avgFeedbackRating !== null
                                    ? ` · Avg feedback: ${overview.attendanceSummary.avgFeedbackRating}/10`
                                    : ""}
                            </p>
                        </>
                    ) : (
                        <div className="py-1">
                            <p className="text-xs font-medium text-starlight-300">Self-paced Missions</p>
                            <p className="text-[10px] text-starlight-400">
                                Attendance not tracked in Beginner track
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
