// src/app/instructor/sessions/[id]/session-detail-view.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { MarkdownContent } from "@/components/markdown-content";
import { formatDateTime } from "@/lib/format-date";
import {
    Star,
    Search,
    Calendar,
    Clock,
    Video,
    ChevronLeft,
    Sparkles,
    CheckCircle2,
    XCircle,
    AlertCircle,
    FileText,
    ExternalLink,
    Download,
    Layers,
    Trophy,
    UserCheck,
    Edit3,
    ChevronDown,
    ChevronUp,
    MessageSquareQuote,
    Award,
    Loader2,
} from "lucide-react";
import { updateSessionAction } from "@/lib/actions/session-management";
import { SessionStatus } from "@/lib/data/get-my-groups";
import type {
    SessionDetail,
    SessionDetailTask,
    SessionDetailSubmission,
    SessionDetailRosterEntry,
} from "@/lib/data/get-session-detail";
import {
    gradeSubmissionAction,
    recordAttendanceAction,
    recordSessionEngagementAction,
} from "@/lib/actions/st-economy";
import { getSubmissionFileUrlAction } from "@/lib/actions/submission-management";
import type {
    SessionFeedbackDetail,
    SessionFeedbackStats,
} from "@/types/types";

const STATUS_CONFIG: Record<
    SessionStatus,
    { label: string; badgeClass: string; desc: string }
> = {
    upcoming: {
        label: "Upcoming",
        badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        desc: "Session has not started yet.",
    },
    ongoing: {
        label: "Live / In Progress",
        badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 animate-pulse",
        desc: "Session is actively underway.",
    },
    completed: {
        label: "Completed",
        badgeClass: "bg-space-850 text-starlight-300 border-border/70",
        desc: "Session finished. Ready for attendance & evaluation.",
    },
};

function toDatetimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}`;
}

export function SessionDetailView({
    session,
    instructorId,
}: {
    session: SessionDetail;
    instructorId: string;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const statusCfg = STATUS_CONFIG[session.status];

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
            {/* Header & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/60 pb-5">
                <div>
                    <Link
                        href="/instructor"
                        className="inline-flex items-center gap-1.5 text-xs text-starlight-400 hover:text-gold-300 transition-colors mb-2"
                    >
                        <ChevronLeft className="size-3.5" />
                        Back to Instructor Dashboard
                    </Link>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="font-display text-2xl font-bold tracking-tight text-starlight-100">
                            {session.title}
                        </h1>
                        <span
                            className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.badgeClass}`}
                        >
                            {statusCfg.label}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-starlight-300 font-mono">
                        {session.levelName} · {session.groupName} (Intermediate Track)
                    </p>
                </div>

                {session.status === "upcoming" && !isEditing && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="border-border/80 bg-space-850 hover:bg-space-750 text-starlight-200 rounded-xl text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5"
                    >
                        <Edit3 className="size-3.5 text-gold-400" />
                        Edit Details
                    </Button>
                )}
            </div>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border/70 bg-space-900/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-starlight-400 flex items-center gap-1">
                        <Calendar className="size-3 text-gold-400" />
                        Schedule
                    </span>
                    <p className="font-mono text-xs font-semibold text-starlight-100 truncate">
                        {formatDateTime(session.startTime)}
                    </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-space-900/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-starlight-400 flex items-center gap-1">
                        <Clock className="size-3 text-gold-400" />
                        Duration
                    </span>
                    <p className="font-mono text-xs font-semibold text-starlight-100">
                        {session.durationMinutes} Minutes
                    </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-space-900/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-starlight-400 flex items-center gap-1">
                        <Layers className="size-3 text-gold-400" />
                        Tasks
                    </span>
                    <p className="font-mono text-xs font-semibold text-starlight-100">
                        {session.tasks.length} Mission{session.tasks.length !== 1 ? "s" : ""}
                    </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-space-900/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-starlight-400 flex items-center gap-1">
                        <Star className="size-3 text-gold-400" />
                        Avg Rating
                    </span>
                    <p className="font-mono text-xs font-semibold text-gold-300">
                        {session.feedbackStats.averageRating !== null
                            ? `${session.feedbackStats.averageRating} / 10`
                            : "No reviews yet"}
                    </p>
                </div>
            </div>

            {/* Session Details / Edit Form Card */}
            <Card className="rounded-2xl border border-border/80 bg-space-900/80 shadow-2 backdrop-blur-md overflow-hidden">
                <CardHeader className="p-5 border-b border-border/70 bg-space-950/40 flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-gold-400" />
                        <CardTitle className="text-sm font-bold font-display text-starlight-100">
                            Session Specifications
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    {isEditing ? (
                        <EditSessionForm
                            session={session}
                            onDone={() => setIsEditing(false)}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div className="space-y-1">
                                <span className="text-starlight-400 font-medium">Session Start:</span>
                                <p className="font-mono text-starlight-200">
                                    {formatDateTime(session.startTime)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-starlight-400 font-medium">Planned Duration:</span>
                                <p className="font-mono text-starlight-200">
                                    {session.durationMinutes} Minutes
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-starlight-400 font-medium">Session Recording:</span>
                                {session.recordingLink ? (
                                    <a
                                        href={session.recordingLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-gold-400 hover:text-gold-300 underline underline-offset-4 flex items-center gap-1 truncate"
                                    >
                                        <Video className="size-3 shrink-0" />
                                        <span>Watch Recording</span>
                                        <ExternalLink className="size-3 shrink-0 ml-0.5" />
                                    </a>
                                ) : (
                                    <p className="text-starlight-500 italic">No recording linked</p>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attendance & Engagement Roster */}
            {(session.status === "completed" || session.status === "ongoing") && (
                <AttendanceRoster
                    sessionId={session.id}
                    roster={session.roster}
                    instructorId={instructorId}
                />
            )}

            {/* Student Ratings & Feedback Section */}
            <SessionFeedbackSection
                feedbacks={session.feedbacks}
                stats={session.feedbackStats}
            />

            {/* Tasks & Submissions Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-display text-base font-bold text-starlight-100 flex items-center gap-2">
                            <Layers className="size-4 text-gold-400" />
                            Session Tasks &amp; Evaluation
                            {session.tasks.length > 0 && (
                                <span className="font-mono text-xs text-starlight-400">
                                    ({session.tasks.length})
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-starlight-400 mt-0.5">
                            Grade student solutions against the 15-point criteria rubric and leave constructive feedback.
                        </p>
                    </div>
                </div>

                {session.tasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/80 bg-space-900/40 p-8 text-center space-y-2">
                        <Layers className="size-8 mx-auto text-starlight-500 opacity-60" />
                        <p className="text-sm font-semibold text-starlight-200">
                            No Tasks Configured
                        </p>
                        <p className="text-xs text-starlight-400 max-w-sm mx-auto">
                            No tasks or missions were assigned to this session.
                        </p>
                    </div>
                ) : (
                    session.tasks.map((task, index) => (
                        <Card
                            key={task.id}
                            className="rounded-2xl border border-border/80 bg-space-900/80 shadow-2 backdrop-blur-md overflow-hidden"
                        >
                            <CardHeader className="p-5 border-b border-border/70 bg-space-950/40 flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-6 items-center justify-center rounded-lg bg-gold-500/15 text-gold-400 font-mono text-xs font-bold border border-gold-500/25">
                                        {index + 1}
                                    </span>
                                    <CardTitle className="text-sm font-bold font-display text-starlight-100">
                                        {task.title}
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    {task.isBonus && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30">
                                            <Sparkles className="size-3 text-amber-400" />
                                            Bonus Task
                                        </span>
                                    )}
                                    <span className="rounded-md bg-space-850 px-2 py-0.5 font-mono text-[11px] font-semibold text-starlight-300 border border-border/70">
                                        {task.type}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="p-5 space-y-4 text-xs">
                                {/* Mission Description */}
                                <div className="rounded-xl border border-border/50 bg-space-950/40 p-4 space-y-2">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-starlight-400 flex items-center gap-1.5">
                                        <FileText className="size-3 text-gold-400" />
                                        Mission Briefing
                                    </div>
                                    <div className="prose prose-invert max-w-none text-xs text-starlight-200">
                                        <MarkdownContent content={task.description} />
                                    </div>
                                </div>

                                {/* Task Metadata & Rubric Criteria Preview */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-starlight-300">
                                    <div className="space-y-1 rounded-lg bg-space-950/40 p-2.5 border border-border/50">
                                        <span className="text-[11px] text-starlight-400 block font-medium">
                                            Deadline:
                                        </span>
                                        <span className="font-mono text-starlight-200">
                                            {formatDateTime(task.deadline)}
                                        </span>
                                    </div>

                                    {task.type === "INTERNAL" && (
                                        <div className="space-y-1 rounded-lg bg-space-950/40 p-2.5 border border-border/50">
                                            <span className="text-[11px] text-starlight-400 block font-medium">
                                                Accepted Format:
                                            </span>
                                            <span className="font-mono text-gold-400 font-semibold">
                                                {task.allowedSubmissionMode ?? "Student chooses freely"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Rubric Criteria Breakdown */}
                                {task.rubricFields.length > 0 && (
                                    <div className="space-y-2 rounded-xl border border-border/60 bg-space-950/40 p-3.5">
                                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                            <div className="flex items-center gap-1.5 font-bold text-starlight-100 text-xs">
                                                <Layers className="size-3.5 text-gold-400" />
                                                Grading Rubric Criteria (15 Points Max)
                                            </div>
                                            <span className="font-mono text-[11px] text-gold-400">
                                                {task.rubricFields.length} Criteria
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {task.rubricFields.map((rf) => (
                                                <div
                                                    key={rf.id}
                                                    className="flex items-center justify-between rounded-lg bg-space-900/80 px-2.5 py-1.5 border border-border/50 text-[11px]"
                                                >
                                                    <span className="text-starlight-200 truncate pr-1">
                                                        {rf.fieldName}
                                                    </span>
                                                    <span className="font-mono font-bold text-gold-400 shrink-0">
                                                        {rf.maxPoints} pts
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tactical Hints */}
                                {task.hints.length > 0 && (
                                    <div className="space-y-2 rounded-xl border border-border/60 bg-space-950/40 p-3.5">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-starlight-400">
                                            Tactical Hints ({task.hints.length})
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {task.hints.map((hint) => (
                                                <div
                                                    key={hint.id}
                                                    className="flex flex-col justify-between rounded-lg bg-space-900/60 p-2.5 border border-border/50 space-y-1.5"
                                                >
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="font-mono font-bold text-gold-400">
                                                            Hint #{hint.order}
                                                        </span>
                                                        <span className="font-mono text-[10px] text-starlight-400 bg-space-850 px-1.5 py-0.5 rounded border border-border/60">
                                                            {hint.cost} ST
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-starlight-300 line-clamp-2">
                                                        {hint.content}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Submissions Section (for INTERNAL tasks) */}
                                {task.type === "INTERNAL" && (
                                    <SubmissionsSection
                                        task={task}
                                        instructorId={instructorId}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

// ============================================
// ATTENDANCE & ENGAGEMENT ROSTER
// ============================================

function AttendanceRoster({
    sessionId,
    roster,
    instructorId,
}: {
    sessionId: string;
    roster: SessionDetailRosterEntry[];
    instructorId: string;
}) {
    const presentCount = roster.filter((r) => r.attendanceStatus === "PRESENT").length;
    const absentCount = roster.filter((r) => r.attendanceStatus === "ABSENT").length;
    const pendingCount = roster.filter((r) => !r.attendanceStatus).length;

    return (
        <Card className="rounded-2xl border border-border/80 bg-space-900/80 shadow-2 backdrop-blur-md overflow-hidden">
            <CardHeader className="p-5 border-b border-border/70 bg-space-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <UserCheck className="size-4 text-gold-400" />
                    <div>
                        <CardTitle className="text-sm font-bold font-display text-starlight-100">
                            Attendance &amp; Engagement Roster
                        </CardTitle>
                        <CardDescription className="text-xs text-starlight-400">
                            Mark live session attendance and award +5 ST engagement rewards to standout participants.
                        </CardDescription>
                    </div>
                </div>

                {/* Counters */}
                <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                    <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-emerald-300 border border-emerald-500/25">
                        {presentCount} Present
                    </span>
                    <span className="rounded-lg bg-red-500/10 px-2 py-0.5 text-red-300 border border-red-500/25">
                        {absentCount} Absent
                    </span>
                    {pendingCount > 0 && (
                        <span className="rounded-lg bg-space-850 px-2 py-0.5 text-starlight-400 border border-border/60">
                            {pendingCount} Unmarked
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-5 space-y-2">
                {roster.length === 0 ? (
                    <p className="text-xs text-starlight-400 text-center py-4">
                        No Students enrolled in this Group.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {roster.map((entry) => (
                            <RosterRow
                                key={entry.studentId}
                                sessionId={sessionId}
                                entry={entry}
                                instructorId={instructorId}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RosterRow({
    sessionId,
    entry,
    instructorId,
}: {
    sessionId: string;
    entry: SessionDetailRosterEntry;
    instructorId: string;
}) {
    const router = useRouter();
    const [isSavingAttendance, setIsSavingAttendance] = useState(false);
    const [isSavingEngagement, setIsSavingEngagement] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleAttendance(status: "PRESENT" | "ABSENT") {
        if (status === entry.attendanceStatus) return;
        setError(null);
        setIsSavingAttendance(true);
        const result = await recordAttendanceAction({
            studentId: entry.studentId,
            sessionId,
            status,
            recordedBy: instructorId,
        });
        setIsSavingAttendance(false);

        if (result.success) {
            router.refresh();
        } else {
            setError(result.error ?? "Could not save attendance.");
        }
    }

    async function handleEngagement() {
        setError(null);
        setIsSavingEngagement(true);
        const result = await recordSessionEngagementAction({
            studentId: entry.studentId,
            sessionId,
            recordedBy: instructorId,
        });
        setIsSavingEngagement(false);

        if (result.success) {
            router.refresh();
        } else {
            setError(result.error ?? "Could not record engagement.");
        }
    }

    return (
        <div className="rounded-xl border border-border/60 bg-space-950/40 p-3 hover:border-gold-500/25 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-space-850 border border-border/80 flex items-center justify-center font-mono text-xs font-bold text-starlight-200 shrink-0">
                        {entry.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <span className="text-xs font-bold text-starlight-100 block">
                            {entry.studentName}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Attendance Buttons */}
                    <div className="inline-flex rounded-xl p-0.5 bg-space-900 border border-border/60">
                        <button
                            type="button"
                            disabled={isSavingAttendance}
                            onClick={() => handleAttendance("PRESENT")}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                entry.attendanceStatus === "PRESENT"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                                    : "text-starlight-400 hover:text-starlight-200"
                            }`}
                        >
                            <CheckCircle2 className="size-3" />
                            Present
                        </button>
                        <button
                            type="button"
                            disabled={isSavingAttendance}
                            onClick={() => handleAttendance("ABSENT")}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                entry.attendanceStatus === "ABSENT"
                                    ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-xs"
                                    : "text-starlight-400 hover:text-starlight-200"
                            }`}
                        >
                            <XCircle className="size-3" />
                            Absent
                        </button>
                    </div>

                    {/* Engagement Action */}
                    {entry.engagementGiven ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-gold-500/15 px-3 py-1 font-mono text-xs font-bold text-gold-300 border border-gold-500/30">
                            <Sparkles className="size-3 text-gold-400" />
                            Engagement +5 Given
                        </span>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isSavingEngagement}
                            onClick={handleEngagement}
                            className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-xl text-xs h-7.5 px-3"
                        >
                            {isSavingEngagement ? (
                                <>
                                    <Loader2 className="size-3 mr-1 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="size-3 mr-1 text-gold-400" />
                                    Give Engagement (+5 ST)
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
            {error && (
                <p className="mt-2 text-[11px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    {error}
                </p>
            )}
        </div>
    );
}

// ============================================
// SUBMISSIONS SECTION
// ============================================

function submissionStatusBadge(row: SessionDetailSubmission): {
    label: string;
    className: string;
} {
    if (!row.submission) {
        return {
            label: "Not submitted",
            className: "bg-space-850 text-starlight-400 border-border/70",
        };
    }
    if (row.submission.isGraded) {
        return {
            label: "Graded",
            className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        };
    }
    return {
        label: "Awaiting Grading",
        className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    };
}

function SubmissionsSection({
    task,
    instructorId,
}: {
    task: SessionDetailTask;
    instructorId: string;
}) {
    const [openStudentId, setOpenStudentId] = useState<string | null>(null);
    const submittedCount = task.submissions.filter((s) => s.submission).length;
    const gradedCount = task.submissions.filter((s) => s.submission?.isGraded).length;

    return (
        <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-starlight-100">
                        Student Submissions
                    </span>
                    <span className="font-mono text-[11px] text-starlight-400">
                        ({submittedCount} / {task.submissions.length} Handed In · {gradedCount} Graded)
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                {task.submissions.map((row) => {
                    const badge = submissionStatusBadge(row);
                    const isOpen = openStudentId === row.studentId;

                    return (
                        <div
                            key={row.studentId}
                            className="rounded-xl border border-border/70 bg-space-950/60 overflow-hidden"
                        >
                            <button
                                type="button"
                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-space-900/60 transition-colors"
                                onClick={() =>
                                    setOpenStudentId(isOpen ? null : row.studentId)
                                }
                                disabled={!row.submission}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-semibold text-starlight-100">
                                        {row.studentName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${badge.className}`}
                                    >
                                        {badge.label}
                                    </span>
                                    {row.submission && (
                                        <span className="text-starlight-400 text-xs">
                                            {isOpen ? (
                                                <ChevronUp className="size-3.5" />
                                            ) : (
                                                <ChevronDown className="size-3.5" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </button>

                            {isOpen && row.submission && (
                                <div className="border-t border-border/60 p-4 bg-space-900/40">
                                    <SubmissionDetail
                                        task={task}
                                        studentId={row.studentId}
                                        submission={row.submission}
                                        instructorId={instructorId}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SubmissionDetail({
    task,
    studentId,
    submission,
    instructorId,
}: {
    task: SessionDetailTask;
    studentId: string;
    submission: NonNullable<SessionDetailSubmission["submission"]>;
    instructorId: string;
}) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    async function handleDownload() {
        if (!submission.fileUrl) return;
        setDownloadError(null);
        setIsDownloading(true);
        const result = await getSubmissionFileUrlAction(submission.fileUrl);
        setIsDownloading(false);

        if (result.success && result.data) {
            window.open(result.data, "_blank");
        } else {
            setDownloadError(result.error ?? "Could not open the file.");
        }
    }

    return (
        <div className="space-y-4 text-xs">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 text-starlight-400">
                <span>
                    Submitted on <span className="font-mono text-starlight-200">{formatDateTime(submission.submittedAt)}</span>
                </span>
                <span className="font-mono rounded-md bg-space-850 px-2 py-0.5 text-[11px] text-starlight-300 border border-border/60">
                    Format: {submission.mode}
                </span>
            </div>

            {/* Submission Content */}
            {submission.mode === "TEXT" && (
                <div className="rounded-xl bg-space-950 p-3.5 border border-border/60">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-starlight-200 leading-relaxed max-h-60 overflow-y-auto">
                        {submission.textContent}
                    </pre>
                </div>
            )}

            {submission.mode === "LINK" && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-space-950 p-3 border border-border/60">
                    <a
                        href={submission.externalLink ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-xs font-mono text-gold-400 hover:text-gold-300 underline underline-offset-4 flex items-center gap-1.5"
                    >
                        <ExternalLink className="size-3.5 shrink-0" />
                        {submission.externalLink}
                    </a>
                </div>
            )}

            {submission.mode === "FILE" && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-space-950 p-3 border border-border/60">
                    <div className="flex items-center gap-2 text-starlight-200">
                        <FileText className="size-4 text-gold-400" />
                        <span>Attached Solution File</span>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="h-8 text-xs border-border/80 hover:bg-space-850 text-starlight-200"
                    >
                        <Download className="size-3.5 mr-1 text-gold-400" />
                        {isDownloading ? "Opening..." : "Download / View File"}
                    </Button>
                    {downloadError && (
                        <p className="text-xs text-red-400">{downloadError}</p>
                    )}
                </div>
            )}

            {/* Graded Scorecard OR Dynamic Grading Form */}
            {submission.isGraded ? (
                <div className="rounded-xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-space-900 to-space-950 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="size-4 text-gold-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
                                Evaluated Rubric Grade
                            </span>
                        </div>
                        <span className="font-mono text-base font-extrabold text-gold-300">
                            {submission.taskGrade?.totalPoints ?? (
                                (submission.understandingScore ?? 0) +
                                (submission.approachScore ?? 0) +
                                (submission.correctnessScore ?? 0) +
                                (submission.implementationScore ?? 0)
                            )}{" "}
                            / 15 ST
                        </span>
                    </div>

                    {submission.taskGrade?.markedInvalid && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-300 flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0 text-red-400" />
                            <span>Marked Invalid or Incomplete by instructor (0 ST awarded).</span>
                        </div>
                    )}

                    {/* Criteria Breakdown */}
                    {submission.taskGrade?.fieldScores && submission.taskGrade.fieldScores.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            {submission.taskGrade.fieldScores.map((score) => {
                                const rubricField = task.rubricFields.find(
                                    (rf) => rf.id === score.rubricFieldId
                                );
                                return (
                                    <div
                                        key={score.rubricFieldId}
                                        className="flex items-center justify-between bg-space-950/80 px-3 py-1.5 rounded-lg border border-border/50"
                                    >
                                        <span className="text-starlight-300 truncate pr-2">
                                            {rubricField?.fieldName ?? "Criterion"}
                                        </span>
                                        <span className="font-mono font-bold text-gold-400 shrink-0">
                                            {score.awardedPoints} / {rubricField?.maxPoints ?? 5} pts
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-[11px] text-starlight-400 font-mono">
                            Understanding {submission.understandingScore}/2 · Approach{" "}
                            {submission.approachScore}/3 · Correctness{" "}
                            {submission.correctnessScore}/3 · Implementation{" "}
                            {submission.implementationScore}/2
                        </p>
                    )}

                    {submission.instructorComment && (
                        <div className="rounded-lg bg-space-950/70 p-3 border border-border/50 text-xs text-starlight-200 space-y-1">
                            <div className="flex items-center gap-1.5 text-starlight-400 font-medium">
                                <MessageSquareQuote className="size-3.5 text-gold-400" />
                                Instructor Feedback
                            </div>
                            <p className="italic text-starlight-300 whitespace-pre-wrap">
                                &ldquo;{submission.instructorComment}&rdquo;
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <DynamicGradingForm
                    task={task}
                    submissionId={submission.id}
                    instructorId={instructorId}
                />
            )}
        </div>
    );
}

// ============================================
// DYNAMIC RUBRIC GRADING FORM (15 PTS)
// ============================================

function DynamicGradingForm({
    task,
    submissionId,
    instructorId,
}: {
    task: SessionDetailTask;
    submissionId: string;
    instructorId: string;
}) {
    const router = useRouter();

    // Map rubric fields to state
    const [fieldScores, setFieldScores] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        for (const rf of task.rubricFields) {
            initial[rf.id] = rf.maxPoints; // default to full score
        }
        return initial;
    });

    const [markedInvalid, setMarkedInvalid] = useState(false);
    const [isFirstSolver, setIsFirstSolver] = useState(false);
    const [instructorComment, setInstructorComment] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate live score
    const totalScore = markedInvalid
        ? 0
        : task.rubricFields.reduce((sum, rf) => sum + (fieldScores[rf.id] ?? 0), 0);

    function updateScore(fieldId: string, val: number, max: number) {
        const clamped = Math.max(0, Math.min(max, val));
        setFieldScores((prev) => ({ ...prev, [fieldId]: clamped }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        setIsSubmitting(true);
        const result = await gradeSubmissionAction({
            submissionId,
            fieldScores: task.rubricFields.map((rf) => ({
                rubricFieldId: rf.id,
                awardedPoints: markedInvalid ? 0 : (fieldScores[rf.id] ?? 0),
            })),
            markedInvalid,
            instructorComment: instructorComment.trim() || undefined,
            gradedBy: instructorId,
            isFirstSolver,
        });
        setIsSubmitting(false);

        if (result.success) {
            router.refresh();
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-gold-500/30 bg-space-950/70 p-4 animate-fade-in"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <Award className="size-4 text-gold-400" />
                    <div>
                        <h4 className="text-xs font-bold text-starlight-100 block">
                            Rubric Grading &amp; Feedback
                        </h4>
                        <p className="text-[11px] text-starlight-400">
                            Evaluate each criterion. Total score awards up to 15 ST.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`font-mono text-xs font-bold px-3 py-1 rounded-full border ${
                            markedInvalid
                                ? "bg-red-500/15 text-red-400 border-red-500/30"
                                : "bg-gold-500/15 text-gold-300 border-gold-500/30"
                        }`}
                    >
                        Score: {totalScore} / 15 ST
                    </span>
                </div>
            </div>

            {/* Invalid Submission Toggle */}
            <div className="flex items-center gap-2 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                <Checkbox
                    id={`invalid-${submissionId}`}
                    checked={markedInvalid}
                    onCheckedChange={(checked) => setMarkedInvalid(checked === true)}
                />
                <Label
                    htmlFor={`invalid-${submissionId}`}
                    className="text-xs text-red-300 font-semibold cursor-pointer"
                >
                    Mark submission as Invalid / Incomplete (Awards 0 ST)
                </Label>
            </div>

            {/* Dynamic Rubric Fields (Disabled if markedInvalid) */}
            {!markedInvalid && task.rubricFields.length > 0 && (
                <div className="space-y-2.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-starlight-400 block">
                        Criteria Evaluation
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {task.rubricFields.map((field) => (
                            <div
                                key={field.id}
                                className="space-y-1.5 rounded-xl bg-space-900/80 p-3 border border-border/60"
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-starlight-200 truncate pr-2">
                                        {field.fieldName}
                                    </span>
                                    <span className="font-mono text-gold-400 font-bold shrink-0">
                                        {fieldScores[field.id] ?? 0} / {field.maxPoints} pts
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min={0}
                                        max={field.maxPoints}
                                        value={fieldScores[field.id] ?? 0}
                                        onChange={(e) =>
                                            updateScore(
                                                field.id,
                                                Number(e.target.value),
                                                field.maxPoints
                                            )
                                        }
                                        className="w-full accent-gold-400 cursor-pointer h-1.5 bg-space-800 rounded-lg"
                                    />
                                    <Input
                                        type="number"
                                        min={0}
                                        max={field.maxPoints}
                                        value={fieldScores[field.id] ?? 0}
                                        onChange={(e) =>
                                            updateScore(
                                                field.id,
                                                Number(e.target.value),
                                                field.maxPoints
                                            )
                                        }
                                        className="w-14 h-7 text-xs font-mono text-center bg-space-850 border-border/70 text-starlight-100 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Instructor Comment */}
            <div className="space-y-1.5 pt-1">
                <Label
                    htmlFor={`comment-${submissionId}`}
                    className="text-xs font-semibold text-starlight-200 flex items-center gap-1.5"
                >
                    <MessageSquareQuote className="size-3.5 text-gold-400" />
                    Instructor Feedback &amp; Suggestions (Visible to Student)
                </Label>
                <MarkdownEditor
                    id={`comment-${submissionId}`}
                    label=""
                    value={instructorComment}
                    onChange={(val) => setInstructorComment(val)}
                    placeholder="Constructive feedback, code review remarks, or praise..."
                    rows={3}
                />
            </div>

            {/* First Solver Bonus */}
            <div className="flex items-center gap-2 pt-1">
                <Checkbox
                    id={`first-solver-${submissionId}`}
                    checked={isFirstSolver}
                    onCheckedChange={(checked) => setIsFirstSolver(checked === true)}
                />
                <Label
                    htmlFor={`first-solver-${submissionId}`}
                    className="text-xs text-starlight-300 font-normal cursor-pointer flex items-center gap-1"
                >
                    <Trophy className="size-3 text-gold-400" />
                    First solver in group (+5 ST bonus)
                </Label>
            </div>

            {error && (
                <p className="rounded-xl bg-red-500/10 p-2.5 text-xs text-red-300 border border-red-500/20">
                    {error}
                </p>
            )}

            <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-gold-500 hover:bg-gold-450 text-space-950 font-bold rounded-xl text-xs h-8 px-4"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                        Submitting Grade...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="size-3.5 mr-1.5" />
                        Confirm &amp; Award {totalScore} ST
                    </>
                )}
            </Button>
        </form>
    );
}

// ============================================
// EDIT SESSION FORM
// ============================================

function EditSessionForm({
    session,
    onDone,
}: {
    session: SessionDetail;
    onDone: () => void;
}) {
    const router = useRouter();
    const [title, setTitle] = useState(session.title);
    const [startTime, setStartTime] = useState(toDatetimeLocal(session.startTime));
    const [durationMinutes, setDurationMinutes] = useState(
        String(session.durationMinutes)
    );
    const [recordingLink, setRecordingLink] = useState(session.recordingLink ?? "");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const durationValue = Number(durationMinutes);
        if (!Number.isFinite(durationValue) || durationValue <= 0) {
            setError("Duration must be a positive number of minutes.");
            return;
        }

        setIsSubmitting(true);
        const result = await updateSessionAction({
            sessionId: session.id,
            title: title.trim(),
            startTime: new Date(startTime),
            durationMinutes: durationValue,
            recordingLink: recordingLink.trim() ? recordingLink.trim() : null,
        });
        setIsSubmitting(false);

        if (result.success) {
            router.refresh();
            onDone();
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
                <Label htmlFor="edit-title" className="text-xs font-semibold text-starlight-200">
                    Session Title
                </Label>
                <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-space-850/80 border-border/80 text-starlight-100 rounded-xl text-xs"
                    required
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="edit-start" className="text-xs font-semibold text-starlight-200">
                        Start Time
                    </Label>
                    <Input
                        id="edit-start"
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-space-850/80 border-border/80 text-starlight-100 rounded-xl text-xs"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="edit-duration" className="text-xs font-semibold text-starlight-200">
                        Duration (Minutes)
                    </Label>
                    <Input
                        id="edit-duration"
                        type="number"
                        min={1}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        className="bg-space-850/80 border-border/80 text-starlight-100 rounded-xl text-xs"
                        required
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="edit-recording" className="text-xs font-semibold text-starlight-200">
                    Recording Link (Optional)
                </Label>
                <Input
                    id="edit-recording"
                    type="url"
                    placeholder="https://..."
                    value={recordingLink}
                    onChange={(e) => setRecordingLink(e.target.value)}
                    className="bg-space-850/80 border-border/80 text-starlight-100 rounded-xl text-xs"
                />
            </div>

            {error && (
                <p className="rounded-xl bg-red-500/10 p-2.5 text-xs text-red-300 border border-red-500/20">
                    {error}
                </p>
            )}

            <div className="flex items-center gap-2 pt-1">
                <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="bg-gold-500 hover:bg-gold-450 text-space-950 font-bold rounded-xl text-xs"
                >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDone}
                    className="text-starlight-400 hover:text-starlight-200 rounded-xl text-xs"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}

// ============================================
// STUDENT FEEDBACK & RATINGS SECTION
// ============================================

function SessionFeedbackSection({
    feedbacks,
    stats,
}: {
    feedbacks: SessionFeedbackDetail[];
    stats: SessionFeedbackStats;
}) {
    const [search, setSearch] = useState("");
    const [filterWithCommentsOnly, setFilterWithCommentsOnly] = useState(false);
    const [ratingFilter, setRatingFilter] = useState<"ALL" | "HIGH" | "LOW">("ALL");

    const filtered = feedbacks.filter((f) => {
        if (search) {
            const query = search.toLowerCase();
            const matchesName = f.studentName.toLowerCase().includes(query);
            const matchesEmail = f.studentEmail.toLowerCase().includes(query);
            const matchesComment = f.comment?.toLowerCase().includes(query) ?? false;
            if (!matchesName && !matchesEmail && !matchesComment) return false;
        }
        if (filterWithCommentsOnly && !f.comment) {
            return false;
        }
        if (ratingFilter === "HIGH" && f.rating < 8) return false;
        if (ratingFilter === "LOW" && f.rating > 5) return false;
        return true;
    });

    const participationPercent =
        stats.totalEligibleStudents > 0
            ? Math.round((stats.totalFeedbacks / stats.totalEligibleStudents) * 100)
            : 0;

    return (
        <Card className="rounded-2xl border border-border/80 bg-space-900/80 shadow-2 backdrop-blur-md overflow-hidden">
            <CardHeader className="p-5 border-b border-border/70 bg-space-950/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold font-display text-starlight-100">
                                <Star className="size-4 text-gold-400 fill-gold-400/20" />
                                Student Ratings &amp; Feedback
                            </CardTitle>
                            <Badge variant="outline" className="font-mono text-xs">
                                {stats.totalFeedbacks} Reviews
                            </Badge>
                        </div>
                        <p className="text-xs text-starlight-400 mt-1">
                            Ratings and remarks submitted by students before accessing session tasks.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="rounded-xl border border-gold-500/25 bg-gold-500/10 px-3.5 py-1.5 text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-400 block">
                                Avg Rating
                            </span>
                            <span className="font-mono text-base font-extrabold text-gold-300">
                                {stats.averageRating !== null ? `${stats.averageRating} / 10` : "—"}
                            </span>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-space-950/70 px-3.5 py-1.5 text-center">
                            <span className="text-[10px] uppercase font-medium tracking-wider text-starlight-400 block">
                                Turnout
                            </span>
                            <span className="font-mono text-base font-bold text-starlight-200">
                                {participationPercent}%
                            </span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
                {feedbacks.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-starlight-400" />
                            <Input
                                placeholder="Search by student name or comment..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 text-xs bg-space-950/60 border-border/70 rounded-xl placeholder:text-starlight-500 text-starlight-100"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Button
                                size="sm"
                                variant={ratingFilter === "ALL" ? "secondary" : "outline"}
                                onClick={() => setRatingFilter("ALL")}
                                className="h-8 text-xs rounded-xl"
                            >
                                All ({feedbacks.length})
                            </Button>
                            <Button
                                size="sm"
                                variant={ratingFilter === "HIGH" ? "secondary" : "outline"}
                                onClick={() => setRatingFilter("HIGH")}
                                className="h-8 text-xs rounded-xl text-emerald-400"
                            >
                                High (8-10)
                            </Button>
                            <Button
                                size="sm"
                                variant={ratingFilter === "LOW" ? "secondary" : "outline"}
                                onClick={() => setRatingFilter("LOW")}
                                className="h-8 text-xs rounded-xl text-amber-400"
                            >
                                Low (1-5)
                            </Button>
                            <Button
                                size="sm"
                                variant={filterWithCommentsOnly ? "secondary" : "outline"}
                                onClick={() => setFilterWithCommentsOnly((v) => !v)}
                                className="h-8 text-xs rounded-xl"
                            >
                                With Comments
                            </Button>
                        </div>
                    </div>
                )}

                {feedbacks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-space-950/40 p-8 text-center space-y-2">
                        <Star className="size-7 mx-auto text-starlight-500 opacity-60" />
                        <p className="text-sm font-medium text-starlight-300">
                            No Ratings Received Yet
                        </p>
                        <p className="text-xs text-starlight-400 max-w-sm mx-auto">
                            Students will evaluate this session when they access it to begin their tasks.
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border border-border/60 bg-space-950/30 p-6 text-center text-xs text-starlight-400">
                        No ratings match your filter criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filtered.map((fb) => {
                            const isHigh = fb.rating >= 8;
                            const isMid = fb.rating >= 5 && fb.rating < 8;
                            const badgeColor = isHigh
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : isMid
                                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                    : "bg-red-500/15 text-red-300 border-red-500/30";

                            return (
                                <div
                                    key={fb.id}
                                    className="flex flex-col justify-between rounded-xl border border-border/70 bg-space-950/60 p-4 space-y-3 hover:border-gold-500/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold text-starlight-100">
                                                {fb.studentName}
                                            </p>
                                            <p className="text-[11px] text-starlight-400 font-mono">
                                                {fb.studentEmail}
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-xs font-bold border shrink-0 ${badgeColor}`}
                                        >
                                            <Star className="size-3 fill-current" />
                                            {fb.rating} / 10
                                        </span>
                                    </div>

                                    {fb.comment ? (
                                        <div className="rounded-lg bg-space-900/80 border border-border/50 p-2.5 text-xs text-starlight-200 leading-relaxed whitespace-pre-wrap">
                                            &ldquo;{fb.comment}&rdquo;
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-starlight-500 italic">
                                            No written remarks provided
                                        </p>
                                    )}

                                    <div className="pt-2 border-t border-border/40 text-[10px] text-starlight-500 flex items-center justify-between">
                                        <span>Submitted</span>
                                        <span>{formatDateTime(fb.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}