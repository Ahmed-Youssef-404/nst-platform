// src/components/time-progress-indicator.tsx
// Time-elapsed bar for the Week (Beginner) and Session (Intermediate) header
// cards. Purely time-based: it never looks at submissions or completion.
"use client";

import { useMemo } from "react";
import { useNow } from "@/hooks/use-now";
import {
    computeProgressColors,
    computeTimeProgress,
    toTimestamp,
    type DateInput,
} from "@/lib/time-progress";
import { formatDateTime } from "@/lib/format-date";

interface TimeProgressIndicatorProps {
    /** Week.startDate / Session.startTime */
    startDate: DateInput;
    /** Week.endDate / latest Task deadline of the Session */
    deadline: DateInput;
    /** Name used in the accessible label, e.g. "Week" or "Session". */
    subject?: string;
    /** Show start/deadline captions under the bar. */
    showDates?: boolean;
}

export function TimeProgressIndicator({
    startDate,
    deadline,
    subject = "Week",
    showDates = true,
}: TimeProgressIndicatorProps) {
    const now = useNow(60_000);

    // Depend on the numeric timestamps so a refreshed Date object with the same
    // value does not recompute, while an edited date does.
    const startMs = toTimestamp(startDate);
    const deadlineMs = toTimestamp(deadline);

    const progress = useMemo(
        () => (now === null ? null : computeTimeProgress(startMs, deadlineMs, now)),
        [startMs, deadlineMs, now]
    );
    const colors = useMemo(
        () => (progress ? computeProgressColors(progress) : null),
        [progress]
    );

    // Missing / invalid dates (or deadline before start): show nothing rather
    // than a misleading bar.
    if (startMs === null || deadlineMs === null || deadlineMs < startMs) return null;

    // First render (server + hydration): reserve the space, reveal on mount.
    if (!progress || !colors) {
        return (
            <div className="border-t border-border/60 pt-4" aria-hidden="true">
                <div className="h-2.5 rounded-full bg-space-950/80 border border-border/60" />
                <div className="h-4" />
            </div>
        );
    }

    const percent = Math.round(progress.percent);
    const caption = progress.isPastDeadline
        ? "Scheduled period ended"
        : progress.percent <= 0
            ? "Not started yet"
            : "Time elapsed";

    return (
        <div className="border-t border-border/60 pt-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-starlight-400 uppercase tracking-wider">
                    {caption}
                </span>
                <span className="font-mono text-sm font-bold text-starlight-100 tabular-nums">
                    {percent}%
                </span>
            </div>

            <div
                role="progressbar"
                aria-label={`${subject} time elapsed`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-valuetext={`${percent}% of the scheduled time has elapsed${progress.isPastDeadline ? ". The deadline has passed." : ""}`}
                className="h-2.5 w-full overflow-hidden rounded-full border border-border/60 bg-space-950/80"
            >
                <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{
                        width: `${progress.percent}%`,
                        backgroundImage: colors.gradient,
                        boxShadow: colors.glow,
                    }}
                />
            </div>

            {showDates && (
                <div className="flex items-center justify-between gap-3 text-[11px] text-starlight-400">
                    <span>{formatDateTime(new Date(startMs))}</span>
                    <span>{formatDateTime(new Date(deadlineMs))}</span>
                </div>
            )}
        </div>
    );
}
