// src/app/student/student-dashboard-view.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type {
    StudentLevelView,
    StudentSessionView,
    StudentTaskView,
    StudentHintView,
} from "@/lib/data/get-student-level";
import type { SessionStatus } from "@/lib/data/get-my-groups";
import type { SubmissionModeCode } from "@/types/types";

const STATUS_STYLES: Record<
    SessionStatus,
    { label: string; variant: "outline" | "success" | "secondary" }
> = {
    upcoming: { label: "Upcoming", variant: "outline" },
    ongoing: { label: "Ongoing", variant: "success" },
    completed: { label: "Completed", variant: "secondary" },
};

export function StudentLevelSessions({
    studentId,
    level,
}: {
    studentId: string;
    level: StudentLevelView | null;
}) {
    if (!level) {
        return (
            <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                    You&apos;re not in an active Level yet. Check back once your
                    instructor starts one.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">
                    Level {level.levelNumber} — {level.name}
                </h2>
                <p className="text-sm text-muted-foreground">{level.groupName}</p>
            </div>

            {level.sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No Sessions have been scheduled for this Level yet.
                </p>
            ) : (
                level.sessions.map((session) => (
                    <SessionCard
                        key={session.id}
                        studentId={studentId}
                        session={session}
                    />
                ))
            )}
        </div>
    );
}

// ============================================
// SESSION
// ============================================

function SessionCard({
    studentId,
    session,
}: {
    studentId: string;
    session: StudentSessionView;
}) {
    const statusStyle = STATUS_STYLES[session.status];

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        {session.title}
                        <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {session.startTime.toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                        })}
                    </p>
                </div>
                {session.recordingLink && (
                    <a
                        href={session.recordingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                    >
                        Recording
                    </a>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {session.tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No Tasks in this Session.
                    </p>
                ) : (
                    session.tasks.map((task) => (
                        <TaskCard key={task.id} studentId={studentId} task={task} />
                    ))
                )}
            </CardContent>
        </Card>
    );
}

// ============================================
// TASK
// ============================================

function TaskCard({
    studentId,
    task,
}: {
    studentId: string;
    task: StudentTaskView;
}) {
    return (
        <div className="rounded-md border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {task.description}
                    </p>
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
                {task.deadline.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                })}
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
        <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Hints</p>
            {hints.map((hint) => (
                <div key={hint.id} className="flex items-start justify-between gap-3 text-sm">
                    {hint.isUnlocked ? (
                        <span>
                            {hint.order}. {hint.content}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">
                            {hint.order}. Locked
                        </span>
                    )}
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
                        {submission.submittedAt.toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                        })}{" "}
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