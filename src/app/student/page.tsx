// src/app/student/page.tsx
// Server Component - the "My Sessions" List page

import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { reconcileStudentST } from "@/lib/st-economy/reconcile";
import { getStudentLevel } from "@/lib/data/get-student-level";
import { SessionListView } from "./session-list-view";

const REDIRECT_MESSAGES: Record<string, string> = {
    "session-not-started": "That session hasn't started yet. Please check back when it's live.",
    "session-not-found": "That session isn't available or does not belong to your group.",
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
    const level = await getStudentLevel(studentId);

    return (
        <div className="space-y-6">
            {bannerText && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-amber-200">
                    <Info className="size-5 shrink-0 text-amber-400" />
                    <p className="text-sm font-medium">{bannerText}</p>
                </div>
            )}
            <SessionListView level={level} />
        </div>
    );
}