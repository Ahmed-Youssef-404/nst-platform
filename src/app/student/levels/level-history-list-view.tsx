// src/app/student/levels/level-history-list-view.tsx
// One clickable card per Level (same "whole card is a Link" pattern as
// SessionListView), newest first. The active Level gets an "Active" badge
// but is otherwise a normal, clickable card - unlike the "upcoming"
// Session cards elsewhere, there's no reason to disable it here.

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StudentLevelSummary } from "@/lib/data/get-student-level-history";
import { formatDateTime } from "@/lib/format-date";

export function LevelHistoryListView({
    levels,
}: {
    levels: StudentLevelSummary[];
}) {
    return (
        <div className="space-y-3">
            {levels.map((level) => (
                <Link
                    key={level.id}
                    href={`/student/levels/${level.id}`}
                    className="block"
                >
                    <Card className="transition-colors hover:border-primary/50">
                        <CardHeader className="flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base">
                                Level {level.levelNumber} — {level.name}
                            </CardTitle>
                            {level.isActive && <Badge variant="success">Active</Badge>}
                        </CardHeader>
                        <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Started {formatDateTime(level.startDate)}</span>
                            <span>
                                {level.sessionCount}{" "}
                                {level.sessionCount === 1 ? "session" : "sessions"}
                            </span>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}