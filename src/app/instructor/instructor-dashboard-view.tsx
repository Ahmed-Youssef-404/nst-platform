// src/app/instructor/instructor-dashboard-view.tsx
// Pure presentational component - all data comes in as props from the
// server component that fetched it. Designed according to nst-design-v1.0.css.

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
    Sparkles,
    Layers,
    Compass,
    Users,
    GraduationCap,
    FolderGit2,
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
    { label: string; badgeClass: string }
> = {
    upcoming: {
        label: "Upcoming",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    ongoing: {
        label: "Live / Ongoing",
        badgeClass: "bg-success-500/15 text-success-400 border-success-500/30 animate-pulse",
    },
    completed: {
        label: "Completed",
        badgeClass: "bg-space-800 text-starlight-300 border-border/80",
    },
};

const WEEK_STATUS_STYLES: Record<
    WeekStatus,
    { label: string; badgeClass: string }
> = {
    upcoming: {
        label: "Upcoming",
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    ongoing: {
        label: "Active Week",
        badgeClass: "bg-success-500/15 text-success-400 border-success-500/30",
    },
    ended: {
        label: "Ended / Grading",
        badgeClass: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    },
};

export function InstructorDashboardView({
    groups,
}: {
    groups: InstructorGroupSummary[];
}) {
    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/60 p-12 text-center backdrop-blur-md">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-space-850 border border-gold-500/20 text-gold-400 shadow-gold mb-4">
                    <Compass className="size-7" />
                </div>
                <h3 className="font-display text-lg font-bold text-starlight-100">
                    No Groups Assigned Yet
                </h3>
                <p className="mt-1 text-sm text-starlight-300 max-w-md">
                    You haven&apos;t been assigned to any beginner or intermediate student groups by the Super Admin yet.
                </p>
            </div>
        );
    }

    const beginnerCount = groups.filter((g) => g.type === "BEGINNER").length;
    const intermediateCount = groups.filter((g) => g.type === "INTERMEDIATE").length;
    const totalWeeks = groups.reduce((acc, g) => acc + (g.weeks?.length ?? 0), 0);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero & Stat Cards */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="font-display text-3xl font-extrabold tracking-tight text-starlight-100">
                        Instructor Dashboard
                    </h1>
                    <p className="mt-1.5 text-sm text-starlight-300">
                        Oversee your assigned student groups, track weekly missions, and grade submissions.
                    </p>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md shadow-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                Assigned Groups
                            </span>
                            <div className="flex size-8 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20">
                                <Users className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-display text-starlight-100">
                                {groups.length}
                            </span>
                            <span className="text-xs text-starlight-400">
                                Total Groups
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md shadow-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                Beginner Tracks
                            </span>
                            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Sparkles className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-display text-amber-300">
                                {beginnerCount}
                            </span>
                            <span className="text-xs text-starlight-400">
                                ({totalWeeks} active weeks)
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/80 bg-space-900/70 p-4 backdrop-blur-md shadow-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                Intermediate Tracks
                            </span>
                            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <Layers className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold font-display text-blue-300">
                                {intermediateCount}
                            </span>
                            <span className="text-xs text-starlight-400">
                                Level-based groups
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Groups List */}
            <div className="space-y-6">
                {groups.map((group) => {
                    const isBeginner = group.type === "BEGINNER";

                    return (
                        <Card
                            key={group.id}
                            className="rounded-2xl border border-border/80 bg-space-900/80 shadow-3 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-gold-500/40"
                        >
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 border-b border-border/70 bg-space-950/40">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-xl font-bold font-display text-starlight-100">
                                            {group.name}
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="mt-1 text-xs text-starlight-400 font-mono flex items-center gap-2">
                                        <FolderGit2 className="size-3.5 text-starlight-400" />
                                        Batch: {group.batchName}
                                    </CardDescription>
                                </div>

                                <Badge
                                    className={
                                        isBeginner
                                            ? "bg-gold-500/15 text-gold-300 border-gold-500/35 shadow-gold font-semibold px-3 py-1 rounded-full text-xs"
                                            : "bg-blue-500/15 text-blue-300 border-blue-500/35 shadow-starlight font-semibold px-3 py-1 rounded-full text-xs"
                                    }
                                >
                                    {isBeginner ? "✦ Beginner Track" : "◆ Intermediate Track"}
                                </Badge>
                            </CardHeader>

                            <CardContent className="p-6">
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
        </div>
    );
}

function BeginnerGroupSection({ group }: { group: InstructorGroupSummary }) {
    const weeks = group.weeks;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-starlight-100 font-display">
                        Weeks & Curriculum
                    </p>
                    <span className="rounded-full bg-space-800 border border-border/80 px-2 py-0.5 text-[11px] font-mono text-starlight-300">
                        {weeks.length} {weeks.length === 1 ? "Week" : "Weeks"}
                    </span>
                </div>
                <Button
                    size="sm"
                    className="bg-gold-500 text-space-950 hover:bg-gold-400 font-bold shadow-gold rounded-xl text-xs transition-all"
                    render={
                        <Link href={`/instructor/weeks/new?groupId=${group.id}`} />
                    }
                >
                    <Plus className="size-3.5 mr-1" />
                    New Week
                </Button>
            </div>

            {weeks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-space-950/40 p-8 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-space-850 border border-border/80 text-starlight-400 mb-3">
                        <Calendar className="size-6" />
                    </div>
                    <p className="text-sm font-semibold text-starlight-100">
                        No Weeks created yet
                    </p>
                    <p className="text-xs text-starlight-400 max-w-sm mt-1 mb-4">
                        Initialize Week 1 for this beginner group to set up YouTube playlists, tasks, and rubric criteria.
                    </p>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-gold-500/40 text-gold-400 hover:bg-gold-500/10 rounded-xl text-xs font-semibold"
                        render={
                            <Link href={`/instructor/weeks/new?groupId=${group.id}`} />
                        }
                    >
                        <Plus className="size-3.5 mr-1" />
                        Create Week
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-space-850/60 hover:bg-space-800/80 hover:border-gold-500/35 transition-all duration-200">
            <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <Link
                        href={`/instructor/weeks/${week.id}`}
                        className="font-bold text-sm text-starlight-100 hover:text-gold-300 transition-colors truncate"
                    >
                        {week.name}
                    </Link>
                    <Badge className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle.badgeClass}`}>
                        {statusStyle.label}
                    </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-starlight-400">
                    <span className="flex items-center gap-1.5 font-mono">
                        <Clock className="size-3 text-gold-400/80" />
                        {formatDateTime(week.startDate)} — {formatDateTime(week.endDate)}
                    </span>
                    <span>•</span>
                    <span className="text-starlight-300 font-medium">
                        {week.taskCount} {week.taskCount === 1 ? "task" : "tasks"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate max-w-xs text-starlight-300" title={week.requiredFileLabel}>
                        <FileText className="size-3 text-starlight-400 shrink-0" />
                        {week.requiredFileLabel}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <Button
                    size="sm"
                    variant="outline"
                    className="border-border/80 bg-space-850 hover:bg-space-750 text-starlight-200 hover:text-starlight-100 rounded-xl text-xs font-semibold transition-colors"
                    render={<Link href={`/instructor/weeks/${week.id}`} />}
                >
                    Manage & Tasks
                </Button>
                <Button
                    size="sm"
                    className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs transition-all"
                    render={<Link href={`/instructor/weeks/${week.id}/grade`} />}
                >
                    <CheckCircle2 className="size-3.5 mr-1" />
                    Grading Desk
                </Button>
            </div>
        </div>
    );
}

function IntermediateGroupSection({ group }: { group: InstructorGroupSummary }) {
    if (!group.activeLevel) {
        return (
            <div className="rounded-xl border border-dashed border-border/70 bg-space-950/40 p-6 text-center text-xs text-starlight-400">
                No active Level for this Intermediate Group yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-starlight-100 font-display">
                        Active Level: {group.activeLevel.name}
                    </p>
                    <span className="rounded-full bg-space-800 border border-border/80 px-2 py-0.5 text-[11px] font-mono text-starlight-300">
                        Level {group.activeLevel.levelNumber}
                    </span>
                </div>
                <Button
                    size="sm"
                    className="bg-blue-500 text-white hover:bg-blue-400 font-bold shadow-starlight rounded-xl text-xs transition-all"
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
                <p className="text-xs text-starlight-400 rounded-xl border border-dashed border-border/70 bg-space-950/40 p-6 text-center">
                    No Sessions scheduled yet for this Level.
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-2.5">
                    {group.activeLevel.sessions.map((session) => {
                        const statusStyle =
                            SESSION_STATUS_STYLES[session.status];
                        return (
                            <Link
                                key={session.id}
                                href={`/instructor/sessions/${session.id}`}
                                className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-space-850/60 hover:bg-space-800/80 hover:border-blue-500/35 transition-all text-xs"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-sm text-starlight-100">
                                        {session.title}
                                    </span>
                                    <span className="text-starlight-400 font-mono">
                                        {formatDateTime(session.startTime)}
                                        {" · "}
                                        {session.taskCount}{" "}
                                        {session.taskCount === 1
                                            ? "task"
                                            : "tasks"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle.badgeClass}`}>
                                        {statusStyle.label}
                                    </Badge>
                                    <ChevronRight className="size-4 text-starlight-400" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}