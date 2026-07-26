// src/lib/task-progress.ts
// Computes the Session-level progress summary shown on the Student's
// Session Details page: total / submitted / not submitted / graded.
// "Submitted" means a submission row exists, regardless of whether it has
// been graded yet - graded is a separate, overlapping count (a submitted
// Task can also be graded), not a mutually exclusive fourth bucket.

import type { StudentTaskView } from "@/lib/data/get-student-level";

export interface TaskProgressSummary {
    total: number;
    submitted: number;
    notSubmitted: number;
    graded: number;
}

export function computeTaskProgress(
    tasks: StudentTaskView[]
): TaskProgressSummary {
    const total = tasks.length;
    const submitted = tasks.filter((task) => task.submission !== null).length;
    const graded = tasks.filter((task) => task.submission?.isGraded).length;

    return {
        total,
        submitted,
        notSubmitted: total - submitted,
        graded,
    };
}