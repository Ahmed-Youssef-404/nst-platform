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
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Search } from "lucide-react";
import { updateSessionAction } from "@/lib/actions/session-management";
import { SessionStatus } from "@/lib/data/get-my-groups";
import {
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { MarkdownContent } from "@/components/markdown-content";
import { formatDateTime } from "@/lib/format-date";
import type {
    SessionFeedbackDetail,
    SessionFeedbackStats,
} from "@/types/types";
// import type { SessionDetail } from "@/lib/data/get-session-detail";
// import type { SessionStatus } from "@/lib/data/get-my-groups";

const STATUS_STYLES: Record<
    SessionStatus,
    { label: string; variant: "outline" | "success" | "secondary" }
> = {
    upcoming: { label: "Upcoming", variant: "outline" },
    ongoing: { label: "Ongoing", variant: "success" },
    completed: { label: "Completed", variant: "secondary" },
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
    const statusStyle = STATUS_STYLES[session.status];

    return (
        <div className="space-y-6">
            <div>
                <Link href="/instructor" className="text-sm text-primary hover:underline">
                    ← {session.groupName}
                </Link>
                <div className="mt-1 flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{session.title}</h2>
                    <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    {session.levelName} · {session.groupName}
                </p>
            </div>

            <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle>Session details</CardTitle>
                    {session.status === "upcoming" && !isEditing && (
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <EditSessionForm
                            session={session}
                            onDone={() => setIsEditing(false)}
                        />
                    ) : (
                        <div className="space-y-2 text-sm">
                            <p>
                                <span className="text-muted-foreground">Start: </span>
                                {formatDateTime(session.startTime)}
                            </p>
                            <p>
                                <span className="text-muted-foreground">Duration: </span>
                                {session.durationMinutes} minutes
                            </p>
                            <p>
                                <span className="text-muted-foreground">Recording: </span>
                                {session.recordingLink ? (
                                    <a
                                        href={session.recordingLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {session.recordingLink}
                                    </a>
                                ) : (
                                    "—"
                                )}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {session.status === "completed" && (
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

            <div className="space-y-4">
                <h3 className="text-sm font-semibold">
                    Tasks {session.tasks.length > 0 && `(${session.tasks.length})`}
                </h3>
                {session.tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No Tasks were created for this Session.
                    </p>
                ) : (
                    session.tasks.map((task, index) => (
                        <Card key={task.id}>
                            <CardHeader className="flex-row items-center justify-between space-y-0">
                                <CardTitle>
                                    Task {index + 1}: {task.title}
                                </CardTitle>
                                <div className="flex gap-2">
                                    {task.isBonus && <Badge variant="warning">Bonus</Badge>}
                                    <Badge variant="outline">{task.type}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <p className="whitespace-pre-wrap">{task.description}</p>
                                <p className="text-muted-foreground">
                                    Deadline:{" "}
                                    {formatDateTime(task.deadline)}
                                </p>
                                {task.type === "INTERNAL" && (
                                    <p className="text-muted-foreground">
                                        Submission mode:{" "}
                                        {task.allowedSubmissionMode ?? "Student chooses freely"}
                                    </p>
                                )}
                                <div className="space-y-2.5 border-t border-border pt-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Hints ({task.hints.length})
                                    </p>
                                    {task.hints.map((hint) => (
                                        <div
                                            key={hint.id}
                                            className="flex flex-col gap-1.5 text-xs rounded-xl border border-border/60 bg-space-950/40 p-3"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-mono font-bold text-gold-400">
                                                    Hint #{hint.order}
                                                </span>
                                                <span className="shrink-0 font-mono text-[11px] text-muted-foreground bg-space-850 px-2 py-0.5 rounded-md border border-border/60">
                                                    {hint.cost} ST
                                                </span>
                                            </div>
                                            <div className="text-xs text-starlight-200 pt-0.5">
                                                <MarkdownContent content={hint.content} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
// ATTENDANCE / ENGAGEMENT ROSTER
// ============================================
// Only rendered once the Session is "completed" - an Instructor
// shouldn't be marking attendance for a Session that's still upcoming or
// in progress. Attendance can be set and later corrected (PRESENT <->
// ABSENT) at any time after that, since recordAttendance reverses the
// prior ST effect before applying the new one. Engagement is one-way:
// once given it can't be un-given or re-given from this UI, matching
// recordSessionEngagement throwing on a duplicate call.

function AttendanceRoster({
    sessionId,
    roster,
    instructorId,
}: {
    sessionId: string;
    roster: SessionDetailRosterEntry[];
    instructorId: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance &amp; engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {roster.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No Students in this Group.
                    </p>
                ) : (
                    roster.map((entry) => (
                        <RosterRow
                            key={entry.studentId}
                            sessionId={sessionId}
                            entry={entry}
                            instructorId={instructorId}
                        />
                    ))
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
        <div className="rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium">{entry.studentName}</span>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant={entry.attendanceStatus === "PRESENT" ? "default" : "outline"}
                        disabled={isSavingAttendance}
                        onClick={() => handleAttendance("PRESENT")}
                    >
                        Present
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={entry.attendanceStatus === "ABSENT" ? "default" : "outline"}
                        disabled={isSavingAttendance}
                        onClick={() => handleAttendance("ABSENT")}
                    >
                        Absent
                    </Button>
                    {entry.engagementGiven ? (
                        <Badge variant="success">Engagement +5 given</Badge>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isSavingEngagement}
                            onClick={handleEngagement}
                        >
                            {isSavingEngagement ? "Saving..." : "Give engagement (+5 ST)"}
                        </Button>
                    )}
                </div>
            </div>
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
    );
}

// ============================================
// SUBMISSIONS / GRADING
// ============================================

function submissionStatusLabel(row: SessionDetailSubmission): {
    label: string;
    variant: "outline" | "success" | "secondary" | "warning";
} {
    if (!row.submission) return { label: "Not submitted", variant: "outline" };
    if (row.submission.isGraded) return { label: "Graded", variant: "success" };
    return { label: "Awaiting grading", variant: "warning" };
}

function SubmissionsSection({
    task,
    instructorId,
}: {
    task: SessionDetailTask;
    instructorId: string;
}) {
    const [openStudentId, setOpenStudentId] = useState<string | null>(null);

    return (
        <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">
                Submissions ({task.submissions.filter((s) => s.submission).length}/
                {task.submissions.length})
            </p>
            <div className="space-y-2">
                {task.submissions.map((row) => {
                    const status = submissionStatusLabel(row);
                    const isOpen = openStudentId === row.studentId;
                    return (
                        <div key={row.studentId} className="rounded-md border">
                            <button
                                type="button"
                                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
                                onClick={() =>
                                    setOpenStudentId(isOpen ? null : row.studentId)
                                }
                                disabled={!row.submission}
                            >
                                <span>{row.studentName}</span>
                                <span className="flex items-center gap-2">
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                    {row.submission && (
                                        <span className="text-muted-foreground">
                                            {isOpen ? "▲" : "▼"}
                                        </span>
                                    )}
                                </span>
                            </button>
                            {isOpen && row.submission && (
                                <div className="border-t border-border p-3">
                                    <SubmissionDetail
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
    studentId,
    submission,
    instructorId,
}: {
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
        <div className="space-y-3 text-sm">
            <p className="text-xs text-muted-foreground">
                Submitted{" "}
                {formatDateTime(submission.submittedAt)}{" "}
                · {submission.mode}
            </p>

            {submission.mode === "TEXT" && (
                <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3">
                    {submission.textContent}
                </p>
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
                <div className="space-y-1">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? "Opening..." : "View submitted file"}
                    </Button>
                    {downloadError && (
                        <p className="text-xs text-error">{downloadError}</p>
                    )}
                </div>
            )}

            {submission.isGraded ? (
                <div className="rounded-md bg-muted/50 p-3">
                    <p className="font-medium">
                        Score:{" "}
                        {(submission.understandingScore ?? 0) +
                            (submission.approachScore ?? 0) +
                            (submission.correctnessScore ?? 0) +
                            (submission.implementationScore ?? 0)}{" "}
                        / 10
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Understanding {submission.understandingScore}/2 · Approach{" "}
                        {submission.approachScore}/3 · Correctness{" "}
                        {submission.correctnessScore}/3 · Implementation{" "}
                        {submission.implementationScore}/2
                    </p>
                    {submission.instructorComment && (
                        <p className="mt-2 text-muted-foreground">
                            {submission.instructorComment}
                        </p>
                    )}
                </div>
            ) : (
                <GradingForm
                    submissionId={submission.id}
                    instructorId={instructorId}
                />
            )}
        </div>
    );
}

function GradingForm({
    submissionId,
    instructorId,
}: {
    submissionId: string;
    instructorId: string;
}) {
    const router = useRouter();
    const [understandingScore, setUnderstandingScore] = useState("");
    const [approachScore, setApproachScore] = useState("");
    const [correctnessScore, setCorrectnessScore] = useState("");
    const [implementationScore, setImplementationScore] = useState("");
    const [instructorComment, setInstructorComment] = useState("");
    const [isFirstSolver, setIsFirstSolver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function parseScore(value: string, max: number): number | null {
        if (value.trim() === "") return null;
        const n = Number(value);
        if (!Number.isInteger(n) || n < 0 || n > max) return null;
        return n;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const understanding = parseScore(understandingScore, 2);
        const approach = parseScore(approachScore, 3);
        const correctness = parseScore(correctnessScore, 3);
        const implementation = parseScore(implementationScore, 2);

        if (
            understanding === null ||
            approach === null ||
            correctness === null ||
            implementation === null
        ) {
            setError(
                "Enter each score within its range: Understanding 0-2, Approach 0-3, Correctness 0-3, Implementation 0-2."
            );
            return;
        }

        setIsSubmitting(true);
        const result = await gradeSubmissionAction({
            submissionId,
            understandingScore: understanding,
            approachScore: approach,
            correctnessScore: correctness,
            implementationScore: implementation,
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
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label htmlFor={`understanding-${submissionId}`}>
                        Understanding (0-2)
                    </Label>
                    <Input
                        id={`understanding-${submissionId}`}
                        type="number"
                        min={0}
                        max={2}
                        value={understandingScore}
                        onChange={(e) => setUnderstandingScore(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`approach-${submissionId}`}>Approach (0-3)</Label>
                    <Input
                        id={`approach-${submissionId}`}
                        type="number"
                        min={0}
                        max={3}
                        value={approachScore}
                        onChange={(e) => setApproachScore(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`correctness-${submissionId}`}>
                        Correctness (0-3)
                    </Label>
                    <Input
                        id={`correctness-${submissionId}`}
                        type="number"
                        min={0}
                        max={3}
                        value={correctnessScore}
                        onChange={(e) => setCorrectnessScore(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`implementation-${submissionId}`}>
                        Implementation (0-2)
                    </Label>
                    <Input
                        id={`implementation-${submissionId}`}
                        type="number"
                        min={0}
                        max={2}
                        value={implementationScore}
                        onChange={(e) => setImplementationScore(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="space-y-1">
                <MarkdownEditor
                    id={`comment-${submissionId}`}
                    label="Comment (optional)"
                    value={instructorComment}
                    onChange={(val) => setInstructorComment(val)}
                    placeholder="Feedback for the student in Markdown (code, bullet points, suggestions)..."
                    rows={4}
                />
            </div>

            <div className="flex items-center gap-2">
                <Checkbox
                    id={`first-solver-${submissionId}`}
                    checked={isFirstSolver}
                    onCheckedChange={(checked) => setIsFirstSolver(checked === true)}
                />
                <Label
                    htmlFor={`first-solver-${submissionId}`}
                    className="text-sm font-normal"
                >
                    First solver in group (+5 ST)
                </Label>
            </div>

            {error && (
                <p className="rounded-md bg-error-bg px-3 py-2 text-sm text-error">
                    {error}
                </p>
            )}

            <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Grading..." : "Submit grade"}
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
            title,
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-start">Start time</Label>
                    <Input
                        id="edit-start"
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-duration">Duration (minutes)</Label>
                    <Input
                        id="edit-duration"
                        type="number"
                        min={1}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        required
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-recording">Recording link (optional)</Label>
                <Input
                    id="edit-recording"
                    type="url"
                    placeholder="https://..."
                    value={recordingLink}
                    onChange={(e) => setRecordingLink(e.target.value)}
                />
            </div>

            {error && (
                <p className="rounded-md bg-error-bg px-3 py-2 text-sm text-error">
                    {error}
                </p>
            )}

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
                <Button type="button" variant="ghost" onClick={onDone}>
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
        <Card className="border-border/80 bg-space-900/60 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-starlight-100">
                                <Star className="size-4 text-gold-400 fill-gold-400/20" />
                                Student Ratings &amp; Feedback
                            </CardTitle>
                            <Badge variant="outline" className="font-mono text-xs">
                                {stats.totalFeedbacks} Reviews
                            </Badge>
                        </div>
                        <p className="text-xs text-starlight-400 mt-1">
                            Individual ratings and remarks submitted by students before accessing session tasks.
                        </p>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="rounded-xl border border-gold-500/25 bg-gold-500/10 px-3.5 py-1.5 text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-400 block">
                                Avg Score
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

            <CardContent className="pt-4 space-y-4">
                {/* Search & Filter Bar */}
                {feedbacks.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-starlight-400" />
                            <Input
                                placeholder="Search by student name or comment..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 text-xs bg-space-950/60 border-border/70 rounded-xl placeholder:text-starlight-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Button
                                size="sm"
                                variant={ratingFilter === "ALL" ? "secondary" : "outline"}
                                onClick={() => setRatingFilter("ALL")}
                                className="h-8 text-xs rounded-lg"
                            >
                                All ({feedbacks.length})
                            </Button>
                            <Button
                                size="sm"
                                variant={ratingFilter === "HIGH" ? "secondary" : "outline"}
                                onClick={() => setRatingFilter("HIGH")}
                                className="h-8 text-xs rounded-lg text-emerald-400"
                            >
                                High (8-10)
                            </Button>
                            <Button
                                size="sm"
                                variant={ratingFilter === "LOW" ? "secondary" : "outline"}
                                onClick={() => setRatingFilter("LOW")}
                                className="h-8 text-xs rounded-lg text-amber-400"
                            >
                                Low (1-5)
                            </Button>
                            <Button
                                size="sm"
                                variant={filterWithCommentsOnly ? "secondary" : "outline"}
                                onClick={() => setFilterWithCommentsOnly((v) => !v)}
                                className="h-8 text-xs rounded-lg"
                            >
                                With Comments
                            </Button>
                        </div>
                    </div>
                )}

                {/* Feedback List */}
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