// src/app/student/weeks/[id]/student-week-detail-view.tsx
// Interactive view for a Beginner Student's Week:
//   - Header with dates & YouTube lecture playlist link
//   - Mandatory Deliverable Card (File upload with strict 1 MiB limit + real progress OR Google Drive link)
//   - Week Lock Control (with authoritative dual-condition validation: deliverable + all tasks completed)
//   - Interactive Task Pager with custom rubrics, hints & draft submissions

"use client";

import { useState, useRef, useCallback } from "react";
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
    Link2,
    X,
    RotateCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    WeekTaskDetailCard,
    getSavedDraftValues,
    type TaskWorkspaceState,
} from "@/components/student/week-task-detail-card";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
    lockWeekAction,
    saveWeekDriveLinkAction,
} from "@/lib/actions/week-submission";
import { getSubmissionFileUrlAction } from "@/lib/actions/submission-management";
import type { StudentWeekDetail } from "@/lib/data/get-student-weeks";
import type { WeekStatus } from "@/lib/data/get-my-groups";
import {
    WEEK_RESOURCE_MAX_FILE_SIZE_BYTES,
    type WeekResourceStatusCode,
} from "@/types/types";
import { formatDateTime } from "@/lib/format-date";
import {
    getResourceSubmissionState,
    hasValidResourceSubmission,
    hasValidTaskSubmissionContent,
} from "@/lib/weeks/resource-eligibility";
import { validateGoogleDriveUrl } from "@/lib/weeks/validate-drive-url";

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
        label: "Deliverable Submitted (Pending Review)",
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

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type SubmissionMethod = "FILE" | "DRIVE_LINK";
type UploadState = "idle" | "selected" | "uploading" | "succeeded" | "failed" | "canceled";

export function StudentWeekDetailView({
    week,
    studentId,
}: {
    week: StudentWeekDetail;
    studentId: string;
}) {
    const router = useRouter();
    const statusConfig = STATUS_CONFIG[week.status];

    // Method selection (FILE or DRIVE_LINK)
    const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>(
        week.resource?.type === "DRIVE_LINK" ? "DRIVE_LINK" : "FILE"
    );

    // File upload state with real XHR progress
    const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [deliverableError, setDeliverableError] = useState<string | null>(null);
    const [deliverableSuccess, setDeliverableSuccess] = useState<string | null>(null);
    const [isDownloadingDeliverable, setIsDownloadingDeliverable] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const activeXhrRef = useRef<XMLHttpRequest | null>(null);

    // Google Drive link state
    const [driveUrlInput, setDriveUrlInput] = useState(week.resource?.driveUrl ?? "");
    const [isSavingDrive, setIsSavingDrive] = useState(false);
    const [driveError, setDriveError] = useState<string | null>(null);
    const [driveSuccess, setDriveSuccess] = useState<string | null>(null);

    // Week Lock state
    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [isLocking, setIsLocking] = useState(false);
    const [lockError, setLockError] = useState<string | null>(null);

    // Task Stepper state
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

    // Unsaved per-task workspace (Markdown answer / external link / chosen mode),
    // keyed by the stable task.id. Memory only: lost on refresh by design.
    const [taskWorkspaces, setTaskWorkspaces] = useState<Record<string, TaskWorkspaceState>>({});
    const updateTaskWorkspace = useCallback(
        (taskId: string, patch: Partial<TaskWorkspaceState>) => {
            setTaskWorkspaces((prev) => ({
                ...prev,
                [taskId]: { ...prev[taskId], ...patch },
            }));
        },
        []
    );

    // Warn on refresh/close/navigation if ANY task has unsaved text, link or selected file.
    const hasUnsavedTaskWork =
        week.canWrite &&
        week.tasks.some((t) => {
            const ws = taskWorkspaces[t.id];
            if (!ws) return false;
            const saved = getSavedDraftValues(t);
            const text = (ws.text ?? "").trim();
            const link = (ws.link ?? "").trim();
            return (
                ws.file != null ||
                (ws.text !== undefined && text !== saved.text.trim() && text.length > 0) ||
                (ws.link !== undefined && link !== saved.link.trim() && link.length > 0)
            );
        });
    useUnsavedChanges(hasUnsavedTaskWork);

    // Resource state calculation
    const resState = getResourceSubmissionState(week.resource);
    const hasDeliverable = hasValidResourceSubmission(week.resource);

    // Task completion calculation (Condition 2)
    const internalTasks = week.tasks.filter((t) => t.type === "INTERNAL");
    const completedTasks = internalTasks.filter((t) =>
        hasValidTaskSubmissionContent(t.submission)
    );
    const allTasksCompleted =
        internalTasks.length > 0 ? completedTasks.length === internalTasks.length : true;
    const unsolvedCount = internalTasks.length - completedTasks.length;

    const isUploading = uploadState === "uploading";

    // Locking eligibility check
    const canLock =
        hasDeliverable &&
        allTasksCompleted &&
        !isUploading &&
        week.status === "ongoing" &&
        !week.isLocked &&
        !isLocking;

    let lockDisabledReason: string | null = null;
    if (week.isLocked) {
        lockDisabledReason = "This week is already locked and submitted.";
    } else if (week.status !== "ongoing") {
        lockDisabledReason = "This week has ended. Submissions are finalized.";
    } else if (isUploading) {
        lockDisabledReason = "Your deliverable file is currently uploading...";
    } else if (!hasDeliverable && !allTasksCompleted) {
        lockDisabledReason =
            "Upload a deliverable and complete all tasks before locking this week.";
    } else if (!hasDeliverable) {
        lockDisabledReason = "Upload a file or submit a Google Drive link first.";
    } else if (!allTasksCompleted) {
        lockDisabledReason = `Complete all tasks before locking this week (${unsolvedCount} remaining).`;
    }

    // Handle File Selection
    function handleFileSelected(file: File | null) {
        if (!file) {
            setDeliverableFile(null);
            setUploadState("idle");
            return;
        }

        // Strict 1 MiB limit validation before upload
        if (file.size > WEEK_RESOURCE_MAX_FILE_SIZE_BYTES) {
            const sizeStr = formatBytes(file.size);
            const err = `File size (${sizeStr}) exceeds the strict 1 MB limit. Please select a smaller file.`;
            setDeliverableError(err);
            setDeliverableFile(null);
            setUploadState("failed");
            showToast({
                title: "File Exceeds 1 MB Limit",
                description: err,
                type: "error",
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const allowedMimes = [
            "application/pdf",
            "application/zip",
            "application/x-zip-compressed",
        ];
        const isPdfOrZip =
            allowedMimes.includes(file.type) ||
            file.name.toLowerCase().endsWith(".pdf") ||
            file.name.toLowerCase().endsWith(".zip");

        if (!isPdfOrZip) {
            const err = "Only PDF and ZIP files are accepted.";
            setDeliverableError(err);
            setDeliverableFile(null);
            setUploadState("failed");
            showToast({
                title: "Invalid File Type",
                description: err,
                type: "error",
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setDeliverableFile(file);
        setDeliverableError(null);
        setDeliverableSuccess(null);
        setUploadState("selected");
    }

    // Real XHR Upload with Byte Progress
    function handleStartUpload() {
        if (!deliverableFile) {
            setDeliverableError("Please select a file to upload.");
            return;
        }

        if (deliverableFile.size > WEEK_RESOURCE_MAX_FILE_SIZE_BYTES) {
            setDeliverableError("File exceeds the strict 1 MB limit.");
            return;
        }

        setUploadState("uploading");
        setUploadProgress(0);
        setDeliverableError(null);
        setDeliverableSuccess(null);

        const xhr = new XMLHttpRequest();
        activeXhrRef.current = xhr;

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
                const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
                setUploadProgress(percent);
            }
        };

        xhr.onload = () => {
            activeXhrRef.current = null;
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const res = JSON.parse(xhr.responseText);
                    if (res.success) {
                        setUploadState("succeeded");
                        setUploadProgress(100);
                        setDeliverableSuccess("Deliverable file uploaded successfully!");
                        showToast({
                            title: "Deliverable Uploaded",
                            description: "Your week deliverable file has been uploaded.",
                            type: "success",
                        });
                        setDeliverableFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        router.refresh();
                    } else {
                        setUploadState("failed");
                        const msg = res.error ?? "Failed to upload deliverable file.";
                        setDeliverableError(msg);
                        showToast({
                            title: "Upload Failed",
                            description: msg,
                            type: "error",
                        });
                    }
                } catch {
                    setUploadState("failed");
                    setDeliverableError("Could not parse server response.");
                }
            } else {
                setUploadState("failed");
                let errorMsg = "Upload failed.";
                try {
                    const res = JSON.parse(xhr.responseText);
                    if (res.error) errorMsg = res.error;
                } catch {
                    errorMsg = `Server responded with status ${xhr.status}.`;
                }
                setDeliverableError(errorMsg);
                showToast({
                    title: "Upload Failed",
                    description: errorMsg,
                    type: "error",
                });
            }
        };

        xhr.onerror = () => {
            activeXhrRef.current = null;
            setUploadState("failed");
            const err = "Network failure during upload. Please verify your connection and retry.";
            setDeliverableError(err);
            showToast({
                title: "Upload Network Error",
                description: err,
                type: "error",
            });
        };

        xhr.onabort = () => {
            activeXhrRef.current = null;
            setUploadState("canceled");
            setDeliverableError("Upload was canceled.");
        };

        const formData = new FormData();
        formData.append("file", deliverableFile);

        xhr.open("POST", `/api/student/weeks/${week.id}/resource/upload`);
        xhr.send(formData);
    }

    // Cancel in-flight upload
    function handleCancelUpload() {
        if (activeXhrRef.current) {
            activeXhrRef.current.abort();
            activeXhrRef.current = null;
        }
    }

    // Save Google Drive Link
    async function handleSaveDriveLink(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = driveUrlInput.trim();
        if (!trimmed) {
            setDriveError("Please enter a Google Drive link.");
            return;
        }

        const validation = validateGoogleDriveUrl(trimmed);
        if (!validation.valid || !validation.normalizedUrl) {
            const err = validation.error ?? "Invalid Google Drive link.";
            setDriveError(err);
            showToast({
                title: "Invalid Google Drive URL",
                description: err,
                type: "error",
            });
            return;
        }

        setIsSavingDrive(true);
        setDriveError(null);
        setDriveSuccess(null);

        try {
            const res = await saveWeekDriveLinkAction({
                weekId: week.id,
                driveUrl: validation.normalizedUrl,
            });

            if (!res.success) {
                const msg = res.error ?? "Failed to save Google Drive link.";
                setDriveError(msg);
                showToast({
                    title: "Save Failed",
                    description: msg,
                    type: "error",
                });
            } else {
                setDriveSuccess("Google Drive link saved successfully!");
                showToast({
                    title: "Google Drive Link Saved",
                    description: "Your Google Drive deliverable link has been submitted.",
                    type: "success",
                });
                router.refresh();
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unexpected error.";
            setDriveError(msg);
            showToast({
                title: "Save Error",
                description: msg,
                type: "error",
            });
        } finally {
            setIsSavingDrive(false);
        }
    }

    // Test Google Drive link
    function handleTestDriveLink() {
        const trimmed = driveUrlInput.trim();
        if (!trimmed) {
            setDriveError("Please enter a Google Drive link first.");
            return;
        }
        const validation = validateGoogleDriveUrl(trimmed);
        if (!validation.valid || !validation.normalizedUrl) {
            setDriveError(validation.error ?? "Invalid Google Drive link.");
            return;
        }
        window.open(validation.normalizedUrl, "_blank", "noopener,noreferrer");
    }

    // Download Existing Deliverable File
    async function handleDownloadDeliverable(fileUrl: string) {
        setIsDownloadingDeliverable(true);
        try {
            const res = await getSubmissionFileUrlAction(fileUrl);
            if (res.success && res.data) {
                window.open(res.data, "_blank", "noopener,noreferrer");
            } else {
                showToast({
                    title: "Download Error",
                    description: res.error ?? "Could not generate download link.",
                    type: "error",
                });
            }
        } catch (err) {
            showToast({
                title: "Download Error",
                description: err instanceof Error ? err.message : "Error generating download link.",
                type: "error",
            });
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
                showToast({
                    title: "Week Locked",
                    description: "All tasks and deliverable finalized for grading.",
                    type: "success",
                });
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

                        {hasDeliverable ? (
                            <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${RESOURCE_STATUS_CONFIG[week.resource!.status]?.badgeClassName ??
                                    "bg-space-800 text-starlight-300"
                                    }`}
                            >
                                {RESOURCE_STATUS_CONFIG[week.resource!.status]?.label ?? "Submitted"}
                            </span>
                        ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <AlertCircle className="size-2.5" />
                                Deliverable Missing
                            </span>
                        )}
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs font-medium text-starlight-200">
                            Required: <span className="text-gold-300 font-semibold">{week.requiredFileLabel}</span>
                        </p>
                        <p className="text-[11px] text-starlight-400">
                            Every student must submit this deliverable before locking the week. Choose either a direct file upload (max 1 MB) or a Google Drive sharing link.
                        </p>
                    </div>

                    {/* Active Submitted Deliverable Display */}
                    {hasDeliverable && (
                        <div className="rounded-xl bg-space-950/70 p-3.5 border border-border/60 text-xs space-y-2">
                            {resState.state === "VALID_FILE" && (
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 text-starlight-200">
                                        <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                                        <div className="truncate">
                                            <span className="font-semibold text-xs">File on Record</span>
                                            {resState.submittedAt && (
                                                <span className="font-mono text-[10px] text-starlight-400 ml-2 hidden sm:inline">
                                                    ({formatDateTime(resState.submittedAt)})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={isDownloadingDeliverable}
                                        onClick={() => handleDownloadDeliverable(resState.fileUrl)}
                                        className="h-7 text-xs border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 shrink-0"
                                    >
                                        <Download className="size-3 mr-1" />
                                        {isDownloadingDeliverable ? "Loading..." : "Download"}
                                    </Button>
                                </div>
                            )}

                            {resState.state === "VALID_DRIVE_LINK" && (
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 text-starlight-200">
                                        <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                                        <div className="truncate max-w-xs sm:max-w-md">
                                            <span className="font-semibold text-xs">Google Drive Link on Record</span>
                                            <div className="text-[11px] text-gold-400 truncate font-mono">
                                                {resState.driveUrl}
                                            </div>
                                        </div>
                                    </div>

                                    <a
                                        href={resState.driveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center h-7 px-2.5 text-xs border border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 rounded-md shrink-0 font-medium transition-colors"
                                    >
                                        <ExternalLink className="size-3 mr-1" />
                                        Open Link
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Method Selector & Input Form (only when editable) */}
                    {week.canWrite && (
                        <div className="space-y-3 pt-1">
                            {/* Method Switcher Tabs */}
                            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-space-950/80 border border-border/60">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isUploading) return;
                                        setSubmissionMethod("FILE");
                                    }}
                                    disabled={isUploading}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${submissionMethod === "FILE"
                                        ? "bg-gold-500 text-space-950 shadow-gold"
                                        : "text-starlight-300 hover:text-starlight-100 hover:bg-space-850"
                                        }`}
                                >
                                    <UploadCloud className="size-3.5" />
                                    <span>Upload File (Max 1 MB)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isUploading) return;
                                        setSubmissionMethod("DRIVE_LINK");
                                    }}
                                    disabled={isUploading}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${submissionMethod === "DRIVE_LINK"
                                        ? "bg-gold-500 text-space-950 shadow-gold"
                                        : "text-starlight-300 hover:text-starlight-100 hover:bg-space-850"
                                        }`}
                                >
                                    <Link2 className="size-3.5" />
                                    <span>Google Drive Link</span>
                                </button>
                            </div>

                            {/* Mutual exclusion replacement warning */}
                            {resState.state === "VALID_DRIVE_LINK" && submissionMethod === "FILE" && (
                                <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-center gap-1.5">
                                    <AlertCircle className="size-3.5 shrink-0 text-amber-400" />
                                    Uploading a file will replace your previously submitted Google Drive link.
                                </p>
                            )}

                            {resState.state === "VALID_FILE" && submissionMethod === "DRIVE_LINK" && (
                                <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-center gap-1.5">
                                    <AlertCircle className="size-3.5 shrink-0 text-amber-400" />
                                    Submitting a Google Drive link will replace your previously uploaded file deliverable.
                                </p>
                            )}

                            {/* Method 1: File Upload */}
                            {submissionMethod === "FILE" && (
                                <div className="space-y-3">
                                    <div
                                        onClick={() => {
                                            if (!isUploading && fileInputRef.current) {
                                                fileInputRef.current.click();
                                            }
                                        }}
                                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${isUploading
                                            ? "border-gold-500/40 bg-gold-500/5 cursor-not-allowed"
                                            : deliverableFile
                                                ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                                                : "border-border/70 bg-space-950/40 hover:border-gold-500/40 hover:bg-space-850/50"
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.zip,application/pdf,application/zip,application/x-zip-compressed"
                                            className="hidden"
                                            disabled={isUploading}
                                            onChange={(e) => {
                                                const f = e.target.files?.[0] ?? null;
                                                handleFileSelected(f);
                                            }}
                                        />

                                        {deliverableFile ? (
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-emerald-300 truncate">
                                                    {deliverableFile.name}
                                                </p>
                                                <p className="text-[11px] text-starlight-400 font-mono">
                                                    Size: {formatBytes(deliverableFile.size)} / Max 1.0 MB (1,048,576 bytes)
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <UploadCloud className="size-6 text-gold-400 mx-auto mb-1" />
                                                <p className="text-xs font-semibold text-starlight-200">
                                                    Click to select your deliverable file
                                                </p>
                                                <p className="text-[11px] text-starlight-400 font-mono">
                                                    Strict limit: exactly 1 MiB · PDF or ZIP
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Progress Bar */}
                                    {isUploading && (
                                        <div className="space-y-1.5 p-3 rounded-xl bg-space-950 border border-gold-500/30">
                                            <div className="flex items-center justify-between text-xs font-mono">
                                                <span className="text-gold-300 flex items-center gap-1.5">
                                                    <Loader2 className="size-3 animate-spin text-gold-400" />
                                                    Uploading: {uploadProgress}%
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleCancelUpload}
                                                    className="h-6 px-2 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                >
                                                    <X className="size-3 mr-1" />
                                                    Cancel
                                                </Button>
                                            </div>
                                            <div className="w-full bg-space-850 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-gold-500 to-gold-400 h-full transition-all duration-150 ease-out"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload action buttons */}
                                    <div className="flex items-center justify-end gap-2">
                                        {uploadState === "failed" && deliverableFile && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={handleStartUpload}
                                                className="h-8 px-3 text-xs border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 rounded-xl"
                                            >
                                                <RotateCw className="size-3 mr-1" />
                                                Retry Upload
                                            </Button>
                                        )}

                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={isUploading || !deliverableFile}
                                            onClick={handleStartUpload}
                                            className="h-8 px-4 text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-space-950 rounded-xl shadow-gold shrink-0 transition-all disabled:opacity-50"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="size-3 mr-1.5 animate-spin" />
                                                    Uploading ({uploadProgress}%)
                                                </>
                                            ) : (
                                                <>
                                                    <UploadCloud className="size-3.5 mr-1.5" />
                                                    {resState.state === "VALID_FILE"
                                                        ? "Replace File Deliverable"
                                                        : "Upload Deliverable"}
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
                                </div>
                            )}

                            {/* Method 2: Google Drive Link */}
                            {submissionMethod === "DRIVE_LINK" && (
                                <form onSubmit={handleSaveDriveLink} className="space-y-3">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] text-starlight-400">
                                            <span>Google Drive / Google Docs Sharing URL</span>
                                            {/* <span>HTTPS only</span> */}
                                        </div>

                                        <Input
                                            type="url"
                                            value={driveUrlInput}
                                            onChange={(e) => {
                                                setDriveUrlInput(e.target.value);
                                                setDriveError(null);
                                                setDriveSuccess(null);
                                            }}
                                            placeholder="https://drive.google.com/file/d/.../view"
                                            disabled={isSavingDrive}
                                            className="h-9 text-xs bg-space-950 border-border/70 rounded-xl text-starlight-100 placeholder:text-starlight-500"
                                        />

                                        <p className="text-[11px] text-starlight-400/90">
                                            Important: Ensure Google Drive permissions are set to{" "}
                                            <span className="text-gold-300 font-semibold">"Anyone with the link can view"</span> so your instructor can review your work.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={handleTestDriveLink}
                                            disabled={!driveUrlInput.trim()}
                                            className="h-8 px-3 text-xs border-border/70 bg-space-850 hover:bg-space-800 text-starlight-200 rounded-xl"
                                        >
                                            <ExternalLink className="size-3 mr-1" />
                                            Test Link
                                        </Button>

                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={isSavingDrive || !driveUrlInput.trim()}
                                            className="h-8 px-4 text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-space-950 rounded-xl shadow-gold transition-all disabled:opacity-50"
                                        >
                                            {isSavingDrive ? (
                                                <>
                                                    <Loader2 className="size-3 mr-1.5 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Link2 className="size-3.5 mr-1.5" />
                                                    {resState.state === "VALID_DRIVE_LINK"
                                                        ? "Update Drive Link"
                                                        : "Save Drive Link"}
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {driveError && (
                                        <p className="text-xs text-red-400">{driveError}</p>
                                    )}
                                    {driveSuccess && (
                                        <p className="text-xs text-emerald-400">{driveSuccess}</p>
                                    )}
                                </form>
                            )}
                        </div>
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

                        <div className="space-y-3 mt-3">
                            <p className="text-xs text-starlight-300 leading-relaxed">
                                {week.isLocked
                                    ? `This week was locked on ${week.resource?.lockedAt
                                        ? formatDateTime(week.resource.lockedAt)
                                        : "record"
                                    }. All saved drafts were finalized and sent to your instructor.`
                                    : "Locking the week finalizes and submits all your task drafts and your deliverable simultaneously. No further changes can be made after locking."}
                            </p>

                            {/* Dual Condition Completion Checklist */}
                            {!week.isLocked && (
                                <div className="rounded-xl bg-space-950/70 p-3.5 border border-border/70 space-y-2 text-xs">
                                    <div className="font-semibold text-starlight-200 text-[11px] uppercase tracking-wider">
                                        Lock Requirements Checklist
                                    </div>

                                    {/* Requirement 1: Deliverable */}
                                    <div className="flex items-center gap-2 text-xs">
                                        {hasDeliverable ? (
                                            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                                        ) : (
                                            <AlertCircle className="size-4 text-amber-400 shrink-0" />
                                        )}
                                        <span className={hasDeliverable ? "text-success-400" : "text-error-400"}>
                                            {hasDeliverable
                                                ? `Deliverable submitted (${resState.state === "VALID_DRIVE_LINK"
                                                    ? "Google Drive Link"
                                                    : "Uploaded File"
                                                })`
                                                : "Weekly deliverable missing (File or Drive link required)"}
                                        </span>
                                    </div>

                                    {/* Requirement 2: All Tasks Completed */}
                                    <div className="flex items-center gap-2 text-xs">
                                        {allTasksCompleted ? (
                                            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                                        ) : (
                                            <AlertCircle className="size-4 text-amber-400 shrink-0" />
                                        )}
                                        <span className={allTasksCompleted ? "text-starlight-200" : "text-error-400"}>
                                            {allTasksCompleted
                                                ? `All tasks completed (${completedTasks.length}/${internalTasks.length} solved)`
                                                : `All tasks must be completed (${unsolvedCount} remaining)`}
                                        </span>
                                    </div>
                                </div>
                            )}

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
                                    disabled={!canLock}
                                    className="w-full bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-space-950 font-extrabold rounded-xl text-xs h-10 shadow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Lock className="size-4 mr-1.5" />
                                    Lock Week & Finalize All Submissions
                                </Button>

                                {lockDisabledReason && !week.isLocked && (
                                    <p className="text-[11px] text-amber-400/90 text-center mt-2 flex items-center justify-center gap-1.5">
                                        <AlertCircle className="size-3 shrink-0" />
                                        {lockDisabledReason}
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
                                                ${isSelected
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
                            key={currentTask.id}
                            workspace={taskWorkspaces[currentTask.id]}
                            onWorkspaceChange={(patch) =>
                                updateTaskWorkspace(currentTask.id, patch)
                            }
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
                                Are you sure you want to permanently lock this week?
                            </p>
                            <p className="text-amber-400/90 font-medium">
                                Once locked, all your saved task drafts and your deliverable will be submitted to your instructor for grading. You will NOT be able to make any further edits or file replacements.
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
