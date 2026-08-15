// src/app/student/sessions/[id]/session-detail-view.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskPager } from "@/components/student/task-pager";
import { computeTaskProgress } from "@/lib/task-progress";
import type { StudentSessionView } from "@/lib/data/get-student-level";
import type { SessionStatus } from "@/lib/data/get-my-groups";
import { formatDateTime } from "@/lib/format-date";

const STATUS_STYLES: Record<
    SessionStatus,
    { label: string; variant: "outline" | "success" | "secondary" }
> = {
    upcoming: { label: "Upcoming", variant: "outline" },
    ongoing: { label: "Ongoing", variant: "success" },
    completed: { label: "Completed", variant: "secondary" },
};

export function SessionDetailView({
    studentId,
    session,
    isHistorical = false,
}: {
    studentId: string;
    session: StudentSessionView;
    // True when this Session belongs to a past (non-active) Level, i.e. it
    // was opened from Level History rather than My Sessions. Only changes
    // the back-link target and the Hints/read-only framing passed down to
    // TaskPager - the Session data itself is fetched the same way either way.
    isHistorical?: boolean;
}) {
    const statusStyle = STATUS_STYLES[session.status];
    const progress = computeTaskProgress(session.tasks);

    return (
        <div className="space-y-6">
            <Link
                href={isHistorical ? "/student/levels" : "/student"}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                {isHistorical ? "Back to Level History" : "Back to My Sessions"}
            </Link>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <h1 className="font-display text-xl font-semibold">
                        {session.title}
                    </h1>
                    <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
                    {isHistorical && <Badge variant="outline">Past Level</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>
                        {formatDateTime(session.startTime)}
                    </span>
                    {session.recordingLink && (
                        <a
                            href={session.recordingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                        >
                            Recording
                        </a>
                    )}
                </div>
            </div>

            <p className="text-sm text-muted-foreground">
                {progress.total} {progress.total === 1 ? "task" : "tasks"} ·{" "}
                {progress.submitted} submitted · {progress.graded} graded ·{" "}
                {progress.notSubmitted} not submitted
            </p>

            <TaskPager
                studentId={studentId}
                tasks={session.tasks}
                isHistorical={isHistorical}
            />
        </div>
    );
}