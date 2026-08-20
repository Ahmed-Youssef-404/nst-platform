// src/app/student/ranking/page.tsx
// Server Component - "Ranking" page. Shows a "Total ST" tab (top 3, ranked
// by avgSt) plus one tab per Level the Group has ever had (ranked by that
// Level's LevelStBalance) - all rendered inside ranking-view.tsx (Client
// Component), which also owns the tab state and podium/confetti
// interactivity.
//
// Middleware already guards /student for the "student" role, but a server
// component should never trust that alone (same pattern as other
// /student pages).

import { redirect } from "next/navigation";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentRanking } from "@/lib/data/get-student-ranking";
import { StudentRankingView } from "./ranking-view";
import { Trophy } from "lucide-react";

export default async function RankingPage() {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const ranking = await getStudentRanking(studentId);

    return (
        <div className="space-y-6 relative z-50">
            <div>
                <h1 className="font-display text-xl font-semibold">Ranking</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {ranking
                        ? `See how you stack up against ${ranking.groupName}, by Level or overall.`
                        : "See how you stack up against your group."}
                </p>
            </div>

            {ranking ? (
                <StudentRankingView ranking={ranking} currentStudentId={studentId} />
            ) : (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
                    <Trophy className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        No Level yet. Ranking will show up here once your group&apos;s
                        first Level starts.
                    </p>
                </div>
            )}
        </div>
    );
}