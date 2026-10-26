// src/components/instructor/task-hint-usage.tsx
// Compact read-only panel showing which hints a student unlocked for a task,
// with the historical ST paid for each (HintUnlock.costPaid). Shared by the
// Beginner week grading and Intermediate session grading screens.

import { Lightbulb } from "lucide-react";
import type { TaskHintUsage } from "@/lib/data/get-hint-usage";

export function TaskHintUsagePanel({ usage }: { usage: TaskHintUsage }) {
    const { totalHints, unlockedCount, totalPaid, hints } = usage;

    return (
        <div className="rounded-xl border border-border/70 bg-space-850/60 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Lightbulb className="size-3.5 text-gold-400" />
                    <span className="text-xs font-semibold text-starlight-200">
                        Hints Used
                    </span>
                </div>
                {totalHints > 0 && (
                    <span
                        className={`font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${unlockedCount > 0
                            ? "bg-gold-500/10 text-gold-300 border-gold-500/25"
                            : "bg-space-850 text-starlight-400 border-border/70"
                            }`}
                    >
                        {unlockedCount} of {totalHints} opened
                    </span>
                )}
            </div>

            {totalHints === 0 ? (
                <p className="text-[11px] text-starlight-400 italic">
                    This task has no hints.
                </p>
            ) : (
                <>
                    <ul className="flex flex-wrap gap-2">
                        {hints.map((hint) => (
                            <li
                                key={hint.hintId}
                                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] ${hint.unlocked
                                    ? "border-gold-500/25 bg-gold-500/10 text-gold-200"
                                    : "border-border/60 bg-space-950/60 text-starlight-400"
                                    }`}
                            >
                                <span className="font-mono font-bold">
                                    Hint #{hint.order}
                                </span>
                                <span aria-hidden="true">·</span>
                                {hint.unlocked ? (
                                    <span className="font-semibold">
                                        Opened ·{" "}
                                        <span className="font-mono">{hint.costPaid} ST</span> paid
                                    </span>
                                ) : (
                                    <span>Not opened</span>
                                )}
                            </li>
                        ))}
                    </ul>

                    <p className="text-[11px] font-mono text-starlight-300">
                        {unlockedCount === 0
                            ? `No hints opened · 0 of ${totalHints} hints`
                            : `${unlockedCount} of ${totalHints} hints opened · ${totalPaid} ST total paid`}
                    </p>
                </>
            )}
        </div>
    );
}
