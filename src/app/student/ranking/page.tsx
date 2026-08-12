// src/app/student/ranking/page.tsx
// Server Component - "Ranking" page. Ranks every Student in the logged-in
// Student's Group by their current levelSt (highest first), rendered as a
// top-3 podium + a plain list for everyone else. All ranking/confetti
// interactivity lives in ranking-view.tsx (Client Component).
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
                        ? `See how you stack up against ${ranking.groupName} in ${ranking.levelName}.`
                        : "See how you stack up against your group this Level."}
                </p>
            </div>

            {ranking ? (
                <StudentRankingView ranking={ranking} currentStudentId={studentId} />
            ) : (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
                    <Trophy className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        No active Level yet. Ranking will show up here once your group&apos;s
                        Level starts.
                    </p>
                </div>
            )}
        </div>
    );
}