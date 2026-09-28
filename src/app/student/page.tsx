import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { reconcileStudentST } from "@/lib/st-economy/reconcile";
import { getStudentProfile } from "@/lib/data/get-student-name";
import { getStudentLevel } from "@/lib/data/get-student-level";
import { getStudentWeeks } from "@/lib/data/get-student-weeks";
import { SessionListView } from "./session-list-view";
import { StudentWeekListView } from "./student-week-list-view";

const REDIRECT_MESSAGES: Record<string, string> = {
    "session-not-started": "That session hasn't started yet. Please check back when it's live.",
    "session-not-found": "That session isn't available or does not belong to your group.",
    "week-not-started": "That training week hasn't started yet. Please check back when it's live.",
    "week-not-found": "That training week isn't available or does not belong to your group.",
};

export default async function StudentDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>;
}) {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const { message } = await searchParams;
    const bannerText = message ? REDIRECT_MESSAGES[message] : undefined;

    await reconcileStudentST(studentId);
    const profile = await getStudentProfile(studentId);

    const isBeginner = profile.groupType === "BEGINNER";
    const beginnerWeeksData = isBeginner ? await getStudentWeeks(studentId) : null;
    const level = !isBeginner ? await getStudentLevel(studentId) : null;

    return (
        <div className="space-y-6">
            {bannerText && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-amber-200">
                    <Info className="size-5 shrink-0 text-amber-400" />
                    <p className="text-sm font-medium">{bannerText}</p>
                </div>
            )}

            {isBeginner ? (
                <StudentWeekListView data={beginnerWeeksData} />
            ) : (
                <SessionListView level={level} />
            )}
        </div>
    );
}