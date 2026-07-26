// src/app/student/page.tsx
// Server Component - the "My Sessions" List page (List half of the
// List+Detail pattern; see sessions/[id]/page.tsx for the Detail half).
// On every load:
//   1. Reconcile any deadline-triggered ST events (lazy - see reconcile.ts)
//   2. Read the fresh balance and the Student's current Level (Sessions
//      only, at list-summary detail - full Task/Hint/Submission data is
//      fetched separately by the Session Details page when needed).
// Reconciliation runs first so the balance shown is always up to date,
// even though nothing runs on a schedule.
//
// Also reads `?message=...` in the URL - the Session Details page redirects
// here with this param when a student tries to open a Session they can't
// access yet (still upcoming) or that doesn't exist for them, so we can
// explain why they landed back on the list instead of silently dropping them.

import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { reconcileStudentST } from "@/lib/st-economy/reconcile";
import { getStudentBalance } from "@/lib/data/get-st-balance";
import { getStudentLevel } from "@/lib/data/get-student-level";
import { STBalanceCard } from "./st-balance-card";
import { SessionListView } from "./session-list-view";

const REDIRECT_MESSAGES: Record<string, string> = {
    "session-not-started": "That session hasn't started yet.",
    "session-not-found": "That session isn't available.",
};

export default async function StudentDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>;
}) {
    // Middleware already guards /student for the "student" role, but a
    // server component should never trust that alone - verify directly.
    // getCurrentStudentId also bridges Supabase Auth's UUID to the real
    // students-table id (they are NOT the same value - see get-current-user.ts).
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const { message } = await searchParams;
    const bannerText = message ? REDIRECT_MESSAGES[message] : undefined;

    await reconcileStudentST(studentId);
    const [balance, level] = await Promise.all([
        getStudentBalance(studentId),
        getStudentLevel(studentId),
    ]);

    return (
        <div className="space-y-6">
            {bannerText && (
                <Alert>
                    <Info />
                    <AlertDescription>{bannerText}</AlertDescription>
                </Alert>
            )}
            <STBalanceCard
                name={balance.name}
                levelSt={balance.levelSt}
                totalSt={balance.totalSt}
                zone={balance.zone}
                warningThreshold={balance.warningThreshold}
            />
            <SessionListView level={level} />
        </div>
    );
}