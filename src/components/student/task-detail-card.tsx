// src/components/student/task-detail-card.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { StudentTaskView, StudentHintView } from "@/lib/data/get-student-level";
import type { SubmissionModeCode } from "@/types/types";
import { formatDateTime } from "@/lib/format-date";

// ============================================
// TASK DETAIL (title/description/deadline + Hints + Submission)
// Shown one at a time inside the pager on the Session Details page.
// ============================================

export function TaskDetailCard({
    studentId,
    task,
}: {
    studentId: string;
    task: StudentTaskView;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-display font-medium">{task.title}</p>
                    <MarkdownContent
                        content={task.description}
                        className="mt-1 text-muted-foreground"
                    />
                </div>
                <div className="flex shrink-0 gap-2">
                    {task.isBonus && <Badge variant="warning">Bonus</Badge>}
                    <Badge variant="outline">{task.type}</Badge>
                </div>
            </div>

            <p
                className={`text-xs ${task.isDeadlinePassed ? "text-error" : "text-muted-foreground"
                    }`}
            >
                Deadline:{" "}
                {formatDateTime(task.deadline)}
                {task.isDeadlinePassed && " — passed"}
            </p>

            <HintsList studentId={studentId} hints={task.hints} />

            {task.type === "INTERNAL" && (
                <SubmissionPanel studentId={studentId} task={task} />
            )}
        </div>
    );
}

// ============================================
// HINTS
// ============================================

function HintsList({
    studentId,
    hints,
}: {
    studentId: string;
    hints: StudentHintView[];
}) {
    const [unlockingId, setUnlockingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleUnlock(hint: StudentHintView) {
        const confirmed = window.confirm(
            `Unlock this hint for ${hint.cost} ST? This can't be undone.`
        );
        if (!confirmed) return;

        setError(null);
        setUnlockingId(hint.id);

        const result = await unlockHintAction({ studentId, hintId: hint.id });

        setUnlockingId(null);

        if (result.success) {
            router.refresh();
        } else {
            setError(result.error ?? "Could not unlock this hint.");
        }
    }

    return (
        <div className="space-y-3 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Hints</p>
            {hints.map((hint) => (
                <div key={hint.id} className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                        <span className={hint.isUnlocked ? "font-medium" : "text-muted-foreground"}>
                            Hint {hint.order}
                            {!hint.isUnlocked && " — Locked"}
                        </span>
                        {!hint.isUnlocked && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={unlockingId === hint.id}
                                onClick={() => handleUnlock(hint)}
                            >
                                {unlockingId === hint.id
                                    ? "Unlocking..."
                                    : `Unlock (${hint.cost} ST)`}
                            </Button>
                        )}
                    </div>
                    {hint.isUnlocked && hint.content && (
                        <MarkdownContent content={hint.content} />
                    )}
                </div>
            ))}
            {error && <p className="text-sm text-error">{error}</p>}
        </div>
    );
}

// ============================================
// SUBMISSION
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
}: {
    studentId: string;
    task: StudentTaskView;
}) {
    const router = useRouter();
    const submission = task.submission;
    const isGraded = submission?.isGraded ?? false;
    const canEdit = !task.isDeadlinePassed && !(submission?.isLocked ?? false);

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
            setError("Choose a file first.");
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
        <div className="space-y-3 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Submission</p>

            {submission && (
                <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                    <p className="text-xs text-muted-foreground">
                        Submitted{" "}
                        {formatDateTime(submission.submittedAt)}{" "}
                        · {submission.mode}
                    </p>
                    {submission.mode === "TEXT" && (
                        <p className="whitespace-pre-wrap">{submission.textContent}</p>
                    )}
                    {submission.mode === "LINK" && (
                        <a
                            href={submission.externalLink ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                        >
                            {submission.externalLink}
                        </a>
                    )}
                    {submission.mode === "FILE" && (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleDownload}
                            disabled={isDownloading}
                        >
                            {isDownloading ? "Opening..." : "View submitted file"}
                        </Button>
                    )}

                    {isGraded ? (
                        <div className="mt-2 border-t pt-2">
                            <p className="font-medium">
                                Score: {submission.totalScore} / 10
                            </p>
                            {submission.instructorComment && (
                                <p className="mt-1 text-muted-foreground">
                                    {submission.instructorComment}
                                </p>
                            )}
                        </div>
                    ) : submission.isLocked ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                            Locked — waiting for grading.
                        </p>
                    ) : task.isDeadlinePassed ? (
                        <p className="mt-2 text-xs text-error">
                            The deadline has passed — this submission is final.
                        </p>
                    ) : null}
                </div>
            )}

            {!submission && task.isDeadlinePassed && (
                <p className="text-sm text-error">
                    You did not submit before the deadline.
                </p>
            )}

            {canEdit && (
                <form onSubmit={handleSubmit} className="space-y-3">
                    {task.allowedSubmissionMode ? (
                        <p className="text-xs text-muted-foreground">
                            Submission type: {task.allowedSubmissionMode}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <Label>Submission type</Label>
                            <Select
                                value={mode}
                                onValueChange={(value) => setMode(value as SubmissionModeCode)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FILE">File (PDF/ZIP, max 5MB)</SelectItem>
                                    <SelectItem value="LINK">Link</SelectItem>
                                    <SelectItem value="TEXT">Text</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {mode === "TEXT" && (
                        <Textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            placeholder="Write your answer..."
                            required
                        />
                    )}

                    {mode === "LINK" && (
                        <Input
                            type="url"
                            value={externalLink}
                            onChange={(e) => setExternalLink(e.target.value)}
                            placeholder="https://..."
                            required
                        />
                    )}

                    {mode === "FILE" && (
                        <Input
                            type="file"
                            accept=".pdf,.zip,application/pdf,application/zip"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                    )}

                    {error && <p className="text-sm text-error">{error}</p>}

                    <Button type="submit" size="sm" disabled={isSubmitting}>
                        {isSubmitting
                            ? "Submitting..."
                            : submission
                                ? "Resubmit"
                                : "Submit"}
                    </Button>
                </form>
            )}
        </div>
    );
}