// src/app/student/levels/level-history-list-view.tsx
import Link from "next/link";
import {
    Calendar,
    ChevronRight,
    Layers,
    Sparkles,
    CheckCircle2,
    BookOpen,
    Archive,
} from "lucide-react";
import type { StudentLevelSummary } from "@/lib/data/get-student-level-history";
import { formatDateTime } from "@/lib/format-date";

export function LevelHistoryListView({
    levels,
}: {
    levels: StudentLevelSummary[];
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {levels.map((level) => {
                const isActive = level.isActive;

                return (
                    <Link
                        key={level.id}
                        href={`/student/levels/${level.id}`}
                        className="group block h-full focus:outline-hidden"
                    >
                        <div
                            className={`
                                relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 h-full
                                ${
                                    isActive
                                        ? "border-gold-500/40 bg-gradient-to-br from-space-850 via-space-900 to-space-950 shadow-gold hover:border-gold-500/60 ring-1 ring-gold-500/20"
                                        : "border-border/70 bg-space-900/60 hover:bg-space-850/80 hover:border-gold-500/30 hover:shadow-gold"
                                }
                            `}
                        >
                            <div className="space-y-3">
                                {/* Header: Level number & status */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs font-bold text-gold-400">
                                        LEVEL {level.levelNumber.toString().padStart(2, "0")}
                                    </span>

                                    {isActive ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                                            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                                            Active Orbit
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-space-800 px-2.5 py-0.5 text-xs font-medium text-starlight-400 border border-border/70">
                                            <Archive className="size-3 text-starlight-400" />
                                            Archived
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <div>
                                    <h3 className="font-display text-lg font-bold text-starlight-100 group-hover:text-gold-300 transition-colors">
                                        {level.name || `Level ${level.levelNumber}`}
                                    </h3>
                                </div>
                            </div>

                            {/* Meta & Footer */}
                            <div className="mt-6 pt-4 border-t border-border/50 space-y-3 text-xs">
                                <div className="flex items-center justify-between text-starlight-300">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="size-3.5 text-starlight-400" />
                                        <span>Started {formatDateTime(level.startDate)}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 font-mono text-starlight-300">
                                        <Layers className="size-3.5 text-gold-400" />
                                        <span>
                                            {level.sessionCount}{" "}
                                            {level.sessionCount === 1 ? "session" : "sessions"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 text-starlight-400 group-hover:text-starlight-200 transition-colors">
                                    <span className="text-[11px]">
                                        {isActive
                                            ? "Explore ongoing missions & tasks"
                                            : "Review past missions & unlocked hints"}
                                    </span>
                                    <div className="flex items-center gap-1 font-semibold text-gold-400 group-hover:translate-x-0.5 transition-transform">
                                        <span>Inspect</span>
                                        <ChevronRight className="size-3.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}