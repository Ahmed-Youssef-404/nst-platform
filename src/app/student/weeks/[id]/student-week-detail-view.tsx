// src/app/student/weeks/[id]/student-week-detail-view.tsx
// Interactive view for a Beginner Student's Week:
//   - Header with dates & YouTube lecture playlist link
//   - Mandatory Deliverable Card (upload & replace file)
//   - Week Lock Control (with validation that deliverable exists)
//   - Interactive Task Pager with custom rubrics, hints & draft submissions

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    FileText,
    Inbox,
    Lock,
    PlayCircle,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UploadCloud,
    Video,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { WeekTaskDetailCard } from "@/components/student/week-task-detail-card";
import {
    uploadWeekResourceAction,
    lockWeekAction,
} from "@/lib/actions/week-submission";
import { getSubmissionFileUrlAction } from "@/lib/actions/submission-management";
import type { StudentWeekDetail } from "@/lib/data/get-student-weeks";
import type { WeekStatus } from "@/lib/data/get-my-groups";
import type { WeekResourceStatusCode } from "@/types/types";
import { formatDateTime } from "@/lib/format-date";

const STATUS_CONFIG: Record<
    WeekStatus,
    { label: string; badgeClassName: string }
> = {
    ongoing: {
        label: "Live Now",
        badgeClassName: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse",
    },
    ended: {
        label: "Completed",
        badgeClassName: "bg-space-800 text-starlight-300 border-border/80",
    },
    upcoming: {
        label: "Upcoming",
        badgeClassName: "bg-space-850 text-starlight-400 border-border/60",
    },
};

const RESOURCE_STATUS_CONFIG: Record<
    WeekResourceStatusCode,
    { label: string; badgeClassName: string }
> = {
    PENDING: {
        label: "Uploaded (Pending Review)",
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

export function StudentWeekDetailView({
    week,
    studentId,
}: {
    week: StudentWeekDetail;
    studentId: string;
}) {
    const router = useRouter();
    const statusConfig = STATUS_CONFIG[week.status];

    // Deliverable upload state
    const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
    const [isUploadingDeliverable, setIsUploadingDeliverable] = useState(false);
    const [deliverableError, setDeliverableError] = useState<string | null>(null);
    const [deliverableSuccess, setDeliverableSuccess] = useState<string | null>(null);
    const [isDownloadingDeliverable, setIsDownloadingDeliverable] = useState(false);

    // Week Lock state
    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [isLocking, setIsLocking] = useState(false);
    const [lockError, setLockError] = useState<string | null>(null);

    // Task Stepper state
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

    // Upload Mandatory Deliverable
    async function handleUploadDeliverable(e: React.FormEvent) {
        e.preventDefault();
        if (!deliverableFile) {
            setDeliverableError("Please select a file to upload.");
            return;
        }

        setIsUploadingDeliverable(true);
        setDeliverableError(null);
        setDeliverableSuccess(null);

        try {
            const formData = new FormData();
            formData.append("weekId", week.id);
            formData.append("file", deliverableFile);

            const res = await uploadWeekResourceAction(formData);

            if (!res.success) {
                setDeliverableError(res.error ?? "Failed to upload deliverable file.");
            } else {
                setDeliverableSuccess("Deliverable file uploaded successfully!");
                setDeliverableFile(null);
                router.refresh();
            }
        } catch (err) {
            setDeliverableError(err instanceof Error ? err.message : "Unexpected error.");
        } finally {
            setIsUploadingDeliverable(false);
        }
    }

    // Download Existing Deliverable
    async function handleDownloadDeliverable(fileUrl: string) {
        setIsDownloadingDeliverable(true);
        try {
            const res = await getSubmissionFileUrlAction(fileUrl);
            if (res.success && res.data) {
                window.open(res.data, "_blank", "noopener,noreferrer");
            } else {
                alert(res.error ?? "Could not generate download link.");
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Error generating download link.");
        } finally {
            setIsDownloadingDeliverable(false);
        }
    }

    // Confirm Lock Week
    async function handleConfirmLockWeek() {
        setIsLocking(true);
        setLockError(null);

        try {
            const res = await lockWeekAction({ weekId: week.id });
            if (!res.success) {
                setLockError(res.error ?? "Failed to lock the week.");
            } else {
                setIsLockModalOpen(false);
                router.refresh();
            }
        } catch (err) {
            setLockError(err instanceof Error ? err.message : "Locking failed.");
        } finally {
            setIsLocking(false);
        }
    }

    const currentTask = week.tasks[currentTaskIndex];
    const canGoPrev = currentTaskIndex > 0;
    const canGoNext = currentTaskIndex < week.tasks.length - 1;

    const draftsCount = week.tasks.filter((t) => t.submission?.status === "DRAFT").length;
    const submittedCount = week.tasks.filter((t) => t.submission?.status === "SUBMITTED").length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back Navigation Breadcrumb */}
            <div>
                <Link
                    href="/student"
                    className="inline-flex items-center gap-2 rounded-xl bg-space-900/80 px-3.5 py-1.5 text-xs font-medium text-starlight-300 border border-border/60 hover:text-gold-300 hover:border-gold-500/30 hover:bg-space-850 transition-all"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to My Weeks</span>
                </Link>
            </div>

            {/* Week Header Banner */}
            <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-space-850 via-space-900 to-space-950 p-6 md:p-8 space-y-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusConfig.badgeClassName}`}
                            >
                                {week.status === "ongoing" && (
                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                                )}
                                {statusConfig.label}
                            </span>

                            {week.isLocked && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-semibold text-gold-300 border border-gold-500/30">
                                    <Lock className="size-3 text-gold-400" />
                                    Week Locked & Finalized
                                </span>
                            )}
                        </div>

                        <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-starlight-100">
                            {week.name}
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-starlight-300">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-starlight-400" />
                                <span>{formatDateTime(week.startDate)}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Clock className="size-3.5 text-starlight-400" />
                                <span>Deadline: {formatDateTime(week.endDate)}</span>
                            </div>

                            <div className="font-mono text-starlight-400">
                                {week.groupName} · {week.batchName} (Beginner Track)
                            </div>
                        </div>
                    </div>

                    {/* YouTube Playlist Button */}
                    {week.playlistUrl && (
                        <div className="shrink-0">
                            <a
                                href={week.playlistUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600/20 via-red-600/10 to-transparent hover:from-red-600/30 px-4 py-2.5 text-xs font-semibold text-red-200 border border-red-500/40 shadow-xs transition-all hover:scale-[1.02]"
                            >
                                <Video className="size-4 text-red-400" />
                                <span>Watch Lecture Playlist</span>
                                <ExternalLink className="size-3 text-red-400/80 ml-0.5" />
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* The Two Critical Week Cards: Mandatory Deliverable & Lock Control */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Mandatory Deliverable Card */}
                <div className="rounded-2xl border border-border/80 bg-space-900/80 p-5 md:p-6 space-y-4 shadow-md backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-gold-400" />
                            <h3 className="font-display text-sm font-bold text-starlight-100">
                                Mandatory Week Deliverable
                            </h3>
                        </div>

                        {week.resource ? (
                            <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    RESOURCE_STATUS_CONFIG[week.resource.status]?.badgeClassName ??
                                    "bg-space-800 text-starlight-300"
                                }`}
                            >
                                {RESOURCE_STATUS_CONFIG[week.resource.status]?.label ?? "Uploaded"}
                            </span>
                        ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <AlertCircle className="size-2.5" />
                                File Missing
                            </span>
                        )}
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs font-medium text-starlight-200">
                            Required: <span className="text-gold-300 font-semibold">{week.requiredFileLabel}</span>
                        </p>
                        <p className="text-[11px] text-starlight-400">
                            Every student must submit this file before locking the week. PDF or ZIP, max 5MB.
                        </p>
                    </div>

                    {/* Existing Upload Preview */}
                    {week.resource && week.resource.fileUrl && (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-space-950/70 p-3 border border-border/60 text-xs">
                            <div className="flex items-center gap-2 truncate text-starlight-200">
                                <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                                <span className="truncate">Deliverable on File</span>
                                {week.resource.submittedAt && (
                                    <span className="font-mono text-[10px] text-starlight-400 hidden sm:inline">
                                        ({formatDateTime(week.resource.submittedAt)})
                                    </span>
                                )}
                            </div>

                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isDownloadingDeliverable}
                                onClick={() => handleDownloadDeliverable(week.resource!.fileUrl!)}
                                className="h-7 text-xs border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 shrink-0"
                            >
                                <Download className="size-3 mr-1" />
                                {isDownloadingDeliverable ? "Loading..." : "Download"}
                            </Button>
                        </div>
                    )}

                    {/* Upload / Replace Form */}
                    {week.canWrite && (
                        <form onSubmit={handleUploadDeliverable} className="space-y-3 pt-1">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    accept=".pdf,.zip,application/pdf,application/zip,application/x-zip-compressed"
                                    onChange={(e) => setDeliverableFile(e.target.files?.[0] ?? null)}
                                    className="border-border/70 bg-space-950 text-starlight-200 text-xs h-9 cursor-pointer file:text-xs file:font-semibold file:bg-space-850 file:text-gold-300 file:border-0 file:rounded-md file:mr-2"
                                />

                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isUploadingDeliverable || !deliverableFile}
                                    className="h-9 px-4 text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-space-950 rounded-xl shadow-gold shrink-0 transition-all"
                                >
                                    {isUploadingDeliverable ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <UploadCloud className="size-3.5 mr-1" />
                                            {week.resource ? "Replace" : "Upload"}
                                        </>
                                    )}
                                </Button>
                            </div>

                            {deliverableError && (
                                <p className="text-xs text-red-400">{deliverableError}</p>
                            )}
                            {deliverableSuccess && (
                                <p className="text-xs text-emerald-400">{deliverableSuccess}</p>
                            )}
                        </form>
                    )}
                </div>

                {/* 2. Week Lock Control Card */}
                <div className="rounded-2xl border border-border/80 bg-space-900/80 p-5 md:p-6 space-y-4 shadow-md backdrop-blur-md flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <div className="flex items-center gap-2">
                                <Lock className="size-4 text-gold-400" />
                                <h3 className="font-display text-sm font-bold text-starlight-100">
                                    Final Week Lock & Submission
                                </h3>
                            </div>

                            {week.isLocked ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                    Locked
                                </span>
                            ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-850 text-starlight-300 border border-border/60">
                                    Open For Edits
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 mt-3">
                            <p className="text-xs text-starlight-300 leading-relaxed">
                                {week.isLocked
                                    ? `This week was locked on ${
                                          week.resource?.lockedAt
                                              ? formatDateTime(week.resource.lockedAt)
                                              : "record"
                                      }. All saved drafts were finalized and sent to your instructor.`
                                    : "Locking the week finalizes and submits all your task drafts simultaneously. No further changes or file replacements can be made after locking."}
                            </p>

                            {!week.isLocked && (
                                <div className="flex items-center gap-3 text-xs text-starlight-400 pt-1 font-mono">
                                    <span>{draftsCount} Draft(s) Ready</span>
                                    <span>·</span>
                                    <span>{submittedCount} Submitted</span>
                                    <span>·</span>
                                    <span>{week.tasks.length} Total Tasks</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lock Button / Banner */}
                    <div className="pt-2">
                        {week.isLocked ? (
                            <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-3 text-center text-xs text-gold-300 font-semibold flex items-center justify-center gap-2">
                                <CheckCircle2 className="size-4 text-gold-400" />
                                <span>Week Finalized & Submitted for Grading</span>
                            </div>
                        ) : week.status === "ongoing" ? (
                            <div>
                                <Button
                                    type="button"
                                    onClick={() => setIsLockModalOpen(true)}
                                    disabled={!week.resource || isLocking}
                                    className="w-full bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-space-950 font-extrabold rounded-xl text-xs h-10 shadow-gold transition-all disabled:opacity-50"
                                >
                                    <Lock className="size-4 mr-1.5" />
                                    Lock Week & Finalize All Submissions
                                </Button>

                                {!week.resource && (
                                    <p className="text-[11px] text-amber-400/90 text-center mt-2 flex items-center justify-center gap-1">
                                        <AlertCircle className="size-3" />
                                        Upload the mandatory deliverable above to unlock this button.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border/60 bg-space-950/60 p-3 text-center text-xs text-starlight-400">
                                Week ended. Submissions are finalized for instructor grading.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tasks Stepper & Interactive Detail View */}
            {week.tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-space-900/30 p-10 text-center">
                    <Inbox className="size-8 mx-auto text-starlight-400 mb-2" />
                    <p className="text-sm font-medium text-starlight-300">
                        No Tasks Assigned to This Week Yet
                    </p>
                    <p className="text-xs text-starlight-400 mt-1">
                        Your instructor will publish missions and exercises soon.
                    </p>
                </div>
            ) : (
                <div className="rounded-2xl border border-border/80 bg-space-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
                    {/* Stepper Header */}
                    <div className="border-b border-border/70 bg-space-950/70 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!canGoPrev}
                                onClick={() => setCurrentTaskIndex((i) => i - 1)}
                                className="h-8 px-3 rounded-lg border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 hover:text-gold-300 disabled:opacity-40"
                            >
                                <ChevronLeft className="size-4 mr-1" />
                                <span className="hidden sm:inline">Previous</span>
                            </Button>

                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-gold-400 uppercase tracking-wider">
                                    Mission {currentTaskIndex + 1} of {week.tasks.length}
                                </span>
                                {currentTask.isBonus && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-gold-300 border border-gold-500/30">
                                        <Sparkles className="size-2.5 text-gold-400" />
                                        Bonus
                                    </span>
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!canGoNext}
                                onClick={() => setCurrentTaskIndex((i) => i + 1)}
                                className="h-8 px-3 rounded-lg border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 hover:text-gold-300 disabled:opacity-40"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="size-4 ml-1" />
                            </Button>
                        </div>

                        {/* Direct Task Jump Pills */}
                        {week.tasks.length > 1 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                                {week.tasks.map((task, i) => {
                                    const isSelected = i === currentTaskIndex;
                                    const isSubmitted = task.submission !== null;
                                    const isDraft = task.submission?.status === "DRAFT";
                                    const isFinalSubmitted = task.submission?.status === "SUBMITTED";
                                    const isGraded = task.submission?.grade !== null;

                                    return (
                                        <button
                                            key={task.id}
                                            type="button"
                                            onClick={() => setCurrentTaskIndex(i)}
                                            className={`
                                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border
                                                ${
                                                    isSelected
                                                        ? "bg-gold-500/20 text-gold-300 border-gold-500/50 shadow-gold"
                                                        : "bg-space-850/80 text-starlight-400 border-border/60 hover:text-starlight-200 hover:bg-space-800"
                                                }
                                            `}
                                        >
                                            <span className="font-mono text-[11px] font-bold">
                                                #{i + 1}
                                            </span>
                                            <span className="max-w-[120px] truncate">{task.title}</span>

                                            {isGraded ? (
                                                <span className="size-2 rounded-full bg-gold-400" />
                                            ) : isFinalSubmitted ? (
                                                <span className="size-2 rounded-full bg-emerald-400" />
                                            ) : isDraft ? (
                                                <span className="size-2 rounded-full bg-cyan-400" />
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Task Content Card */}
                    <div className="p-5 md:p-8">
                        <WeekTaskDetailCard
                            studentId={studentId}
                            task={currentTask}
                            canWrite={week.canWrite}
                            beginnerSt={week.beginnerSt}
                            weekId={week.id}
                        />
                    </div>
                </div>
            )}

            {/* Lock Confirmation Dialog */}
            <Dialog open={isLockModalOpen} onOpenChange={setIsLockModalOpen}>
                <DialogContent className="border border-border/80 bg-space-950 sm:max-w-md text-starlight-100">
                    <DialogHeader>
                        <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
                            <Lock className="size-5 text-gold-400" />
                            Lock Week & Finalize Submissions?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-starlight-300 mt-2 space-y-2">
                            <p>
                                Are you sure you are ready to lock this week?
                            </p>
                            <p className="text-starlight-400">
                                • All tasks with a saved draft will be converted to <strong className="text-emerald-300">SUBMITTED</strong>.
                                <br />
                                • Tasks without drafts will count as unsubmitted.
                                <br />
                                • Once locked, you <strong className="text-red-300">cannot make further edits</strong> or replace files.
                            </p>
                        </DialogDescription>
                    </DialogHeader>

                    {lockError && (
                        <p className="text-xs text-red-400 text-center">{lockError}</p>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isLocking}
                            onClick={() => setIsLockModalOpen(false)}
                            className="rounded-xl border-border bg-space-850 hover:bg-space-800 text-starlight-300 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isLocking}
                            onClick={handleConfirmLockWeek}
                            className="rounded-xl bg-gold-500 hover:bg-gold-400 text-space-950 font-bold text-xs shadow-gold"
                        >
                            {isLocking ? (
                                <>
                                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                                    Locking Week...
                                </>
                            ) : (
                                "Yes, Lock and Finalize"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
