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
import type { InstructorGroupSummary, SessionStatus } from "@/lib/data/get-my-groups";

const STATUS_STYLES: Record<
    SessionStatus,
    { label: string; variant: "outline" | "success" | "secondary" }
> = {
    upcoming: { label: "Upcoming", variant: "outline" },
    ongoing: { label: "Ongoing", variant: "success" },
    completed: { label: "Completed", variant: "secondary" },
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
            {groups.map((group) => (
                <Card key={group.id}>
                    <CardHeader>
                        <CardTitle>{group.name}</CardTitle>
                        <CardDescription>{group.batchName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!group.activeLevel ? (
                            <p className="text-sm text-muted-foreground">
                                No active Level for this Group yet.
                            </p>
                        ) : (
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
                                        + New Session
                                    </Button>
                                </div>

                                {group.activeLevel.sessions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No Sessions yet for this Level.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-border rounded-md border border-border">
                                        {group.activeLevel.sessions.map((session) => {
                                            const statusStyle =
                                                STATUS_STYLES[session.status];
                                            return (
                                                <Link
                                                    key={session.id}
                                                    href={`/instructor/sessions/${session.id}`}
                                                    className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted"
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium">
                                                            {session.title}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {session.startTime.toLocaleString(
                                                                undefined,
                                                                {
                                                                    dateStyle: "medium",
                                                                    timeStyle: "short",
                                                                }
                                                            )}
                                                            {" · "}
                                                            {session.taskCount}{" "}
                                                            {session.taskCount === 1
                                                                ? "task"
                                                                : "tasks"}
                                                        </span>
                                                    </div>
                                                    <Badge variant={statusStyle.variant}>
                                                        {statusStyle.label}
                                                    </Badge>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}