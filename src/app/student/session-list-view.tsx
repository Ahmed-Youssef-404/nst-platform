// src/app/student/session-list-view.tsx
// The Student's main "My Sessions" list (List half of the List+Detail
// pattern - see session-detail-view.tsx for the Detail half).
//
// Each Session is a full clickable card (same pattern as
// InstructorDashboardView: a Link wraps the whole card, not just a button
// inside it) EXCEPT "upcoming" Sessions, which are fully disabled here -
// no Link wrapper, visually muted - per client requirement that students
// must not access a Session until it's ongoing or completed. This is a
// UI-only guard; the real enforcement is server-side on the detail page
// itself (see sessions/[id]/page.tsx), since a disabled card alone doesn't
// stop someone from typing the URL directly.

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StudentLevelView, StudentSessionView } from "@/lib/data/get-student-level";
import type { SessionStatus } from "@/lib/data/get-my-groups";

const STATUS_STYLES: Record<
    SessionStatus,
    { label: string; variant: "outline" | "success" | "secondary" }
> = {
    upcoming: { label: "Upcoming", variant: "outline" },
    ongoing: { label: "Ongoing", variant: "success" },
    completed: { label: "Completed", variant: "secondary" },
};

export function SessionListView({ level }: { level: StudentLevelView | null }) {
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
                <h2 className="font-display text-lg font-semibold">
                    Level {level.levelNumber} — {level.name}
                </h2>
                <p className="text-sm text-muted-foreground">{level.groupName}</p>
            </div>

            {level.sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No Sessions have been scheduled for this Level yet.
                </p>
            ) : (
                <div className="space-y-3">
                    {level.sessions.map((session) => (
                        <SessionListCard key={session.id} session={session} />
                    ))}
                </div>
            )}
        </div>
    );
}

function SessionListCard({ session }: { session: StudentSessionView }) {
    const statusStyle = STATUS_STYLES[session.status];
    const isUpcoming = session.status === "upcoming";
    const taskCount = session.tasks.length;

    const cardBody = (
        <Card
            className={
                isUpcoming
                    ? "opacity-60"
                    : "transition-colors hover:border-primary/50"
            }
        >
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{session.title}</CardTitle>
                <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    {session.startTime.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                </span>
                <span>
                    {taskCount} {taskCount === 1 ? "task" : "tasks"}
                </span>
            </CardContent>
        </Card>
    );

    if (isUpcoming) {
        return (
            <div aria-disabled="true" className="cursor-not-allowed">
                {cardBody}
            </div>
        );
    }

    return (
        <Link href={`/student/sessions/${session.id}`} className="block">
            {cardBody}
        </Link>
    );
}