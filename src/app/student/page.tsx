// src/app/student/page.tsx
// Server Component. On every load:
//   1. Reconcile any deadline-triggered ST events (lazy - see reconcile.ts)
//   2. Read the fresh balance and the Student's current Level (Sessions,
//      Tasks, Hints, own Submissions) and render both.
// Reconciliation runs first so the balance shown is always up to date,
// even though nothing runs on a schedule.

import { redirect } from "next/navigation";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { reconcileStudentST } from "@/lib/st-economy/reconcile";
import { getStudentBalance } from "@/lib/data/get-st-balance";
import { getStudentLevel } from "@/lib/data/get-student-level";
import { STBalanceCard } from "./st-balance-card";
import { StudentLevelSessions } from "./student-dashboard-view";

export default async function StudentDashboardPage() {
    // Middleware already guards /student for the "student" role, but a
    // server component should never trust that alone - verify directly.
    // getCurrentStudentId also bridges Supabase Auth's UUID to the real
    // students-table id (they are NOT the same value - see get-current-user.ts).
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    await reconcileStudentST(studentId);
    const [balance, level] = await Promise.all([
        getStudentBalance(studentId),
        getStudentLevel(studentId),
    ]);

    return (
        <div className="space-y-6">
            <STBalanceCard
                name={balance.name}
                levelSt={balance.levelSt}
                totalSt={balance.totalSt}
                zone={balance.zone}
                warningThreshold={balance.warningThreshold}
            />
            <StudentLevelSessions studentId={studentId} level={level} />
        </div>
    );
}