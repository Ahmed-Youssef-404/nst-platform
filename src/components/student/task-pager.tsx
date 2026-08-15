// src/components/student/task-pager.tsx
// Shows Tasks one at a time (not stacked) with left/right arrow
// navigation between them - a pager/carousel pattern per client request.
// Position is shown as plain text ("Task X of Y"), no dot indicators.
// No ordering constraint: the student can move freely in either
// direction, arrows just step to the next/previous array index.

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TaskDetailCard } from "@/components/student/task-detail-card";
import type { StudentTaskView } from "@/lib/data/get-student-level";

export function TaskPager({
    studentId,
    tasks,
    isHistorical = false,
}: {
    studentId: string;
    tasks: StudentTaskView[];
    isHistorical?: boolean;
}) {
    const [index, setIndex] = useState(0);

    if (tasks.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No Tasks in this Session.
            </p>
        );
    }

    const currentTask = tasks[index];
    const canGoPrev = index > 0;
    const canGoNext = index < tasks.length - 1;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!canGoPrev}
                    onClick={() => setIndex((i) => i - 1)}
                    aria-label="Previous task"
                >
                    <ChevronLeft />
                </Button>
                <p className="text-sm font-bold text-muted-foreground">
                    Task {index + 1} of {tasks.length}
                </p>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!canGoNext}
                    onClick={() => setIndex((i) => i + 1)}
                    aria-label="Next task"
                >
                    <ChevronRight />
                </Button>
            </CardHeader>
            <CardContent>
                <TaskDetailCard
                    key={currentTask.id}
                    studentId={studentId}
                    task={currentTask}
                    isHistorical={isHistorical}
                />
            </CardContent>
        </Card>
    );
}