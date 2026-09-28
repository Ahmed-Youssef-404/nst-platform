// src/app/student/st-history/page.tsx
// Server Component - "ST History" page.

import { redirect } from "next/navigation";
import { Coins } from "lucide-react";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentSTHistory } from "@/lib/data/get-st-balance";
import { StudentSTHistoryView } from "./st-history-view";

export default async function STHistoryPage() {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const initialPage = await getStudentSTHistory(studentId);

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/10 px-2.5 py-0.5 text-xs font-semibold text-gold-400 border border-gold-500/25">
                        <Coins className="size-3 text-gold-400" />
                        Star Token Economy
                    </span>
                </div>

                <h1 className="font-display text-2xl font-bold tracking-tight text-starlight-100">
                    ST Transaction Ledger
                </h1>
                <p className="text-sm text-starlight-400">
                    A comprehensive historical ledger of every Star Token reward earned, penalty levied, and tactical hint unlocked.
                </p>
            </div>

            <StudentSTHistoryView initialPage={initialPage} />
        </div>
    );
}
