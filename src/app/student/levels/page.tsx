// src/app/student/levels/page.tsx
// Server Component - "Level History" page. Lists every Level (active and
// past) in the logged-in Student's Group, newest first, so a Student can
// look back at Sessions/Tasks/Hints/Submissions from Levels they've
// already moved on from. The active Level shows up here too (with an
// "Active" badge) so the picture is complete, even though day-to-day use
// still happens through "My Sessions".
//
// Middleware already guards /student for the "student" role, but a server
// component should never trust that alone (same pattern as other
// /student pages).

import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentLevelHistory } from "@/lib/data/get-student-level-history";
import { LevelHistoryListView } from "./level-history-list-view";

export default async function LevelHistoryPage() {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const levels = await getStudentLevelHistory(studentId);
    console.log(levels)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-xl font-semibold">Level History</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Every Level you&apos;ve been part of, including your current one.
                </p>
            </div>

            {levels.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
                    <History className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        No Levels yet. They&apos;ll show up here once your Group&apos;s
                        first Level starts.
                    </p>
                </div>
            ) : (
                <LevelHistoryListView levels={levels} />
            )}
        </div>
    );
}