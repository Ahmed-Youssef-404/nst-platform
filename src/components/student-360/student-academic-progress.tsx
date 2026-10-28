// src/components/student-360/student-academic-progress.tsx
"use client";

import { useState } from "react";
import type {
    Student360TaskProgress,
    Student360WeekResourceProgress,
} from "@/lib/data/get-student-360";
import { formatDateTime } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Clock,
    FileText,
    ExternalLink,
    HelpCircle,
    AlertTriangle,
    Sparkles,
    UserCheck,
    MessageSquare,
    Lock,
    Unlock,
    Flame,
    XCircle,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentAcademicProgress({
    tasks,
    weekResources,
    isTrackBeginner = false,
}: {
    tasks: Student360TaskProgress[];
    weekResources?: Student360WeekResourceProgress[];
    isTrackBeginner?: boolean;
}) {
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    const submittedCount = tasks.filter((t) => t.submission !== null).length;
    const gradedCount = tasks.filter((t) => {
        if (!t.submission) return false;
        return isTrackBeginner ? !!t.submission.finalizedAt : !!t.submission.gradedAt;
    }).length;
    const totalHintsUnlocked = tasks.reduce((sum, t) => sum + t.hints.unlockedHintsCount, 0);
    const totalHintCost = tasks.reduce((sum, t) => sum + t.hints.totalCostPaid, 0);

    return (
        <div className="space-y-6">
            {/* Top progress metrics strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-starlight-400">Total Curriculum Tasks</span>
                    <p className="text-xl font-bold font-display text-starlight-100">{tasks.length}</p>
                    <p className="text-[10px] text-starlight-400">Tasks assigned in track</p>
                </div>

                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-success-400">Submissions Lodged</span>
                    <p className="text-xl font-bold font-display text-success-400">
                        {submittedCount} / {tasks.length}
                    </p>
                    <p className="text-[10px] text-starlight-400">
                        {tasks.length - submittedCount} tasks remaining
                    </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gold-400">Graded & Evaluated</span>
                    <p className="text-xl font-bold font-display text-gold-300">
                        {gradedCount} / {tasks.length}
                    </p>
                    <p className="text-[10px] text-starlight-400">
                        {submittedCount - gradedCount} awaiting evaluation
                    </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-400">Hints Unlocked</span>
                    <p className="text-xl font-bold font-display text-blue-300">
                        {totalHintsUnlocked} Hints
                    </p>
                    <p className="text-[10px] text-starlight-400 font-mono">
                        {totalHintCost} ST invested
                    </p>
                </div>
            </div>

            {/* Beginner Track: Weekly Resource Submissions */}
            {isTrackBeginner && weekResources && weekResources.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-starlight-200 flex items-center gap-2">
                        <FileText className="size-4 text-violet-400" />
                        Weekly Required Resources & Delivery Status
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {weekResources.map((res) => {
                            const hasSubmitted = !!res.resourceSubmission?.submittedAt;
                            const status = res.resourceSubmission?.status ?? "PENDING";
                            const isAccepted = status === "ACCEPTED";
                            const isRejected = status === "REJECTED";

                            return (
                                <div
                                    key={res.weekId}
                                    className="p-4 rounded-xl border border-border/80 bg-space-900/70 space-y-2.5"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-starlight-100">{res.weekName}</span>
                                        <Badge
                                            className={cn(
                                                "text-[10px] font-semibold px-2.5 py-0.5 rounded-full border",
                                                !hasSubmitted
                                                    ? "bg-space-850 text-starlight-400 border-border/70"
                                                    : isAccepted
                                                        ? "bg-success-500/15 text-success-400 border-success-500/30"
                                                        : isRejected
                                                            ? "bg-destructive/15 text-destructive border-destructive/30"
                                                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                            )}
                                        >
                                            {!hasSubmitted ? "Not Uploaded" : `File ${status}`}
                                        </Badge>
                                    </div>

                                    <div className="text-xs text-starlight-300 space-y-1">
                                        <p className="text-starlight-400 flex items-center gap-1.5">
                                            <FileText className="size-3.5 text-gold-400" />
                                            <span>Required: {res.requiredFileLabel}</span>
                                        </p>
                                        {res.resourceSubmission?.submittedAt && (
                                            <p className="text-[11px] text-starlight-400 font-mono">
                                                Submitted: {formatDateTime(res.resourceSubmission.submittedAt)}
                                                {res.resourceSubmission.lockedAt && " (Locked by Student)"}
                                            </p>
                                        )}
                                        {res.resourceSubmission?.fileUrl && (
                                            <a
                                                href={res.resourceSubmission.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-400 hover:text-gold-300 pt-1"
                                            >
                                                <span>Inspect Uploaded File</span>
                                                <ExternalLink className="size-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tasks & Submissions List */}
            <div className="space-y-3">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-starlight-200 flex items-center gap-2">
                    <Sparkles className="size-4 text-gold-400" />
                    Curriculum Tasks, Rubrics & Submission Records
                </h3>

                {tasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/80 bg-space-950/40 p-8 text-center text-xs text-starlight-400">
                        No tasks have been scheduled for this track yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => {
                            const sub = task.submission;
                            const isExpanded = expandedTaskId === task.taskId;
                            const isSubmitted = !!sub;
                            const isDraft = sub?.status === "DRAFT";
                            const isGraded = isTrackBeginner
                                ? !!sub?.finalizedAt
                                : !!sub?.gradedAt;

                            return (
                                <div
                                    key={task.taskId}
                                    className={cn(
                                        "rounded-xl border transition-all overflow-hidden",
                                        isGraded
                                            ? "border-gold-500/35 bg-space-900/75"
                                            : isSubmitted
                                                ? "border-border/80 bg-space-900/60"
                                                : "border-border/60 bg-space-950/40"
                                    )}
                                >
                                    {/* Task Row Header */}
                                    <div
                                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-space-850/50 transition-colors"
                                        onClick={() =>
                                            setExpandedTaskId(isExpanded ? null : task.taskId)
                                        }
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <span className="font-bold text-sm text-starlight-100">
                                                    {task.taskTitle}
                                                </span>

                                                {task.isBonus && (
                                                    <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px] font-semibold py-0">
                                                        <Flame className="size-3 mr-1 text-amber-400" /> Bonus Mission
                                                    </Badge>
                                                )}

                                                <Badge variant="outline" className="text-[10px] text-starlight-400 border-border/70 py-0">
                                                    {task.taskType}
                                                </Badge>

                                                <span className="text-xs text-starlight-400">
                                                    {task.sessionOrWeekName}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-starlight-400 font-mono">
                                                <span>Deadline: {formatDateTime(task.deadline)}</span>
                                                {task.hints.unlockedHintsCount > 0 && (
                                                    <span className="text-blue-300">
                                                        {task.hints.unlockedHintsCount} hints unlocked (-{task.hints.totalCostPaid} ST)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status & Scores Pill */}
                                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                                            {/* Submission status pill */}
                                            {!isSubmitted ? (
                                                <Badge className="bg-space-850 text-starlight-400 border-border/70 text-xs">
                                                    Not Submitted
                                                </Badge>
                                            ) : isDraft ? (
                                                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-xs font-semibold">
                                                    Draft Saved
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-success-500/15 text-success-400 border-success-500/30 text-xs font-semibold">
                                                    <CheckCircle2 className="size-3 mr-1" />
                                                    Submitted
                                                </Badge>
                                            )}

                                            {/* Grade pill */}
                                            {isGraded ? (
                                                <Badge className="bg-gold-500/15 text-gold-300 border-gold-500/40 text-xs font-bold shadow-gold">
                                                    {isTrackBeginner
                                                        ? `${sub?.totalPoints ?? 0} pts (Finalized)`
                                                        : `${(sub?.understandingScore ?? 0) +
                                                        (sub?.approachScore ?? 0) +
                                                        (sub?.correctnessScore ?? 0) +
                                                        (sub?.implementationScore ?? 0)}/10 Graded`}
                                                </Badge>
                                            ) : isSubmitted ? (
                                                <span className="text-xs text-starlight-400 italic">
                                                    Pending Evaluation
                                                </span>
                                            ) : null}

                                            {isExpanded ? (
                                                <ChevronUp className="size-4 text-starlight-400" />
                                            ) : (
                                                <ChevronDown className="size-4 text-starlight-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details Panel */}
                                    {isExpanded && (
                                        <div className="p-4 border-t border-border/70 bg-space-950/70 space-y-4 text-xs animate-fade-in">
                                            {/* Submission Details */}
                                            {sub ? (
                                                <div className="space-y-3 p-3.5 rounded-xl bg-space-900/90 border border-border/70">
                                                    <div className="flex items-center justify-between text-starlight-300">
                                                        <span className="font-semibold text-starlight-200">
                                                            Submission Mode: {sub.mode}
                                                        </span>
                                                        <span className="font-mono text-starlight-400 text-[11px]">
                                                            Submitted: {formatDateTime(sub.submittedAt)}
                                                        </span>
                                                    </div>

                                                    {sub.externalLink && (
                                                        <p className="truncate">
                                                            <span className="text-starlight-400">Link: </span>
                                                            <a
                                                                href={sub.externalLink}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-gold-400 hover:text-gold-300 underline font-mono"
                                                            >
                                                                {sub.externalLink}
                                                            </a>
                                                        </p>
                                                    )}

                                                    {sub.fileUrl && (
                                                        <p>
                                                            <a
                                                                href={sub.fileUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300 font-semibold underline"
                                                            >
                                                                <FileText className="size-3.5" />
                                                                <span>Download Submitted Solution File</span>
                                                            </a>
                                                        </p>
                                                    )}

                                                    {sub.textContent && (
                                                        <div className="space-y-1 pt-1">
                                                            <span className="text-[10px] uppercase font-bold text-starlight-400">
                                                                Submitted Content
                                                            </span>
                                                            <pre dir="auto" className="p-2.5 rounded-lg bg-space-950 border border-border/70 font-mono text-[11px] text-starlight-200 overflow-x-auto whitespace-pre-wrap">
                                                                {sub.textContent}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-starlight-400 italic">
                                                    No solution submitted by student for this task.
                                                </p>
                                            )}

                                            {/* Track-Specific Grading Breakdown */}
                                            {isGraded && (
                                                <div className="p-3.5 rounded-xl bg-space-900/90 border border-gold-500/25 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-gold-300 flex items-center gap-1.5">
                                                            <UserCheck className="size-3.5 text-gold-400" />
                                                            Evaluated by Instructor {sub?.gradedByName || "Instructor"}
                                                        </span>
                                                        <span className="text-starlight-400 font-mono text-[11px]">
                                                            {formatDateTime(
                                                                (isTrackBeginner ? sub?.finalizedAt : sub?.gradedAt) ||
                                                                new Date()
                                                            )}
                                                        </span>
                                                    </div>

                                                    {/* Beginner Rubric Fields */}
                                                    {isTrackBeginner && sub?.fieldScores && sub.fieldScores.length > 0 && (
                                                        <div className="space-y-1.5 pt-1">
                                                            <span className="text-[10px] uppercase font-bold text-starlight-400">
                                                                Rubric Criteria Breakdown
                                                            </span>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                                {sub.fieldScores.map((fs) => (
                                                                    <div
                                                                        key={fs.id}
                                                                        className="p-2.5 rounded-lg bg-space-950 border border-border/60 flex items-center justify-between"
                                                                    >
                                                                        <span className="font-medium text-starlight-200 truncate pr-2">
                                                                            {fs.fieldName}
                                                                        </span>
                                                                        <span className="font-mono font-bold text-gold-300 shrink-0">
                                                                            {fs.awardedPoints} / {fs.maxPoints} pts
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Intermediate 4-Score Breakdown */}
                                                    {!isTrackBeginner && (
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                                            <div className="p-2 rounded-lg bg-space-950 border border-border/60 text-center">
                                                                <p className="text-[10px] text-starlight-400">Understanding</p>
                                                                <p className="text-sm font-bold text-gold-300">
                                                                    {sub?.understandingScore ?? 0} / 2
                                                                </p>
                                                            </div>
                                                            <div className="p-2 rounded-lg bg-space-950 border border-border/60 text-center">
                                                                <p className="text-[10px] text-starlight-400">Approach</p>
                                                                <p className="text-sm font-bold text-gold-300">
                                                                    {sub?.approachScore ?? 0} / 3
                                                                </p>
                                                            </div>
                                                            <div className="p-2 rounded-lg bg-space-950 border border-border/60 text-center">
                                                                <p className="text-[10px] text-starlight-400">Correctness</p>
                                                                <p className="text-sm font-bold text-gold-300">
                                                                    {sub?.correctnessScore ?? 0} / 3
                                                                </p>
                                                            </div>
                                                            <div className="p-2 rounded-lg bg-space-950 border border-border/60 text-center">
                                                                <p className="text-[10px] text-starlight-400">Implementation</p>
                                                                <p className="text-sm font-bold text-gold-300">
                                                                    {sub?.implementationScore ?? 0} / 2
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Instructor Feedback Comment */}
                                                    {sub?.instructorComment && (
                                                        <div className="space-y-1 pt-1">
                                                            <span className="text-[10px] uppercase font-bold text-starlight-400 flex items-center gap-1">
                                                                <MessageSquare className="size-3 text-gold-400" />
                                                                Instructor Feedback
                                                            </span>
                                                            <p className="p-2.5 rounded-lg bg-space-950 border border-border/60 text-starlight-200 italic">
                                                                &ldquo;{sub.instructorComment}&rdquo;
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
