// src/components/student/week-task-detail-card.tsx
// Component for rendering a BEGINNER task's details: briefing, custom rubric criteria,
// hints with ST unlock flow, and draft saving (FILE/LINK/TEXT).

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    FileText,
    KeyRound,
    Lightbulb,
    Lock,
    Save,
    Sparkles,
    Trophy,
    UploadCloud,
    MessageSquareQuote,
    Layers,
    Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { unlockHintAction } from "@/lib/actions/st-economy";
import {
    saveDraftTextOrLinkAction,
    saveDraftFileAction,
} from "@/lib/actions/week-submission";
import { getSubmissionFileUrlAction } from "@/lib/actions/submission-management";
import { MarkdownContent } from "@/components/markdown-content";
import type { StudentWeekDetailTask } from "@/lib/data/get-student-weeks";
import type { SubmissionModeCode } from "@/types/types";
import { formatDateTime } from "@/lib/format-date";

export function WeekTaskDetailCard({
    studentId,
    task,
    canWrite,
    beginnerSt,
    weekId,
}: {
    studentId: string;
    task: StudentWeekDetailTask;
    canWrite: boolean;
    beginnerSt: number;
    weekId: string;
}) {
    const router = useRouter();

    // Mode selection state
    const allowedMode = task.allowedSubmissionMode;
    const defaultMode: SubmissionModeCode =
        allowedMode ?? task.submission?.mode ?? "FILE";
    const [selectedMode, setSelectedMode] = useState<SubmissionModeCode>(defaultMode);

    // Draft form inputs
    const [textInput, setTextInput] = useState(
        task.submission?.mode === "TEXT" ? task.submission.textContent ?? "" : ""
    );
    const [linkInput, setLinkInput] = useState(
        task.submission?.mode === "LINK" ? task.submission.externalLink ?? "" : ""
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Async states
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
    const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

    // Download state
    const [isDownloading, setIsDownloading] = useState(false);

    // Hint unlock modal state
    const [hintToUnlock, setHintToUnlock] = useState<{
        id: string;
        order: number;
        cost: number;
    } | null>(null);
    const [isUnlockingHint, setIsUnlockingHint] = useState(false);
    const [hintError, setHintError] = useState<string | null>(null);

    // Handle Save Draft
    async function handleSaveDraft(e: React.FormEvent) {
        e.preventDefault();
        setSaveErrorMsg(null);
        setSaveSuccessMsg(null);
        setIsSavingDraft(true);

        try {
            if (selectedMode === "FILE") {
                if (!selectedFile) {
                    setSaveErrorMsg("Please choose a PDF or ZIP file to upload.");
                    setIsSavingDraft(false);
                    return;
                }
                const formData = new FormData();
                formData.append("taskId", task.id);
                formData.append("file", selectedFile);

                const res = await saveDraftFileAction(formData);
                if (!res.success) {
                    setSaveErrorMsg(res.error ?? "Failed to save file draft.");
                } else {
                    setSaveSuccessMsg("Draft file saved successfully!");
                    setSelectedFile(null);
                    router.refresh();
                }
            } else if (selectedMode === "LINK") {
                if (!linkInput.trim()) {
                    setSaveErrorMsg("Please enter a valid URL.");
                    setIsSavingDraft(false);
                    return;
                }
                const res = await saveDraftTextOrLinkAction({
                    taskId: task.id,
                    mode: "LINK",
                    externalLink: linkInput.trim(),
                });
                if (!res.success) {
                    setSaveErrorMsg(res.error ?? "Failed to save link draft.");
                } else {
                    setSaveSuccessMsg("Draft link saved successfully!");
                    router.refresh();
                }
            } else if (selectedMode === "TEXT") {
                if (!textInput.trim()) {
                    setSaveErrorMsg("Please enter your solution text.");
                    setIsSavingDraft(false);
                    return;
                }
                const res = await saveDraftTextOrLinkAction({
                    taskId: task.id,
                    mode: "TEXT",
                    textContent: textInput.trim(),
                });
                if (!res.success) {
                    setSaveErrorMsg(res.error ?? "Failed to save text draft.");
                } else {
                    setSaveSuccessMsg("Draft text saved successfully!");
                    router.refresh();
                }
            }
        } catch (err) {
            setSaveErrorMsg(err instanceof Error ? err.message : "Unexpected error.");
        } finally {
            setIsSavingDraft(false);
        }
    }

    // Handle File Download (temporary signed URL)
    async function handleDownloadFile(fileUrl: string) {
        setIsDownloading(true);
        try {
            const res = await getSubmissionFileUrlAction(fileUrl);
            if (res.success && res.data) {
                window.open(res.data, "_blank", "noopener,noreferrer");
            } else {
                alert(res.error ?? "Could not generate download link.");
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Error generating download URL.");
        } finally {
            setIsDownloading(false);
        }
    }

    // Handle Unlock Hint Confirm
    async function handleConfirmUnlockHint() {
        if (!hintToUnlock) return;
        setIsUnlockingHint(true);
        setHintError(null);

        try {
            const res = await unlockHintAction({
                studentId,
                hintId: hintToUnlock.id,
            });

            if (!res.success) {
                setHintError(res.error ?? "Failed to unlock hint.");
            } else {
                setHintToUnlock(null);
                router.refresh();
            }
        } catch (err) {
            setHintError(err instanceof Error ? err.message : "Unlock failed.");
        } finally {
            setIsUnlockingHint(false);
        }
    }

    const isExternal = task.type === "EXTERNAL";
    const sub = task.submission;
    const isGraded = sub?.grade !== null && sub?.grade !== undefined;

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
                                Bonus Mission (+5 ST)
                            </span>
                        )}

                        <span className="inline-flex items-center gap-1 rounded-md bg-space-850 px-2 py-0.5 text-[11px] font-medium text-starlight-300 border border-border/60">
                            <Calendar className="size-3 text-starlight-400" />
                            Due {formatDateTime(task.deadline)}
                        </span>
                    </div>

                    <h2 className="font-display text-xl sm:text-2xl font-bold text-starlight-100">
                        {task.title}
                    </h2>
                </div>

                {/* Rubric Criteria Summary Pill */}
                {task.rubricFields.length > 0 && (
                    <div className="shrink-0 flex items-center gap-2 bg-space-900/90 border border-gold-500/20 px-3 py-1.5 rounded-xl">
                        <Layers className="size-3.5 text-gold-400" />
                        <span className="text-xs text-starlight-300 font-medium">
                            Max Rubric:{" "}
                            <span className="font-bold text-gold-400 font-mono">15 pts</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Rubric Criteria Breakdown (Instructor's custom rubric fields) */}
            {task.rubricFields.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-space-900/40 p-4 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-starlight-400 flex items-center gap-1.5">
                        <Layers className="size-3 text-gold-400" />
                        Grading Criteria (Rubric Breakdown)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {task.rubricFields.map((field) => (
                            <div
                                key={field.id}
                                className="flex items-center justify-between rounded-lg bg-space-850/80 px-3 py-2 border border-border/50 text-xs"
                            >
                                <span className="font-medium text-starlight-200 truncate pr-2">
                                    {field.fieldName}
                                </span>
                                <span className="font-mono font-bold text-gold-400 shrink-0">
                                    {field.maxPoints} pts
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Task Description (Markdown) */}
            <div className="rounded-xl border border-border/50 bg-space-950/40 p-5 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-starlight-400 flex items-center gap-1.5">
                    <FileText className="size-3.5 text-gold-400" />
                    Mission Briefing & Requirements
                </div>
                <div className="prose prose-invert max-w-none text-sm text-starlight-200">
                    <MarkdownContent content={task.description} />
                </div>
            </div>

            {/* Hints Section */}
            {task.hints.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="size-4 text-amber-400" />
                            <h3 className="font-display text-sm font-bold text-starlight-100">
                                Tactical Hints ({task.hints.length})
                            </h3>
                        </div>
                        <span className="text-[11px] text-starlight-400">
                            Unlocking hints permanently spends ST
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {task.hints.map((hint) => (
                            <div
                                key={hint.id}
                                className="rounded-xl border border-border/60 bg-space-900/60 p-4 transition-all"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-amber-400">
                                            Hint #{hint.order}
                                        </span>
                                        {hint.isUnlocked ? (
                                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                                                Unlocked
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-space-800 px-2 py-0.5 text-[10px] font-mono text-starlight-400 border border-border/60">
                                                Cost: {hint.cost} ST
                                            </span>
                                        )}
                                    </div>

                                    {!hint.isUnlocked && hint.content === null && (
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
                                            className="h-7 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-semibold"
                                        >
                                            <KeyRound className="size-3 mr-1" />
                                            Unlock Hint (-{hint.cost} ST)
                                        </Button>
                                    )}
                                </div>

                                {hint.content && (
                                    <div className="mt-3 pt-3 border-t border-border/50 text-xs text-starlight-200">
                                        <MarkdownContent content={hint.content} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submission Section */}
            <div className="space-y-4 pt-2">
                {isExternal ? (
                    <div className="rounded-xl border border-border/70 bg-space-950/60 p-5 text-center space-y-2">
                        <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-space-850 text-starlight-300 border border-border/60 mb-2">
                            <ExternalLink className="size-5 text-gold-400" />
                        </div>
                        <h4 className="font-display text-sm font-bold text-starlight-100">
                            External Submission Mission
                        </h4>
                        <p className="text-xs text-starlight-400 max-w-md mx-auto">
                            This task is designed to be solved on an external coding platform or repository. No file upload is required on the NST platform — your instructor will review and grade your solution directly.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border/80 bg-space-900/80 p-5 md:p-6 space-y-5 shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                            <div>
                                <h3 className="font-display text-base font-bold text-starlight-100 flex items-center gap-2">
                                    <Save className="size-4 text-gold-400" />
                                    Task Solution & Draft
                                </h3>
                                <p className="text-xs text-starlight-400 mt-0.5">
                                    {canWrite
                                        ? "Save and update your draft as many times as you like. It will be officially submitted when you Lock the Week."
                                        : "Submissions for this task are locked or the deadline has elapsed."}
                                </p>
                            </div>

                            {/* Current Status Badge */}
                            {sub && (
                                <div className="shrink-0">
                                    {sub.status === "DRAFT" ? (
                                        <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-xs">
                                            Draft Saved
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs">
                                            Submitted for Grading
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Existing Submission Preview */}
                        {sub && (
                            <div className="rounded-xl border border-border/60 bg-space-950/60 p-4 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-starlight-300 flex items-center gap-1.5">
                                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                                        Current Saved Work ({sub.mode})
                                    </span>
                                    <span className="font-mono text-[11px] text-starlight-400">
                                        Last saved: {formatDateTime(sub.submittedAt)}
                                    </span>
                                </div>

                                {sub.mode === "FILE" && sub.fileUrl && (
                                    <div className="flex items-center justify-between gap-3 bg-space-900 px-3.5 py-2.5 rounded-lg border border-border/50">
                                        <div className="flex items-center gap-2 text-xs text-starlight-200 truncate">
                                            <FileText className="size-4 text-gold-400 shrink-0" />
                                            <span className="truncate">Saved Solution File</span>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={isDownloading}
                                            onClick={() => handleDownloadFile(sub.fileUrl!)}
                                            className="h-8 text-xs border-border/70 bg-space-850 hover:bg-space-800 text-starlight-200 shrink-0"
                                        >
                                            <Download className="size-3.5 mr-1" />
                                            {isDownloading ? "Preparing..." : "Download File"}
                                        </Button>
                                    </div>
                                )}

                                {sub.mode === "LINK" && sub.externalLink && (
                                    <div className="bg-space-900 px-3.5 py-2.5 rounded-lg border border-border/50 text-xs">
                                        <a
                                            href={sub.externalLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gold-400 hover:underline flex items-center gap-1.5 break-all"
                                        >
                                            <ExternalLink className="size-3.5 shrink-0" />
                                            <span>{sub.externalLink}</span>
                                        </a>
                                    </div>
                                )}

                                {sub.mode === "TEXT" && sub.textContent && (
                                    <div className="bg-space-900 p-3.5 rounded-lg border border-border/50 text-xs text-starlight-200 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                                        {sub.textContent}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Grading Results Breakdown (if instructor finalized) */}
                        {isGraded && sub?.grade && (
                            <div className="rounded-xl border border-gold-500/30 bg-gradient-to-br from-gold-500/5 via-space-950 to-space-950 p-4 space-y-3">
                                <div className="flex items-center justify-between gap-2 border-b border-gold-500/20 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="size-4 text-gold-400" />
                                        <span className="font-display text-sm font-bold text-starlight-100">
                                            Instructor Evaluation & Grade
                                        </span>
                                    </div>
                                    <span className="font-mono text-base font-extrabold text-gold-300">
                                        {sub.grade.totalPoints} / 15 ST
                                    </span>
                                </div>

                                {sub.grade.markedInvalid && (
                                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-300 flex items-center gap-2">
                                        <AlertCircle className="size-4 shrink-0 text-red-400" />
                                        <span>Marked Invalid or Incomplete (-10 ST penalty applied).</span>
                                    </div>
                                )}

                                {sub.grade.fieldScores.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        {sub.grade.fieldScores.map((score) => (
                                            <div
                                                key={score.rubricFieldId}
                                                className="flex items-center justify-between bg-space-900/80 px-3 py-1.5 rounded-lg border border-border/50"
                                            >
                                                <span className="text-starlight-300 truncate pr-2">
                                                    {score.fieldName}
                                                </span>
                                                <span className="font-mono font-bold text-gold-400 shrink-0">
                                                    {score.awardedPoints} / {score.maxPoints} pts
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {sub.grade.instructorComment && (
                                    <div className="rounded-lg bg-space-900/90 border border-border/60 p-3 space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-starlight-400 flex items-center gap-1">
                                            <MessageSquareQuote className="size-3 text-gold-400" />
                                            Instructor Feedback
                                        </span>
                                        <p className="text-xs text-starlight-200">
                                            {sub.grade.instructorComment}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Save Draft Form (only available if week is ongoing and not locked) */}
                        {canWrite && (
                            <form onSubmit={handleSaveDraft} className="space-y-4 pt-1">
                                {/* Mode Selection (if task allows free choice) */}
                                {!allowedMode && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-starlight-300">
                                            Submission Method
                                        </Label>
                                        <div className="flex gap-2">
                                            {(["FILE", "LINK", "TEXT"] as const).map((mode) => (
                                                <Button
                                                    key={mode}
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedMode(mode)}
                                                    className={`rounded-xl text-xs h-8 px-3.5 transition-all ${
                                                        selectedMode === mode
                                                            ? "bg-gold-500/20 text-gold-300 border-gold-500/50 shadow-gold"
                                                            : "bg-space-850 border-border/70 text-starlight-400 hover:text-starlight-200"
                                                    }`}
                                                >
                                                    {mode === "FILE" && "Upload File (PDF/ZIP)"}
                                                    {mode === "LINK" && "External Link (URL)"}
                                                    {mode === "TEXT" && "Direct Text"}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Mode Inputs */}
                                {selectedMode === "FILE" && (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-starlight-300">
                                            Select File (.pdf, .zip, max 5MB)
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="file"
                                                accept=".pdf,.zip,application/pdf,application/zip,application/x-zip-compressed"
                                                onChange={(e) =>
                                                    setSelectedFile(e.target.files?.[0] ?? null)
                                                }
                                                className="border-border/70 bg-space-950 text-starlight-200 text-xs h-9 cursor-pointer file:text-xs file:font-semibold file:bg-space-850 file:text-gold-300 file:border-0 file:rounded-md file:mr-3"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedMode === "LINK" && (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-starlight-300">
                                            Project / Repository Link
                                        </Label>
                                        <Input
                                            type="url"
                                            placeholder="https://github.com/..."
                                            value={linkInput}
                                            onChange={(e) => setLinkInput(e.target.value)}
                                            className="border-border/70 bg-space-950 text-starlight-200 text-xs h-9 font-mono"
                                        />
                                    </div>
                                )}

                                {selectedMode === "TEXT" && (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-starlight-300">
                                            Solution Content / Markdown
                                        </Label>
                                        <Textarea
                                            rows={5}
                                            placeholder="Paste your source code or explanation here..."
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            className="border-border/70 bg-space-950 text-starlight-200 text-xs font-mono"
                                        />
                                    </div>
                                )}

                                {saveErrorMsg && (
                                    <p className="text-xs text-red-400">{saveErrorMsg}</p>
                                )}

                                {saveSuccessMsg && (
                                    <p className="text-xs text-emerald-400">{saveSuccessMsg}</p>
                                )}

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSavingDraft}
                                        className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold rounded-xl text-xs px-5 shadow-gold h-9 transition-all"
                                    >
                                        {isSavingDraft ? (
                                            <>
                                                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                                                Saving Draft...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="size-3.5 mr-1.5" />
                                                Save Draft Work
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Hint Unlock Confirmation Modal */}
            <Dialog open={hintToUnlock !== null} onOpenChange={(open) => !open && setHintToUnlock(null)}>
                <DialogContent className="border border-border/80 bg-space-950 sm:max-w-md text-starlight-100">
                    <DialogHeader>
                        <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
                            <KeyRound className="size-5 text-amber-400" />
                            Unlock Tactical Hint #{hintToUnlock?.order}?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-starlight-300 mt-2">
                            Unlocking this hint will permanently deduct{" "}
                            <span className="font-mono font-bold text-amber-300">
                                {hintToUnlock?.cost} ST
                            </span>{" "}
                            from your Star Token balance.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl border border-border/60 bg-space-900/60 p-3 text-xs space-y-1.5 font-mono">
                        <div className="flex justify-between">
                            <span className="text-starlight-400">Current ST Balance:</span>
                            <span className="text-starlight-200">{beginnerSt} ST</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-starlight-400">Hint Unlock Cost:</span>
                            <span className="text-red-400">-{hintToUnlock?.cost} ST</span>
                        </div>
                        <div className="flex justify-between border-t border-border/50 pt-1.5 font-bold">
                            <span className="text-starlight-300">Estimated Balance:</span>
                            <span
                                className={
                                    beginnerSt - (hintToUnlock?.cost ?? 0) <= 0
                                        ? "text-red-400"
                                        : "text-gold-300"
                                }
                            >
                                {beginnerSt - (hintToUnlock?.cost ?? 0)} ST
                            </span>
                        </div>
                    </div>

                    {hintError && (
                        <p className="text-xs text-red-400 text-center">{hintError}</p>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUnlockingHint}
                            onClick={() => setHintToUnlock(null)}
                            className="rounded-xl border-border bg-space-850 hover:bg-space-800 text-starlight-300 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isUnlockingHint}
                            onClick={handleConfirmUnlockHint}
                            className="rounded-xl bg-amber-500 hover:bg-amber-400 text-space-950 font-bold text-xs"
                        >
                            {isUnlockingHint ? "Unlocking..." : "Confirm & Deduct ST"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
