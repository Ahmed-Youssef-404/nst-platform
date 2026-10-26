// src/app/instructor/students/[id]/instructor-student-detail-view.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Student360ProfileData } from "@/lib/data/get-student-360";
import { Student360View } from "@/components/student-360/student-360-view";
import { StAdjustDialog } from "../st-adjust-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SlidersHorizontal, Sparkles } from "lucide-react";

export function InstructorStudentDetailView({
    data: initialData,
    backGroupId,
}: {
    data: Student360ProfileData;
    backGroupId?: string;
}) {
    const [data, setData] = useState(initialData);
    const [showAdjustDialog, setShowAdjustDialog] = useState(false);

    function handleAdjustSuccess(studentId: string, newBalance: number) {
        setData((prev) => ({
            ...prev,
            overview: {
                ...prev.overview,
                balance: {
                    ...prev.overview.balance,
                    authoritativeBalance: newBalance,
                    currentLevelSt:
                        prev.overview.group.type === "INTERMEDIATE"
                            ? newBalance
                            : prev.overview.balance.currentLevelSt,
                    beginnerSt:
                        prev.overview.group.type === "BEGINNER"
                            ? newBalance
                            : prev.overview.balance.beginnerSt,
                },
            },
        }));
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Top Navigation & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Link
                            href="/instructor/students"
                            className="inline-flex items-center gap-1.5 text-xs text-starlight-400 hover:text-gold-300 transition-colors"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Back to Student ST</span>
                        </Link>
                        <span className="text-starlight-400">·</span>
                        <span className="inline-flex items-center gap-1 text-xs text-gold-400 font-semibold">
                            <Sparkles className="size-3" />
                            <span>Instructor Student Dossier</span>
                        </span>
                    </div>

                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-starlight-100">
                        {data.overview.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-starlight-300">
                        Detailed pedagogical tracking, grading breakdown, attendance log, and Star Token economy.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowAdjustDialog(true)}
                        className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs gap-1.5"
                    >
                        <SlidersHorizontal className="size-3.5" />
                        <span>Adjust ST</span>
                    </Button>
                </div>
            </div>

            {/* Student 360 View - Instructor Focused */}
            <Student360View data={data} role="instructor" />

            {/* ST Adjust Dialog */}
            {showAdjustDialog && (
                <StAdjustDialog
                    student={{
                        id: data.overview.id,
                        name: data.overview.name,
                        email: data.overview.email,
                        balance: data.overview.balance.authoritativeBalance,
                    }}
                    onClose={() => setShowAdjustDialog(false)}
                    onSuccess={handleAdjustSuccess}
                />
            )}
        </div>
    );
}
