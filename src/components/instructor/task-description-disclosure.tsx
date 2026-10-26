// src/components/instructor/task-description-disclosure.tsx
// Inline expandable "task details" section shown next to the task title in the
// Instructor grading screens (Beginner week grading + Intermediate session
// grading). Collapsed by default so long descriptions don't push the student
// submissions off-screen. The description is authored as Markdown, so it is
// rendered with the existing <MarkdownContent /> component.

"use client";

import { useId, useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { cn } from "@/lib/utils";

export function TaskDescriptionDisclosure({
    description,
    className,
}: {
    description: string | null | undefined;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const panelId = useId();

    const hasDescription = Boolean(description && description.trim().length > 0);

    // Missing/empty description: nothing to expand, so don't show a misleading
    // empty panel - just a quiet, non-interactive note.
    if (!hasDescription) {
        return (
            <div
                className={cn(
                    "flex items-center gap-1.5 rounded-xl border border-border/50 bg-space-950/40 px-3.5 py-2.5 text-[11px] text-starlight-400",
                    className
                )}
            >
                <FileText className="size-3.5 shrink-0 text-starlight-500" />
                No description was provided for this task.
            </div>
        );
    }

    return (
        <div
            className={cn(
                "rounded-xl border border-border/50 bg-space-950/40",
                className
            )}
        >
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-starlight-300 transition-colors hover:text-starlight-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
            >
                <span className="flex items-center gap-1.5">
                    <FileText className="size-3.5 shrink-0 text-gold-400" />
                    {open ? "Hide task details" : "View task details"}
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        "size-4 shrink-0 text-starlight-400 transition-transform",
                        open && "rotate-180"
                    )}
                />
            </button>

            {open && (
                <div
                    id={panelId}
                    className="min-w-0 border-t border-border/50 px-3.5 py-3 text-xs break-words"
                >
                    <MarkdownContent content={description as string} className="text-xs" />
                </div>
            )}
        </div>
    );
}