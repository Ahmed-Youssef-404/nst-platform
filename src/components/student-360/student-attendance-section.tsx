// src/components/student-360/student-attendance-section.tsx
"use client";

import type { Student360AttendanceRecord } from "@/lib/data/get-student-360";
import { formatDateTime } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Star,
    MessageSquare,
    UserCheck,
    Clock,
    Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentAttendanceSection({
    records,
    supported = true,
}: {
    records: Student360AttendanceRecord[];
    supported?: boolean;
}) {
    if (!supported) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/40 p-10 text-center backdrop-blur-md">
                <div className="flex size-12 items-center justify-center rounded-xl bg-space-850 border border-border/70 text-starlight-400 mb-3">
                    <Calendar className="size-6" />
                </div>
                <h3 className="font-display text-base font-bold text-starlight-100">
                    Self-Paced Track (Attendance Not Applicable)
                </h3>
                <p className="mt-1 text-xs text-starlight-400 max-w-md">
                    Beginner-track groups do not conduct scheduled live lecture sessions. Progress is measured through
                    weekly video missions, uploaded required files, and rubric-graded tasks.
                </p>
            </div>
        );
    }

    const attendedCount = records.filter((r) => r.status === "PRESENT").length;
    const missedCount = records.filter((r) => r.status === "ABSENT").length;
    const totalRecorded = attendedCount + missedCount;
    const rate = totalRecorded > 0 ? Math.round((attendedCount / totalRecorded) * 100) : 0;

    const feedbacks = records.filter((r) => r.feedback !== null);
    const avgRating =
        feedbacks.length > 0
            ? Math.round(
                  (feedbacks.reduce((sum, r) => sum + (r.feedback?.rating ?? 0), 0) /
                      feedbacks.length) *
                      10
              ) / 10
            : null;

    return (
        <div className="space-y-6">
            {/* Summary metrics strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-starlight-400">Total Recorded</span>
                    <p className="text-xl font-bold font-display text-starlight-100">{totalRecorded}</p>
                    <p className="text-[10px] text-starlight-400">Recorded sessions</p>
                </div>

                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-success-400">Sessions Attended</span>
                    <p className="text-xl font-bold font-display text-success-400">{attendedCount}</p>
                    <p className="text-[10px] text-starlight-400">+10 ST awarded per attendance</p>
                </div>

                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-destructive">Sessions Missed</span>
                    <p className="text-xl font-bold font-display text-destructive">{missedCount}</p>
                    <p className="text-[10px] text-starlight-400">-20 ST penalty per missed session</p>
                </div>

                <div className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gold-400">Overall Attendance Rate</span>
                    <p className="text-xl font-bold font-display text-gold-300">{rate}%</p>
                    <p className="text-[10px] text-starlight-400">
                        {avgRating !== null ? `Avg cadet feedback: ${avgRating}/10 ★` : "No cadet feedback yet"}
                    </p>
                </div>
            </div>

            {/* List of session records */}
            <div className="space-y-3">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-starlight-200 flex items-center gap-2">
                    <Clock className="size-4 text-violet-400" />
                    Session Attendance & Cadet Feedback Log
                </h3>

                {records.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/80 bg-space-950/40 p-8 text-center text-xs text-starlight-400">
                        No session attendance has been logged for this cadet yet.
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {records.map((rec) => {
                            const isPresent = rec.status === "PRESENT";

                            return (
                                <div
                                    key={rec.id}
                                    className="p-4 rounded-xl border border-border/80 bg-space-900/70 hover:border-gold-500/35 transition-all space-y-3"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="font-bold text-sm text-starlight-100">
                                                    {rec.sessionTitle}
                                                </span>
                                                <Badge
                                                    className={cn(
                                                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                                        isPresent
                                                            ? "bg-success-500/15 text-success-400 border-success-500/30"
                                                            : "bg-destructive/15 text-destructive border-destructive/30"
                                                    )}
                                                >
                                                    {isPresent ? (
                                                        <CheckCircle2 className="size-3 mr-1" />
                                                    ) : (
                                                        <XCircle className="size-3 mr-1" />
                                                    )}
                                                    {rec.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-starlight-400">
                                                {rec.levelName} · Scheduled: {formatDateTime(rec.sessionStartTime)}
                                            </p>
                                        </div>

                                        <div className="text-right text-xs text-starlight-400">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-mono">
                                                Recorded {formatDateTime(rec.recordedAt)}
                                            </span>
                                            {rec.recordedByName && (
                                                <p className="text-[11px] text-violet-300">
                                                    by {rec.recordedByName}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cadet feedback card if submitted */}
                                    {rec.feedback && (
                                        <div className="p-3 rounded-lg bg-space-950/70 border border-gold-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-gold-400 font-bold font-mono">
                                                    <Star className="size-3.5 fill-gold-400 text-gold-400" />
                                                    <span>{rec.feedback.rating} / 10</span>
                                                </div>
                                                <span className="text-starlight-400">Cadet Session Rating</span>
                                            </div>

                                            {rec.feedback.comment && (
                                                <p className="text-starlight-200 italic truncate max-w-md">
                                                    &ldquo;{rec.feedback.comment}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
