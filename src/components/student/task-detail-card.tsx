// src/components/student/task-detail-card.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    FileText,
    HelpCircle,
    KeyRound,
    Lightbulb,
    Lock,
    Send,
    Sparkles,
    Trophy,
    UploadCloud,
    MessageSquareQuote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { unlockHintAction } from "@/lib/actions/st-economy";
import {
    submitTextOrLinkAction,
    submitFileAction,
    getSubmissionFileUrlAction,
} from "@/lib/actions/submission-management";
import { MarkdownContent } from "@/components/markdown-content";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { HintUnlockDialog, type HintToUnlock } from "@/components/student/hint-unlock-dialog";
import type { StudentTaskView, StudentHintView } from "@/lib/data/get-student-level";
import type { SubmissionModeCode } from "@/types/types";
import { formatDateTime } from "@/lib/format-date";

// ============================================
// TASK DETAIL (title/description/deadline + Hints + Submission)
// ============================================

export function TaskDetailCard({
    studentId,
    task,
    isHistorical = false,
}: {
    studentId: string;
    task: StudentTaskView;
    isHistorical?: boolean;
}) {
    return (
        <div className="space-y-6">
            {/* Task Header: Title & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/60 pb-5">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-space-850 px-2 py-0.5 font-mono text-[11px] font-semibold text-starlight-300 border border-border/70">
                            {task.type} Task
                        </span>

                        {task.isBonus && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30">
                                <Sparkles className="size-3 text-amber-400" />
                                Bonus Mission
                            </span>
                        )}

                        {task.isDeadlinePassed ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-300 border border-red-500/30">
                                <Clock className="size-3 text-red-400" />
                                Deadline Passed
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-space-850 px-2 py-0.5 text-[11px] font-medium text-starlight-300 border border-border/60">
                                <Calendar className="size-3 text-starlight-400" />
                                Due {formatDateTime(task.deadline)}
                            </span>
                        )}
                    </div>

                    <h2 className="font-display text-xl font-bold text-starlight-100">
                        {task.title}
                    </h2>
                </div>
            </div>

            {/* Task Description (Markdown) */}
            <div className="rounded-xl border border-border/50 bg-space-950/40 p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-starlight-400 mb-3 flex items-center gap-1.5">
                    <FileText className="size-3.5 text-gold-400" />
                    Mission Briefing
                </div>
                <MarkdownContent
                    content={task.description}
                    className="text-starlight-200 text-sm leading-relaxed prose prose-invert max-w-none"
                />
            </div>

            {/* Hints Section */}
            <HintsList
                studentId={studentId}
                hints={task.hints}
                isHistorical={isHistorical}
            />

            {/* Submission Section */}
            {task.type === "INTERNAL" && (
                <SubmissionPanel
                    studentId={studentId}
                    task={task}
                    isHistorical={isHistorical}
                />
            )}
        </div>
    );
}

// ============================================
// HINTS COMPONENT
// ============================================

function HintsList({
    studentId,
    hints,
    isHistorical = false,
}: {
    studentId: string;
    hints: StudentHintView[];
    isHistorical?: boolean;
}) {
    const [hintToUnlock, setHintToUnlock] = useState<HintToUnlock | null>(null);
    const router = useRouter();

    if (hints.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card dark:bg-space-950/50 p-5 shadow-xs">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-gold-500/15 text-gold-600 dark:text-gold-400 border border-gold-500/25">
                        <Lightbulb className="size-4 text-gold-600 dark:text-gold-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground dark:text-starlight-100">
                            Orbital Hints & Intelligence
                        </h3>
                        <p className="text-[11px] text-muted-foreground dark:text-starlight-400">
                            {isHistorical
                                ? "Free to view — archived level study material"
                                : "Unlock tactical hints using your Level Star Tokens"}
                        </p>
                    </div>
                </div>

                <span className="text-xs font-mono text-muted-foreground dark:text-starlight-400">
                    {hints.length} {hints.length === 1 ? "Hint" : "Hints"} Available
                </span>
            </div>

            <div className="space-y-3 pt-2">
                {hints.map((hint) => {
                    const showLocked = !isHistorical && !hint.isUnlocked;

                    if (showLocked) {
                        return (
                            <div
                                key={hint.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 dark:bg-space-900/60 p-4 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted dark:bg-space-850 text-muted-foreground dark:text-starlight-400 border border-border/60">
                                        <Lock className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground dark:text-starlight-200">
                                            Hint #{hint.order}
                                        </p>
                                        <p className="text-xs text-muted-foreground dark:text-starlight-400">
                                            Requires {hint.cost} ST to reveal intelligence
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() =>
                                        setHintToUnlock({
                                            id: hint.id,
                                            order: hint.order,
                                            cost: hint.cost,
                                        })
                                    }
                                    className="h-8 text-xs bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 rounded-xl font-semibold shadow-xs shrink-0 transition-all"
                                >
                                    <KeyRound className="size-3.5 mr-1.5 text-amber-700 dark:text-amber-400" />
                                    Unlock ({hint.cost} ST)
                                </Button>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={hint.id}
                            className="rounded-xl border border-gold-500/30 bg-gradient-to-br from-space-900 to-space-950 p-4 space-y-2 shadow-xs"
                        >
                            <div className="flex items-center justify-between border-b border-gold-500/20 pb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-3.5 text-gold-400" />
                                    <span className="text-xs font-bold text-gold-300">
                                        Hint #{hint.order} — Unlocked
                                    </span>
                                </div>
                                <span className="font-mono text-[10px] text-starlight-400">
                                    Cost: {hint.cost} ST
                                </span>
                            </div>

                            {hint.content && (
                                <MarkdownContent
                                    content={hint.content}
                                    className="text-xs text-starlight-200 leading-relaxed pt-1"
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <HintUnlockDialog
                isOpen={hintToUnlock !== null}
                onClose={() => setHintToUnlock(null)}
                hint={hintToUnlock}
                studentId={studentId}
                onSuccess={() => router.refresh()}
            />
        </div>
    );
}

// ============================================
// SUBMISSION PANEL
// ============================================

function buildFileFormData(taskId: string, file: File): FormData {
    const formData = new FormData();
    formData.set("taskId", taskId);
    formData.set("file", file);
    return formData;
}

function SubmissionPanel({
    studentId,
    task,
    isHistorical = false,
}: {
    studentId: string;
    task: StudentTaskView;
    isHistorical?: boolean;
}) {
    const router = useRouter();
    const submission = task.submission;
    const isGraded = submission?.isGraded ?? false;
    const canEdit =
        !isHistorical && !task.isDeadlinePassed && !(submission?.isLocked ?? false);

    const [mode, setMode] = useState<SubmissionModeCode>(
        task.allowedSubmissionMode ?? submission?.mode ?? "TEXT"
    );
    const [textContent, setTextContent] = useState(submission?.textContent ?? "");
    const [externalLink, setExternalLink] = useState(submission?.externalLink ?? "");
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    async function handleDownload() {
        if (!submission?.fileUrl) return;
        setIsDownloading(true);
        const result = await getSubmissionFileUrlAction(submission.fileUrl);
        setIsDownloading(false);

        if (result.success && result.data) {
            window.open(result.data, "_blank");
        } else {
            setError(result.error ?? "Could not open the file.");
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (mode === "FILE" && !file) {
            setError("Please select a file to submit.");
            return;
        }

        setIsSubmitting(true);

        const result =
            mode === "FILE"
                ? await submitFileAction(buildFileFormData(task.id, file as File))
                : await submitTextOrLinkAction({
                      taskId: task.id,
                      mode: mode as Extract<SubmissionModeCode, "TEXT" | "LINK">,
                      textContent: mode === "TEXT" ? textContent : undefined,
                      externalLink: mode === "LINK" ? externalLink : undefined,
                  });

        setIsSubmitting(false);

        if (result.success) {
            setFile(null);
            router.refresh();
        } else {
            setError(result.error ?? "Something went wrong. Please try again.");
        }
    }

    return (
        <div className="space-y-5 rounded-2xl border border-border/70 bg-space-950/60 p-5 md:p-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        <UploadCloud className="size-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-starlight-100">
                            Mission Submission Station
                        </h3>
                        <p className="text-[11px] text-starlight-400">
                            Deliver your completed code, files, or links for grading
                        </p>
                    </div>
                </div>

                {submission && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="size-3" />
                        Submitted
                    </span>
                )}
            </div>

            {/* Existing Submission Details */}
            {submission && (
                <div className="rounded-xl border border-border/70 bg-space-900/70 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-starlight-400 border-b border-border/50 pb-2">
                        <span>
                            Submitted on {formatDateTime(submission.submittedAt)}
                        </span>
                        <span className="font-mono rounded-md bg-space-850 px-2 py-0.5 text-[11px] text-starlight-300 border border-border/60">
                            Mode: {submission.mode}
                        </span>
                    </div>

                    {submission.mode === "TEXT" && (
                        <div className="rounded-lg bg-space-950 p-3.5 border border-border/60">
                            <pre className="whitespace-pre-wrap font-mono text-xs text-starlight-200 leading-relaxed max-h-60 overflow-y-auto">
                                {submission.textContent}
                            </pre>
                        </div>
                    )}

                    {submission.mode === "LINK" && (
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-space-950 p-3 border border-border/60">
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
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-space-950 p-3 border border-border/60">
                            <div className="flex items-center gap-2 text-xs text-starlight-200">
                                <FileText className="size-4 text-gold-400" />
                                <span>Attached File Submission</span>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="h-8 text-xs border-border/80 hover:bg-space-850"
                            >
                                <Download className="size-3.5 mr-1 text-gold-400" />
                                {isDownloading ? "Opening..." : "Download / View File"}
                            </Button>
                        </div>
                    )}

                    {/* Graded Scorecard */}
                    {isGraded ? (
                        <div className="mt-3 rounded-xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-space-900 to-space-950 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy className="size-4 text-gold-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-gold-400">
                                        Official Rubric Grade
                                    </span>
                                </div>
                                <span className="font-mono text-base font-extrabold text-gold-300">
                                    {submission.totalScore} / 10
                                </span>
                            </div>

                            {submission.instructorComment && (
                                <div className="rounded-lg bg-space-950/70 p-3 border border-border/50 text-xs text-starlight-200 space-y-1">
                                    <div className="flex items-center gap-1.5 text-starlight-400 font-medium">
                                        <MessageSquareQuote className="size-3.5 text-gold-400" />
                                        Instructor Feedback
                                    </div>
                                    <p className="italic text-starlight-300">
                                        &ldquo;{submission.instructorComment}&rdquo;
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : submission.isLocked ? (
                        <div className="rounded-lg bg-space-850/60 p-2.5 text-xs text-starlight-300 flex items-center gap-2 border border-border/50">
                            <Lock className="size-3.5 text-starlight-400" />
                            <span>Locked — Awaiting instructor grading & rubric evaluation.</span>
                        </div>
                    ) : task.isDeadlinePassed ? (
                        <div className="rounded-lg bg-red-950/30 p-2.5 text-xs text-red-300 flex items-center gap-2 border border-red-500/30">
                            <Clock className="size-3.5 text-red-400" />
                            <span>The deadline has passed — this submission is finalized.</span>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Overdue alert if student didn't submit */}
            {!submission && task.isDeadlinePassed && (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-300">
                    <AlertCircle className="size-5 shrink-0 text-red-400" />
                    <div>
                        <p className="text-sm font-semibold">Deadline Elapsed</p>
                        <p className="text-xs text-red-300/80">
                            You did not submit a solution before the session deadline.
                        </p>
                    </div>
                </div>
            )}

            {/* Submission Form */}
            {canEdit && (
                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {task.allowedSubmissionMode ? (
                        <div className="flex items-center gap-2 text-xs text-starlight-300">
                            <span className="text-starlight-400">Required format:</span>
                            <span className="font-mono font-semibold text-gold-400">
                                {task.allowedSubmissionMode}
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label className="text-xs text-starlight-300">
                                Submission Mode
                            </Label>
                            <Select
                                value={mode}
                                onValueChange={(val) => setMode(val as SubmissionModeCode)}
                            >
                                <SelectTrigger className="w-full bg-space-900 border-border/80 text-starlight-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-space-900 border-border text-starlight-100">
                                    <SelectItem value="TEXT">Plain Text / Code snippet</SelectItem>
                                    <SelectItem value="LINK">External Link (GitHub, Figma, etc.)</SelectItem>
                                    <SelectItem value="FILE">File Archive (PDF, ZIP max 5MB)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {mode === "TEXT" && (
                        <div className="space-y-2">
                            <MarkdownEditor
                                label="Solution Text / Code (Markdown supported)"
                                value={textContent}
                                onChange={(val) => setTextContent(val)}
                                placeholder="Paste your solution, code blocks, or explanations here in Markdown..."
                                rows={6}
                                required
                            />
                        </div>
                    )}

                    {mode === "LINK" && (
                        <div className="space-y-2">
                            <Label className="text-xs text-starlight-300">
                                Solution URL
                            </Label>
                            <Input
                                type="url"
                                value={externalLink}
                                onChange={(e) => setExternalLink(e.target.value)}
                                placeholder="https://github.com/..."
                                className="bg-space-900 border-border/80 text-starlight-100 text-xs focus-visible:ring-gold-500"
                                required
                            />
                        </div>
                    )}

                    {mode === "FILE" && (
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground dark:text-starlight-300">
                                Solution File (.pdf or .zip, max 5MB)
                            </Label>
                            <FileDropzone
                                file={file}
                                onFileSelect={setFile}
                                accept=".pdf,.zip,application/pdf,application/zip"
                                maxSizeMB={5}
                                disabled={isSubmitting}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-950/40 p-3 text-xs text-red-300 border border-red-500/30">
                            <AlertCircle className="size-4 shrink-0 text-red-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold text-xs shadow-gold transition-all"
                    >
                        <Send className="size-3.5 mr-1.5" />
                        {isSubmitting
                            ? "Transmitting..."
                            : submission
                            ? "Resubmit Solution"
                            : "Submit Solution"}
                    </Button>
                </form>
            )}
        </div>
    );
}