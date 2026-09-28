// src/app/student/levels/[id]/page.tsx
// Server Component - Detail half of the Level History List+Detail pattern

import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Archive, Sparkles } from "lucide-react";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentLevelById } from "@/lib/data/get-student-level";
import { SessionListView } from "@/app/student/session-list-view";

export default async function LevelHistoryDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const { id } = await params;
    const level = await getStudentLevelById(studentId, id);

    if (!level) {
        redirect("/student/levels");
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Link
                    href="/student/levels"
                    className="inline-flex items-center gap-2 rounded-xl bg-space-900/80 px-3.5 py-1.5 text-xs font-medium text-starlight-300 border border-border/60 hover:text-gold-300 hover:border-gold-500/30 hover:bg-space-850 transition-all"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Level History</span>
                </Link>

                {!level.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-space-850 px-3 py-1 text-xs font-semibold text-starlight-400 border border-border/70">
                        <Archive className="size-3 text-starlight-400" />
                        Archived Study Curriculum
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Current Active Level
                    </span>
                )}
            </div>

            <SessionListView level={level} />
        </div>
    );
}