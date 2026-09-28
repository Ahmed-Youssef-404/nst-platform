// src/app/student/sessions/[id]/session-detail-view.tsx
import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck,
    ListTodo,
    Sparkles,
    Video,
    ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskPager } from "@/components/student/task-pager";
import { computeTaskProgress } from "@/lib/task-progress";
import type { StudentSessionView } from "@/lib/data/get-student-level";
import type { SessionStatus } from "@/lib/data/get-my-groups";
import { formatDateTime } from "@/lib/format-date";

const STATUS_STYLES: Record<
    SessionStatus,
    { label: string; badgeClassName: string }
> = {
    upcoming: {
        label: "Upcoming",
        badgeClassName: "bg-space-850 text-starlight-400 border-border/70",
    },
    ongoing: {
        label: "Live Now",
        badgeClassName: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse",
    },
    completed: {
        label: "Completed",
        badgeClassName: "bg-space-800 text-starlight-200 border-border/80",
    },
};

export function SessionDetailView({
    studentId,
    session,
    isHistorical = false,
}: {
    studentId: string;
    session: StudentSessionView;
    isHistorical?: boolean;
}) {
    const statusStyle = STATUS_STYLES[session.status];
    const progress = computeTaskProgress(session.tasks);
    const progressPercent =
        progress.total > 0 ? Math.round((progress.submitted / progress.total) * 100) : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back Navigation Breadcrumb */}
            <div>
                <Link
                    href={isHistorical ? "/student/levels" : "/student"}
                    className="inline-flex items-center gap-2 rounded-xl bg-space-900/80 px-3.5 py-1.5 text-xs font-medium text-starlight-300 border border-border/60 hover:text-gold-300 hover:border-gold-500/30 hover:bg-space-850 transition-all"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>{isHistorical ? "Back to Level History" : "Back to My Sessions"}</span>
                </Link>
            </div>

            {/* Session Header Card */}
            <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-space-850 via-space-900 to-space-950 p-6 md:p-8 space-y-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusStyle.badgeClassName}`}
                            >
                                {session.status === "ongoing" && (
                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                                )}
                                {statusStyle.label}
                            </span>

                            {isHistorical && (
                                <span className="rounded-full bg-space-800 px-2.5 py-0.5 text-xs font-medium text-starlight-400 border border-border/60">
                                    Past Level Archive
                                </span>
                            )}
                        </div>

                        <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-starlight-100">
                            {session.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-starlight-300">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-starlight-400" />
                                <span>{formatDateTime(session.startTime)}</span>
                            </div>

                            {session.durationMinutes > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="size-3.5 text-starlight-400" />
                                    <span>{session.durationMinutes} mins</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {session.recordingLink && (
                        <a
                            href={session.recordingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 px-4 py-2.5 text-xs font-bold text-gold-300 border border-gold-500/35 shadow-gold transition-all duration-200 shrink-0"
                        >
                            <Video className="size-4 text-gold-400" />
                            <span>Watch Session Recording</span>
                            <ExternalLink className="size-3 opacity-70" />
                        </a>
                    )}
                </div>

                {/* Progress Summary Strip */}
                <div className="border-t border-border/60 pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-border/60 bg-space-950/60 p-3">
                            <span className="text-[11px] font-medium text-starlight-400 uppercase tracking-wider block">
                                Total Missions
                            </span>
                            <span className="font-mono text-lg font-bold text-starlight-100">
                                {progress.total}
                            </span>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-space-950/60 p-3">
                            <span className="text-[11px] font-medium text-starlight-400 uppercase tracking-wider block">
                                Submitted
                            </span>
                            <span className="font-mono text-lg font-bold text-gold-400">
                                {progress.submitted}
                            </span>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-space-950/60 p-3">
                            <span className="text-[11px] font-medium text-starlight-400 uppercase tracking-wider block">
                                Graded
                            </span>
                            <span className="font-mono text-lg font-bold text-emerald-400">
                                {progress.graded}
                            </span>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-space-950/60 p-3">
                            <span className="text-[11px] font-medium text-starlight-400 uppercase tracking-wider block">
                                Pending Submission
                            </span>
                            <span className="font-mono text-lg font-bold text-starlight-300">
                                {progress.notSubmitted}
                            </span>
                        </div>
                    </div>

                    {/* Completion progress bar */}
                    {progress.total > 0 && (
                        <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-xs text-starlight-400">
                                <span>Task Completion Rate</span>
                                <span className="font-mono text-gold-400">{progressPercent}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-space-950 border border-border/60">
                                <div
                                    className="h-full bg-gradient-to-r from-gold-500 to-amber-300 transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Task Pager */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-starlight-100 flex items-center gap-2">
                        <ListTodo className="size-4 text-gold-400" />
                        Session Tasks & Missions
                    </h2>
                    <span className="text-xs text-starlight-400">
                        Solve tasks, unlock hints, and submit solutions
                    </span>
                </div>

                <TaskPager
                    studentId={studentId}
                    tasks={session.tasks}
                    isHistorical={isHistorical}
                />
            </div>
        </div>
    );
}