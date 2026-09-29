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
                        href={isActive ? "/student" : `/student/levels/${level.id}`}
                        className="group block h-full focus:outline-hidden"
                    >
                        <div
                            className={`
                                relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 h-full
                                ${
                                    isActive
                                        ? "border-gold-500/50 bg-gradient-to-br from-gold-500/10 via-card to-card shadow-gold hover:border-gold-500/70 ring-1 ring-gold-500/30 dark:from-space-850 dark:via-space-900 dark:to-space-950"
                                        : "border-border/80 bg-card hover:bg-muted/40 hover:border-gold-500/40 shadow-xs dark:border-border/70 dark:bg-space-900/60 dark:hover:bg-space-850/80 dark:hover:border-gold-500/30 dark:hover:shadow-gold"
                                }
                            `}
                        >
                            <div className="space-y-3">
                                {/* Header: Level number & status */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs font-bold text-gold-600 dark:text-gold-400">
                                        LEVEL {level.levelNumber.toString().padStart(2, "0")}
                                    </span>

                                    {isActive ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold border shadow-xs">
                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                                            Active Level
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-secondary-foreground border-border/70 dark:bg-space-800 dark:text-starlight-400 dark:border-border/70 px-2.5 py-0.5 text-xs font-medium border">
                                            <Archive className="size-3 text-muted-foreground dark:text-starlight-400" />
                                            Archived
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <div>
                                    <h3 className="font-display text-lg font-bold text-foreground dark:text-starlight-100 group-hover:text-gold-600 dark:group-hover:text-gold-300 transition-colors">
                                        {level.name || `Level ${level.levelNumber}`}
                                    </h3>
                                </div>
                            </div>

                            {/* Meta & Footer */}
                            <div className="mt-6 pt-4 border-t border-border/70 dark:border-border/50 space-y-3 text-xs">
                                <div className="flex items-center justify-between text-foreground/80 dark:text-starlight-300">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="size-3.5 text-muted-foreground dark:text-starlight-400" />
                                        <span>Started {formatDateTime(level.startDate)}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 font-mono text-foreground/80 dark:text-starlight-300">
                                        <Layers className="size-3.5 text-gold-600 dark:text-gold-400" />
                                        <span>
                                            {level.sessionCount}{" "}
                                            {level.sessionCount === 1 ? "session" : "sessions"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 text-muted-foreground dark:text-starlight-400 group-hover:text-foreground dark:group-hover:text-starlight-200 transition-colors">
                                    <span className="text-[11px] font-medium">
                                        {isActive
                                            ? "Current Active Level — Go to My Sessions"
                                            : "Review past missions & unlocked hints"}
                                    </span>
                                    <div className="flex items-center gap-1 font-semibold text-gold-600 dark:text-gold-400 group-hover:translate-x-0.5 transition-transform">
                                        <span>{isActive ? "My Sessions" : "Inspect"}</span>
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