// src/app/instructor/instructor-dashboard-view.tsx
// Pure presentational component - all data comes in as props from the
// server component that fetched it. No client-side data fetching here.

import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    FileText,
    Plus,
    CheckCircle2,
    Clock,
    ChevronRight,
} from "lucide-react";
import type {
    InstructorGroupSummary,
    InstructorWeekSummary,
    SessionStatus,
    WeekStatus,
} from "@/lib/data/get-my-groups";
import { formatDateTime } from "@/lib/format-date";

const SESSION_STATUS_STYLES: Record<
    SessionStatus,
    { label: string; variant: "outline" | "success" | "secondary" }
> = {
    upcoming: { label: "Upcoming", variant: "outline" },
    ongoing: { label: "Ongoing", variant: "success" },
    completed: { label: "Completed", variant: "secondary" },
};

const WEEK_STATUS_STYLES: Record<
    WeekStatus,
    { label: string; variant: "outline" | "success" | "secondary" }
> = {
    upcoming: { label: "Upcoming", variant: "outline" },
    ongoing: { label: "Ongoing", variant: "success" },
    ended: { label: "Ended / Grading", variant: "secondary" },
};

export function InstructorDashboardView({
    groups,
}: {
    groups: InstructorGroupSummary[];
}) {
    if (groups.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                You&apos;re not assigned to any Group yet.
            </p>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                    Instructor Dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your assigned groups, schedules, and student submissions.
                </p>
            </div>

            {groups.map((group) => {
                const isBeginner = group.type === "BEGINNER";

                return (
                    <Card key={group.id} className="border-border/70 shadow-sm">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                            <div>
                                <CardTitle className="text-lg font-display">
                                    {group.name}
                                </CardTitle>
                                <CardDescription className="mt-0.5">
                                    {group.batchName}
                                </CardDescription>
                            </div>
                            <Badge
                                variant="outline"
                                className={
                                    isBeginner
                                        ? "border-amber-500/40 text-amber-400 bg-amber-500/10 font-medium"
                                        : "border-blue-500/40 text-blue-400 bg-blue-500/10 font-medium"
                                }
                            >
                                {isBeginner ? "Beginner Track" : "Intermediate Track"}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {isBeginner ? (
                                <BeginnerGroupSection group={group} />
                            ) : (
                                <IntermediateGroupSection group={group} />
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

function BeginnerGroupSection({ group }: { group: InstructorGroupSummary }) {
    const weeks = group.weeks;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Weeks & Missions</p>
                    <span className="text-xs text-muted-foreground">
                        ({weeks.length} {weeks.length === 1 ? "week" : "weeks"})
                    </span>
                </div>
                <Button
                    size="sm"
                    render={
                        <Link href={`/instructor/weeks/new?groupId=${group.id}`} />
                    }
                >
                    <Plus className="size-3.5 mr-1" />
                    New Week
                </Button>
            </div>

            {weeks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
                    <Calendar className="size-8 text-muted-foreground/60 mb-2" />
                    <p className="text-sm font-medium text-foreground">
                        No Weeks created yet
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mt-0.5 mb-3">
                        Create the first week for this beginner group to set up tasks and required resources.
                    </p>
                    <Button
                        size="sm"
                        variant="outline"
                        render={
                            <Link href={`/instructor/weeks/new?groupId=${group.id}`} />
                        }
                    >
                        <Plus className="size-3.5 mr-1" />
                        Create Week
                    </Button>
                </div>
            ) : (
                <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
                    {weeks.map((week) => (
                        <WeekListItem key={week.id} week={week} />
                    ))}
                </div>
            )}
        </div>
    );
}

function WeekListItem({ week }: { week: InstructorWeekSummary }) {
    const statusStyle = WEEK_STATUS_STYLES[week.status];

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40">
            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                    <Link
                        href={`/instructor/weeks/${week.id}`}
                        className="font-medium text-sm hover:underline hover:text-primary transition-colors truncate"
                    >
                        {week.name}
                    </Link>
                    <Badge variant={statusStyle.variant} className="text-xs">
                        {statusStyle.label}
                    </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground/70" />
                        {formatDateTime(week.startDate)} — {formatDateTime(week.endDate)}
                    </span>
                    <span>•</span>
                    <span>
                        {week.taskCount} {week.taskCount === 1 ? "task" : "tasks"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate max-w-xs" title={week.requiredFileLabel}>
                        <FileText className="size-3 text-muted-foreground/70 shrink-0" />
                        {week.requiredFileLabel}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                    size="xs"
                    variant="outline"
                    render={<Link href={`/instructor/weeks/${week.id}`} />}
                >
                    Edit / View
                </Button>
                <Button
                    size="xs"
                    variant="default"
                    render={<Link href={`/instructor/weeks/${week.id}/grade`} />}
                >
                    <CheckCircle2 className="size-3 mr-1" />
                    Grading
                </Button>
            </div>
        </div>
    );
}

function IntermediateGroupSection({ group }: { group: InstructorGroupSummary }) {
    if (!group.activeLevel) {
        return (
            <p className="text-sm text-muted-foreground">
                No active Level for this Group yet.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                    {group.activeLevel.name}
                </p>
                <Button
                    size="sm"
                    render={
                        <Link
                            href={`/instructor/sessions/new?levelId=${group.activeLevel.id}`}
                        />
                    }
                >
                    <Plus className="size-3.5 mr-1" />
                    New Session
                </Button>
            </div>

            {group.activeLevel.sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No Sessions yet for this Level.
                </p>
            ) : (
                <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
                    {group.activeLevel.sessions.map((session) => {
                        const statusStyle =
                            SESSION_STATUS_STYLES[session.status];
                        return (
                            <Link
                                key={session.id}
                                href={`/instructor/sessions/${session.id}`}
                                className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">
                                        {session.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDateTime(session.startTime)}
                                        {" · "}
                                        {session.taskCount}{" "}
                                        {session.taskCount === 1
                                            ? "task"
                                            : "tasks"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={statusStyle.variant}>
                                        {statusStyle.label}
                                    </Badge>
                                    <ChevronRight className="size-4 text-muted-foreground/60" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}