// src/components/student/task-pager.tsx
// Shows Tasks one at a time with quick stepper navigation and prev/next controls.

"use client";

import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Sparkles,
    Circle,
    Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
            <div className="rounded-2xl border border-dashed border-border/70 bg-space-900/30 p-10 text-center">
                <Inbox className="size-8 mx-auto text-starlight-400 mb-2" />
                <p className="text-sm font-medium text-starlight-300">
                    No Tasks Assigned to This Session
                </p>
                <p className="text-xs text-starlight-400 mt-1">
                    Check back after the session concludes for exercises and missions.
                </p>
            </div>
        );
    }

    const currentTask = tasks[index];
    const canGoPrev = index > 0;
    const canGoNext = index < tasks.length - 1;

    return (
        <div className="rounded-2xl border border-border/80 bg-space-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
            {/* Task Stepper & Navigation Bar */}
            <div className="border-b border-border/70 bg-space-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canGoPrev}
                        onClick={() => setIndex((i) => i - 1)}
                        className="h-8 px-3 rounded-lg border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 hover:text-gold-300 disabled:opacity-40"
                    >
                        <ChevronLeft className="size-4 mr-1" />
                        <span className="hidden sm:inline">Previous</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gold-400 uppercase tracking-wider">
                            Mission {index + 1} of {tasks.length}
                        </span>
                        {currentTask.isBonus && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-gold-300 border border-gold-500/30">
                                <Sparkles className="size-2.5 text-gold-400" />
                                Bonus
                            </span>
                        )}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canGoNext}
                        onClick={() => setIndex((i) => i + 1)}
                        className="h-8 px-3 rounded-lg border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 hover:text-gold-300 disabled:opacity-40"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="size-4 ml-1" />
                    </Button>
                </div>

                {/* Direct Task Jump Pills */}
                {tasks.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                        {tasks.map((task, i) => {
                            const isSelected = i === index;
                            const isSubmitted = task.submission !== null;
                            const isGraded = task.submission?.isGraded ?? false;

                            return (
                                <button
                                    key={task.id}
                                    type="button"
                                    onClick={() => setIndex(i)}
                                    className={`
                                        flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0
                                        ${
                                            isSelected
                                                ? "bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-gold font-bold"
                                                : "bg-space-850/60 text-starlight-400 hover:bg-space-800 hover:text-starlight-200 border border-border/50"
                                        }
                                    `}
                                >
                                    {isGraded ? (
                                        <CheckCircle2 className="size-3 text-emerald-400" />
                                    ) : isSubmitted ? (
                                        <CheckCircle2 className="size-3 text-gold-400" />
                                    ) : (
                                        <Circle className="size-2 text-starlight-400/60" />
                                    )}
                                    <span>Task {i + 1}</span>
                                    {task.isBonus && (
                                        <Sparkles className="size-2.5 text-amber-400 ml-0.5" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Task Detail Card */}
            <div className="p-6 md:p-8">
                <TaskDetailCard
                    key={currentTask.id}
                    studentId={studentId}
                    task={currentTask}
                    isHistorical={isHistorical}
                />
            </div>
        </div>
    );
}