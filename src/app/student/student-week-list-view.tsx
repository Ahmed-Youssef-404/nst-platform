// src/app/student/student-week-list-view.tsx
// The Beginner Student's main "My Weeks" list.
// Displays the mission track hero and weekly module cards with deliverables & task progress.

import Link from "next/link";
import {
    Calendar,
    CheckCircle2,
    Clock,
    Lock,
    PlayCircle,
    Sparkles,
    Video,
    ListTodo,
    ChevronRight,
    FileText,
    AlertCircle,
    Coins,
    ShieldCheck,
    ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StudentWeeksData, StudentWeekSummary } from "@/lib/data/get-student-weeks";
import type { WeekStatus } from "@/lib/data/get-my-groups";
import type { WeekResourceStatusCode } from "@/types/types";
import { formatDateTime } from "@/lib/format-date";

const STATUS_CONFIG: Record<
    WeekStatus,
    {
        label: string;
        badgeClassName: string;
        cardClassName: string;
        isInteractive: boolean;
    }
> = {
    ongoing: {
        label: "Live Now",
        badgeClassName: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 shadow-xs animate-pulse",
        cardClassName: "border-emerald-500/40 bg-emerald-50/50 shadow-md ring-1 ring-emerald-500/25 dark:border-emerald-500/50 dark:bg-gradient-to-br dark:from-emerald-950/20 dark:via-space-900 dark:to-space-950 dark:ring-emerald-500/30",
        isInteractive: true,
    },
    ended: {
        label: "Completed",
        badgeClassName: "bg-secondary text-secondary-foreground border-border/70 dark:bg-space-800 dark:text-starlight-300 dark:border-border/80",
        cardClassName: "border-border/80 bg-card hover:bg-muted/30 hover:border-gold-500/40 shadow-xs hover:shadow-md dark:border-border/70 dark:bg-space-900/60 dark:hover:bg-space-850/80 dark:hover:border-gold-500/30 dark:hover:shadow-gold",
        isInteractive: true,
    },
    upcoming: {
        label: "Upcoming",
        badgeClassName: "bg-muted text-muted-foreground border-border/60 dark:bg-space-850/60 dark:text-starlight-400 dark:border-border/50",
        cardClassName: "border-border/50 bg-muted/20 opacity-75 dark:border-border/40 dark:bg-space-950/40 dark:opacity-70",
        isInteractive: false,
    },
};

const RESOURCE_STATUS_CONFIG: Record<
    WeekResourceStatusCode,
    { label: string; badgeClassName: string }
> = {
    PENDING: {
        label: "Deliverable Uploaded (Pending Review)",
        badgeClassName: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    },
    ACCEPTED: {
        label: "Deliverable Accepted",
        badgeClassName: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    REJECTED: {
        label: "Deliverable Rejected",
        badgeClassName: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    },
};

export function StudentWeekListView({ data }: { data: StudentWeeksData | null }) {
    if (!data || data.weeks.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border/80 bg-space-900/30 p-12 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400 border border-gold-500/20 mb-4 shadow-gold">
                    <Sparkles className="size-6 animate-pulse" />
                </div>
                <h3 className="font-display text-lg font-bold text-starlight-100">
                    No Training Weeks Announced Yet
                </h3>
                <p className="mt-2 text-sm text-starlight-400 max-w-md mx-auto">
                    Your cohort is registered in the Beginner track. Once your instructor launches your first training week, curriculum and tasks will appear here.
                </p>
                {data && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-starlight-400 font-mono">
                        <span>{data.groupName}</span>
                        <span>·</span>
                        <span>{data.batchName}</span>
                    </div>
                )}
            </div>
        );
    }

    const { weeks, groupName, batchName, beginnerSt } = data;
    const totalWeeks = weeks.length;
    const ongoingWeek = weeks.find((w) => w.status === "ongoing");
    const completedWeeks = weeks.filter((w) => w.status === "ended").length;
    const allTasksCount = weeks.reduce((sum, w) => sum + w.totalTasks, 0);
    const lockedWeeksCount = weeks.filter((w) => w.isLocked).length;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Active Track Hero Mission Deck */}
            <div className="relative overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-br from-space-850 via-space-900 to-space-950 p-6 md:p-8 shadow-gold">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold text-gold-300 border border-gold-500/30">
                                <Sparkles className="size-3 text-gold-400" />
                                Beginner Mission Track
                            </span>
                            <span className="rounded-full bg-space-800 px-3 py-1 text-xs font-mono text-starlight-300 border border-border/70">
                                {groupName} · {batchName}
                            </span>
                        </div>

                        <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-starlight-100">
                            Training Modules & Weekly Missions
                        </h2>
                        <p className="text-sm text-starlight-300 max-w-xl">
                            Each week includes lecture playlists, hands-on tasks with custom rubrics, a mandatory deliverable, and ST rewards.
                        </p>
                    </div>

                    {/* Stats Widget */}
                    <div className="flex flex-wrap md:flex-nowrap gap-3 shrink-0">
                        <div className="rounded-xl border border-gold-500/20 bg-space-900/80 px-4 py-3 text-center min-w-[90px]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 block mb-0.5">
                                Balance
                            </span>
                            <span className="font-mono text-xl font-black text-gold-300">
                                {beginnerSt}
                            </span>
                            <span className="text-[10px] text-starlight-400 font-semibold block">
                                ST
                            </span>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-space-900/60 px-4 py-3 text-center min-w-[90px]">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-starlight-400 block mb-0.5">
                                Modules
                            </span>
                            <span className="font-mono text-xl font-bold text-starlight-100">
                                {completedWeeks}/{totalWeeks}
                            </span>
                            <span className="text-[10px] text-starlight-400 block">
                                Completed
                            </span>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-space-900/60 px-4 py-3 text-center min-w-[90px]">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-starlight-400 block mb-0.5">
                                Locked
                            </span>
                            <span className="font-mono text-xl font-bold text-emerald-400">
                                {lockedWeeksCount}
                            </span>
                            <span className="text-[10px] text-starlight-400 block">
                                Submissions
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weeks Cards Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-gold-400" />
                        <h3 className="font-display text-base font-bold text-starlight-100">
                            Course Weeks Schedule
                        </h3>
                    </div>
                    <span className="text-xs text-starlight-400 font-mono">
                        {weeks.length} {weeks.length === 1 ? "Week" : "Weeks"} Total
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weeks.map((week) => (
                        <WeekCard key={week.id} week={week} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function WeekCard({ week }: { week: StudentWeekSummary }) {
    const config = STATUS_CONFIG[week.status];
    const isUpcoming = week.status === "upcoming";

    const cardInner = (
        <div
            className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 ${config.cardClassName}`}
        >
            <div className="space-y-3.5">
                {/* Top Row: Status badge & Lock / Deliverable indicator */}
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${config.badgeClassName}`}
                    >
                        {week.status === "ongoing" && (
                            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                        )}
                        {config.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                        {week.isLocked ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-gold-500/15 px-2 py-0.5 text-[11px] font-semibold text-gold-300 border border-gold-500/30">
                                <Lock className="size-3 text-gold-400" />
                                Locked & Finalized
                            </span>
                        ) : week.status === "ongoing" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-space-850 px-2 py-0.5 text-[11px] font-medium text-starlight-300 border border-border/60">
                                In Progress
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* Week Name */}
                <div>
                    <h4 className="font-display text-lg font-bold text-foreground dark:text-starlight-100 group-hover:text-gold-600 dark:group-hover:text-gold-300 transition-colors line-clamp-1">
                        {week.name}
                    </h4>
                    <p className="text-xs text-muted-foreground dark:text-starlight-400 font-mono mt-1 flex items-center gap-1.5">
                        <Clock className="size-3.5 text-muted-foreground dark:text-starlight-400 shrink-0" />
                        <span>
                            {formatDateTime(week.startDate)} → {formatDateTime(week.endDate)}
                        </span>
                    </p>
                </div>

                {/* Deliverable & Playlist Highlights */}
                <div className="space-y-2 border-t border-border/70 dark:border-border/50 pt-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-foreground/80 dark:text-starlight-400 flex items-center gap-1.5 truncate">
                            <FileText className="size-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                            <span className="truncate">{week.requiredFileLabel}</span>
                        </span>

                        {week.resource ? (
                            <span
                                className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                    RESOURCE_STATUS_CONFIG[week.resource.status]?.badgeClassName ??
                                    "bg-secondary text-secondary-foreground border-border"
                                }`}
                            >
                                {RESOURCE_STATUS_CONFIG[week.resource.status]?.label ?? "Uploaded"}
                            </span>
                        ) : (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 border border-amber-500/25">
                                <AlertCircle className="size-2.5" />
                                File Required
                            </span>
                        )}
                    </div>

                    {week.playlistUrl && (
                        <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-foreground/80 dark:text-starlight-400 flex items-center gap-1.5">
                                <Video className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Lecture Playlist</span>
                            </span>
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                Ready to Watch
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Task count and action arrow */}
            <div className="flex items-center justify-between border-t border-border/70 dark:border-border/50 pt-3 mt-4 text-xs">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-foreground/80 dark:text-starlight-300">
                        <ListTodo className="size-3.5 text-gold-600 dark:text-gold-400" />
                        {week.totalTasks} {week.totalTasks === 1 ? "Task" : "Tasks"}
                    </span>

                    {week.draftTasksCount > 0 && !week.isLocked && (
                        <span className="rounded-full bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-space-800 dark:text-cyan-300 dark:border-cyan-500/30 px-2 py-0.2 text-[10px] font-mono border">
                            {week.draftTasksCount} draft{week.draftTasksCount > 1 ? "s" : ""}
                        </span>
                    )}

                    {week.submittedTasksCount > 0 && (
                        <span className="rounded-full bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-space-800 dark:text-emerald-300 dark:border-emerald-500/30 px-2 py-0.2 text-[10px] font-mono border">
                            {week.submittedTasksCount} submitted
                        </span>
                    )}
                </div>

                {!isUpcoming ? (
                    <div className="inline-flex items-center gap-1 text-gold-600 dark:text-gold-400 font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                        <span>Open Week</span>
                        <ChevronRight className="size-3.5" />
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground dark:text-starlight-400/80 italic font-mono">
                        Locked until start
                    </span>
                )}
            </div>
        </div>
    );

    if (isUpcoming) {
        return (
            <div aria-disabled="true" className="cursor-not-allowed">
                {cardInner}
            </div>
        );
    }

    return (
        <Link href={`/student/weeks/${week.id}`} className="block focus:outline-hidden">
            {cardInner}
        </Link>
    );
}
