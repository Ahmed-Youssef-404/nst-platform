// src/lib/st-economy/reconcile.ts
//
// Single entry point for all deadline-triggered ST checks. Call this once,
// server-side, whenever a student's balance/dashboard is about to be shown
// (or whenever an instructor opens a specific student's profile). It runs
// all three lazy checks in sequence. Every check inside is idempotent
// (applySTChangeOnce), so calling this too often is harmless - it just does
// a few no-op reads on repeat visits within the same day.
//
// Not wired to any UI yet - the pages/actions that render a balance should
// call this first. See get-st-balance.ts for the fetcher that does this.

import { reconcileTaskDeadlines, reconcileFinishAllTasks } from "./deadline-events";
import { reconcileWeeklyMission } from "./weekly-mission";

export async function reconcileStudentST(studentId: string) {
    const [tasks, finishAll, weekly] = await Promise.all([
        reconcileTaskDeadlines(studentId),
        reconcileFinishAllTasks(studentId),
        reconcileWeeklyMission(studentId),
    ]);

    return {
        taskDeadlinesScored: tasks.scored,
        finishAllScored: finishAll.scored,
        weeklyMissionsScored: weekly.scored,
    };
}