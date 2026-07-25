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
import { updateSessionAction } from "@/lib/actions/session-management";
import { SessionStatus } from "@/lib/data/get-my-groups";
import { SessionDetail } from "@/lib/data/get-session-detail";
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

export function SessionDetailView({ session }: { session: SessionDetail }) {
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
                                {session.startTime.toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}
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
                                    {task.deadline.toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </p>
                                {task.type === "INTERNAL" && (
                                    <p className="text-muted-foreground">
                                        Submission mode:{" "}
                                        {task.allowedSubmissionMode ?? "Student chooses freely"}
                                    </p>
                                )}
                                <div className="space-y-2 border-t border-border pt-3">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Hints
                                    </p>
                                    {task.hints.map((hint) => (
                                        <div
                                            key={hint.id}
                                            className="flex items-start justify-between gap-3 text-sm"
                                        >
                                            <span>
                                                {hint.order}. {hint.content}
                                            </span>
                                            <span className="shrink-0 text-muted-foreground">
                                                {hint.cost} ST
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
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