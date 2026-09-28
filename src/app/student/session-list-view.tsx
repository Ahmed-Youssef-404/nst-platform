// src/app/student/session-list-view.tsx
// The Student's main "My Sessions" list.
// Displays the active level mission control hero and sessions cards.

import Link from "next/link";
import {
    Calendar,
    CheckCircle2,
    Clock,
    Lock,
    PlayCircle,
    Sparkles,
    Video,
    Layers,
    ListTodo,
    ChevronRight,
    ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StudentLevelView, StudentSessionView } from "@/lib/data/get-student-level";
import type { SessionStatus } from "@/lib/data/get-my-groups";
import { formatDateTime } from "@/lib/format-date";

const STATUS_CONFIG: Record<
    SessionStatus,
    {
        label: string;
        badgeClassName: string;
        cardClassName: string;
        isInteractive: boolean;
    }
> = {
    ongoing: {
        label: "Live Now",
        badgeClassName: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs animate-pulse",
        cardClassName: "border-emerald-500/50 bg-gradient-to-br from-emerald-950/20 via-space-900 to-space-950 shadow-md ring-1 ring-emerald-500/30",
        isInteractive: true,
    },
    completed: {
        label: "Completed",
        badgeClassName: "bg-space-800 text-starlight-300 border-border/80",
        cardClassName: "border-border/70 bg-space-900/60 hover:bg-space-850/80 hover:border-gold-500/30 hover:shadow-gold",
        isInteractive: true,
    },
    upcoming: {
        label: "Upcoming",
        badgeClassName: "bg-space-850/60 text-starlight-400 border-border/50",
        cardClassName: "border-border/40 bg-space-950/40 opacity-70",
        isInteractive: false,
    },
};

export function SessionListView({ level }: { level: StudentLevelView | null }) {
    if (!level) {
        return (
            <div className="rounded-2xl border border-dashed border-border/80 bg-space-900/30 p-12 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400 border border-gold-500/20 mb-4 shadow-gold">
                    <Sparkles className="size-6 animate-pulse" />
                </div>
                <h3 className="font-display text-lg font-bold text-starlight-100">
                    No Active Level Assigned
                </h3>
                <p className="mt-2 text-sm text-starlight-400 max-w-md mx-auto">
                    You aren&apos;t enrolled in an active Level right now. Once your instructor launches your cohort&apos;s level, it will appear here.
                </p>
                <div className="mt-6">
                    <Link
                        href="/student/levels"
                        className="inline-flex items-center gap-2 rounded-xl bg-space-800 px-4 py-2 text-xs font-semibold text-starlight-200 border border-border hover:bg-space-750 transition-colors"
                    >
                        <Layers className="size-3.5" />
                        Check Level History
                    </Link>
                </div>
            </div>
        );
    }

    const allTasks = level.sessions.flatMap((s) => s.tasks);
    const totalSessions = level.sessions.length;
    const completedSessions = level.sessions.filter((s) => s.status === "completed").length;
    const ongoingSessions = level.sessions.filter((s) => s.status === "ongoing").length;
    const submittedTasksCount = allTasks.filter((t) => t.submission !== null).length;
    const gradedTasksCount = allTasks.filter((t) => t.submission?.isGraded).length;
    const completionPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Active Level Hero Mission Deck */}
            <div className="relative overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-br from-space-850 via-space-900 to-space-950 p-6 md:p-8 shadow-gold">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold text-gold-300 border border-gold-500/30">
                                <Sparkles className="size-3 text-gold-400" />
                                Current Mission Track
                            </span>
                            <span className="rounded-full bg-space-800 px-3 py-1 text-xs font-mono text-starlight-300 border border-border/70">
                                {level.groupName}
                            </span>
                        </div>

                        <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-starlight-100">
                            Level {level.levelNumber} {level.name ? `— ${level.name}` : ""}
                        </h1>

                        <p className="text-sm text-starlight-300 max-w-2xl">
                            Stay on top of your live sessions, tackle internal assignments before deadlines, and unlock strategic hints using Star Tokens.
                        </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
                        <div className="rounded-xl border border-border/70 bg-space-950/70 p-3 text-center min-w-[100px]">
                            <p className="text-[11px] font-medium text-starlight-400 uppercase tracking-wider">
                                Sessions
                            </p>
                            <p className="mt-1 font-mono text-xl font-bold text-starlight-100">
                                {completedSessions}/{totalSessions}
                            </p>
                            <p className="text-[10px] text-starlight-400">completed</p>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-space-950/70 p-3 text-center min-w-[100px]">
                            <p className="text-[11px] font-medium text-starlight-400 uppercase tracking-wider">
                                Tasks
                            </p>
                            <p className="mt-1 font-mono text-xl font-bold text-gold-400">
                                {submittedTasksCount}/{allTasks.length}
                            </p>
                            <p className="text-[10px] text-starlight-400">{gradedTasksCount} graded</p>
                        </div>

                        <div className="col-span-2 sm:col-span-1 rounded-xl border border-gold-500/20 bg-gold-500/5 p-3 text-center min-w-[100px]">
                            <p className="text-[11px] font-medium text-gold-400 uppercase tracking-wider">
                                Progress
                            </p>
                            <p className="mt-1 font-mono text-xl font-bold text-gold-300">
                                {completionPercent}%
                            </p>
                            <p className="text-[10px] text-gold-400/80">level orbit</p>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6 pt-4 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs text-starlight-400 mb-2">
                        <span>Curriculum Completion</span>
                        <span className="font-mono text-gold-400">{completionPercent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-space-950 border border-border/60">
                        <div
                            className="h-full bg-gradient-to-r from-gold-500 via-amber-400 to-gold-300 transition-all duration-500 shadow-gold"
                            style={{ width: `${Math.max(completionPercent, 4)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Sessions Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-display text-lg font-bold text-starlight-100 flex items-center gap-2">
                            <Layers className="size-4 text-gold-400" />
                            Curriculum Sessions
                        </h2>
                        <p className="text-xs text-starlight-400">
                            Access live sessions, session recordings, and assigned missions.
                        </p>
                    </div>

                    <span className="text-xs font-mono text-starlight-400">
                        {totalSessions} {totalSessions === 1 ? "Session" : "Sessions"}
                    </span>
                </div>

                {level.sessions.length === 0 ? (
                    <div className="rounded-xl border border-border/70 bg-space-900/40 p-8 text-center">
                        <p className="text-sm text-starlight-400">
                            No Sessions have been scheduled for this Level yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {level.sessions.map((session, index) => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                sessionIndex={index + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function SessionCard({
    session,
    sessionIndex,
}: {
    session: StudentSessionView;
    sessionIndex: number;
}) {
    const config = STATUS_CONFIG[session.status];
    const isOngoing = session.status === "ongoing";
    const isUpcoming = session.status === "upcoming";
    const taskCount = session.tasks.length;
    const submittedCount = session.tasks.filter((t) => t.submission !== null).length;
    const allSubmitted = taskCount > 0 && submittedCount === taskCount;

    const cardContent = (
        <div
            className={`
                group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 h-full
                ${config.cardClassName}
            `}
        >
            {/* Header: Session index & Status */}
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-gold-400">
                        Session {sessionIndex.toString().padStart(2, "0")}
                    </span>

                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${config.badgeClassName}`}
                    >
                        {isOngoing && <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />}
                        {config.label}
                    </span>
                </div>

                {/* Title */}
                <div>
                    <h3 className="font-display text-base font-bold text-starlight-100 group-hover:text-gold-300 transition-colors line-clamp-2">
                        {session.title}
                    </h3>
                </div>
            </div>

            {/* Middle: Details & Recording */}
            <div className="my-4 space-y-2.5 border-t border-border/50 pt-3">
                <div className="flex items-center gap-2 text-xs text-starlight-300">
                    <Calendar className="size-3.5 shrink-0 text-starlight-400" />
                    <span>{formatDateTime(session.startTime)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-starlight-300">
                        <ListTodo className="size-3.5 shrink-0 text-starlight-400" />
                        <span>
                            {taskCount} {taskCount === 1 ? "task" : "tasks"}
                        </span>
                        {taskCount > 0 && (
                            <span className="text-[11px] font-mono text-starlight-400">
                                ({submittedCount} submitted)
                            </span>
                        )}
                    </div>

                    {session.recordingLink && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-md border border-gold-500/20">
                            <Video className="size-3" />
                            Recording
                        </span>
                    )}
                </div>
            </div>

            {/* Bottom action bar */}
            <div className="mt-auto pt-2 flex items-center justify-between border-t border-border/40 text-xs">
                {isUpcoming ? (
                    <div className="flex items-center gap-1.5 text-starlight-400/90 font-medium">
                        <Lock className="size-3.5 text-starlight-400" />
                        <span>Locked until session start</span>
                    </div>
                ) : (
                    <>
                        <span className="text-starlight-400 group-hover:text-starlight-200 transition-colors">
                            {allSubmitted ? "All tasks submitted" : "View session & tasks"}
                        </span>
                        <div className="flex items-center gap-1 font-semibold text-gold-400 group-hover:translate-x-0.5 transition-transform">
                            <span>Open</span>
                            <ChevronRight className="size-3.5" />
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    if (isUpcoming) {
        return (
            <div aria-disabled="true" className="cursor-not-allowed">
                {cardContent}
            </div>
        );
    }

    return (
        <Link href={`/student/sessions/${session.id}`} className="block h-full focus:outline-hidden">
            {cardContent}
        </Link>
    );
}