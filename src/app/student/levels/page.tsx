// src/app/student/levels/page.tsx
// Server Component - "Level History" page.

import { redirect } from "next/navigation";
import { History, Sparkles } from "lucide-react";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentLevelHistory } from "@/lib/data/get-student-level-history";
import { LevelHistoryListView } from "./level-history-list-view";

export default async function LevelHistoryPage() {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const levels = await getStudentLevelHistory(studentId);

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/10 px-2.5 py-0.5 text-xs font-semibold text-gold-400 border border-gold-500/25">
                        <History className="size-3 text-gold-400" />
                        Curriculum Archive
                    </span>
                </div>

                <h1 className="font-display text-2xl font-bold tracking-tight text-starlight-100">
                    Level Progression & History
                </h1>
                <p className="text-sm text-starlight-400">
                    Access every Level you&apos;ve participated in, review past lectures, and study archived tasks with completely free unlocked hints.
                </p>
            </div>

            {levels.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-space-900/30 p-12 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400 border border-gold-500/20 mb-3 shadow-gold">
                        <History className="size-6 text-gold-400" />
                    </div>
                    <h3 className="font-display text-base font-bold text-starlight-100">
                        No Levels Recorded Yet
                    </h3>
                    <p className="mt-1 text-xs text-starlight-400 max-w-sm mx-auto">
                        Your level history will record your journey once your cohort&apos;s curriculum commences.
                    </p>
                </div>
            ) : (
                <LevelHistoryListView levels={levels} />
            )}
        </div>
    );
}