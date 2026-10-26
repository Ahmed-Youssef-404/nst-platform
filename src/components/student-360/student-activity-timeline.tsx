// src/components/student-360/student-activity-timeline.tsx
"use client";

import { useState } from "react";
import type { Student360TimelineEvent } from "@/lib/data/get-student-360";
import { formatDateTime } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    Coins,
    CheckCircle2,
    SlidersHorizontal,
    Clock,
    ShoppingBag,
    Sparkles,
    Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentActivityTimeline({
    events,
}: {
    events: Student360TimelineEvent[];
}) {
    const [filterType, setFilterType] = useState<string>("ALL");

    const filteredEvents = events.filter((e) => {
        if (filterType === "ALL") return true;
        if (filterType === "ST" && (e.type === "ST_REWARD" || e.type === "ST_PENALTY" || e.type === "INSTRUCTOR_ADJUSTMENT")) return true;
        if (filterType === "ACADEMIC" && (e.type === "TASK_SUBMISSION" || e.type === "GRADE_FINALIZED" || e.type === "WEEK_RESOURCE")) return true;
        if (filterType === "ATTENDANCE" && e.type === "ATTENDANCE") return true;
        if (filterType === "STORE" && e.type === "STORE_PURCHASE") return true;
        return false;
    });

    const getIcon = (type: Student360TimelineEvent["type"]) => {
        switch (type) {
            case "ST_REWARD":
            case "ST_PENALTY":
                return Coins;
            case "INSTRUCTOR_ADJUSTMENT":
                return SlidersHorizontal;
            case "TASK_SUBMISSION":
            case "GRADE_FINALIZED":
            case "WEEK_RESOURCE":
                return CheckCircle2;
            case "ATTENDANCE":
                return Clock;
            case "STORE_PURCHASE":
                return ShoppingBag;
            default:
                return Activity;
        }
    };

    const getVariantBadgeClass = (variant?: Student360TimelineEvent["badgeVariant"]) => {
        switch (variant) {
            case "gold":
                return "bg-gold-500/15 text-gold-300 border-gold-500/35 shadow-gold";
            case "success":
                return "bg-success-500/15 text-success-400 border-success-500/30";
            case "danger":
                return "bg-destructive/15 text-destructive border-destructive/30";
            case "info":
                return "bg-blue-500/15 text-blue-300 border-blue-500/30";
            default:
                return "bg-space-850 text-starlight-300 border-border/70";
        }
    };

    return (
        <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-space-950/60 border border-border/80 overflow-x-auto w-fit">
                {[
                    { id: "ALL", label: `All Events (${events.length})` },
                    { id: "ACADEMIC", label: "Submissions & Grades" },
                    { id: "ST", label: "ST Econometrics" },
                    { id: "ATTENDANCE", label: "Attendance" },
                    { id: "STORE", label: "Store Purchases" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilterType(tab.id)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                            filterType === tab.id
                                ? "bg-gold-500/15 text-gold-300 border border-gold-500/35 shadow-gold"
                                : "text-starlight-400 hover:text-starlight-100 hover:bg-space-850"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Timeline Stream */}
            {filteredEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-space-900/40 p-10 text-center text-xs text-starlight-400">
                    No milestone events match this filter category.
                </div>
            ) : (
                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
                    {filteredEvents.map((event) => {
                        const Icon = getIcon(event.type);

                        return (
                            <div key={event.id} className="relative group">
                                {/* Dot icon on timeline line */}
                                <div className="absolute -left-6 sm:-left-8 top-1 flex size-6 sm:size-7 items-center justify-center rounded-full bg-space-900 border border-gold-500/40 text-gold-400 shadow-gold group-hover:scale-110 transition-transform">
                                    <Icon className="size-3 sm:size-3.5" />
                                </div>

                                {/* Event Card */}
                                <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-space-900/70 hover:border-gold-500/35 transition-all space-y-1.5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-sm text-starlight-100">
                                                {event.title}
                                            </span>
                                            {event.badgeLabel && (
                                                <Badge
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono",
                                                        getVariantBadgeClass(event.badgeVariant)
                                                    )}
                                                >
                                                    {event.badgeLabel}
                                                </Badge>
                                            )}
                                        </div>

                                        <span className="font-mono text-[11px] text-starlight-400 shrink-0">
                                            {formatDateTime(event.timestamp)}
                                        </span>
                                    </div>

                                    {event.description && (
                                        <p className="text-xs text-starlight-300">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
