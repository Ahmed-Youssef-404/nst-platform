import { redirect } from "next/navigation";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentProfile } from "@/lib/data/get-student-name";
import { getStudentRanking } from "@/lib/data/get-student-ranking";
import { getBeginnerStudentRanking } from "@/lib/data/get-beginner-ranking";
import { StudentRankingView } from "./ranking-view";
import { BeginnerRankingView } from "./beginner-ranking-view";
import { Trophy } from "lucide-react";

export default async function RankingPage() {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const profile = await getStudentProfile(studentId);
    const isBeginner = profile.groupType === "BEGINNER";

    const beginnerRanking = isBeginner ? await getBeginnerStudentRanking(studentId) : null;
    const intermediateRanking = !isBeginner ? await getStudentRanking(studentId) : null;

    const groupName = isBeginner ? beginnerRanking?.groupName : intermediateRanking?.groupName;

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/10 px-2.5 py-0.5 text-xs font-semibold text-gold-400 border border-gold-500/25">
                        <Trophy className="size-3 text-gold-400" />
                        Leaderboard
                    </span>
                    {groupName && (
                        <span className="rounded-full bg-space-850 px-2.5 py-0.5 text-xs font-mono text-starlight-300 border border-border/70">
                            {groupName} {isBeginner && "(Beginner Track)"}
                        </span>
                    )}
                </div>

                <h1 className="font-display text-2xl font-bold tracking-tight text-starlight-100">
                    Cadet Rankings & Leaderboards
                </h1>
                <p className="text-sm text-starlight-400">
                    {groupName
                        ? `Track your performance and ranking across ${groupName}.`
                        : "Compare your standing with peer cadets in your cohort."}
                </p>
            </div>

            {isBeginner && beginnerRanking ? (
                <BeginnerRankingView ranking={beginnerRanking} currentStudentId={studentId} />
            ) : !isBeginner && intermediateRanking ? (
                <StudentRankingView ranking={intermediateRanking} currentStudentId={studentId} />
            ) : (
                <div className="rounded-2xl border border-dashed border-border/80 bg-space-900/30 p-12 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400 border border-gold-500/20 mb-3 shadow-gold">
                        <Trophy className="size-6 text-gold-400" />
                    </div>
                    <h3 className="font-display text-base font-bold text-starlight-100">
                        No Leaderboard Data Yet
                    </h3>
                    <p className="mt-1 text-xs text-starlight-400 max-w-sm mx-auto">
                        Rankings will be inaugurated here once Star Tokens are awarded across your cohort.
                    </p>
                </div>
            )}
        </div>
    );
}