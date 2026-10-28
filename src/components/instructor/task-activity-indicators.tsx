// src/components/instructor/task-activity-indicators.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markTaskActivityReviewedAction } from "@/lib/actions/task-activity";
import { showToast } from "@/components/ui/toast";

// Compact gold counter shown beside a student's name: the number of DISTINCT
// tasks with new, unreviewed student activity. Renders nothing at zero.
// `title` + `aria-label` give the explanation on hover and to screen readers
// (no nested interactive element, so it is safe inside a <button> row).
export function NewActivityCounter({
    count,
    className = "",
}: {
    count: number;
    className?: string;
}) {
    if (count <= 0) return null;

    const label = `${count} ${count === 1 ? "task" : "tasks"} with new activity`;

    return (
        <span
            role="img"
            title={label}
            aria-label={label}
            className={`inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-gold-500 px-1 font-mono text-[10px] font-bold leading-none text-space-950 ${className}`}
        >
            {count}
        </span>
    );
}

// Subtle task-level marker: "this task has activity you haven't reviewed".
export function NewActivityBadge({ className = "" }: { className?: string }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-gold-300 ${className}`}
        >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-gold-400" />
            New activity
        </span>
    );
}

// Mount this ONLY at the moment the instructor opens a task's details (and
// only if that task had unreviewed activity). Because it is mounted after the
// details are already rendered, the review is registered once the content is
// on screen. It acknowledges exactly `seenVersion` - the version that was
// displayed when the task was opened - so anything the student does afterwards
// stays unreviewed. `seenVersion` is captured once on mount on purpose.
export function ReviewTaskActivityOnMount({
    submissionId,
    seenVersion,
    onFailure,
}: {
    submissionId: string;
    seenVersion: number;
    onFailure?: () => void;
}) {
    const router = useRouter();
    const [target] = useState({ submissionId, seenVersion });
    const onFailureRef = useRef(onFailure);

    useEffect(() => {
        onFailureRef.current = onFailure;
    });

    useEffect(() => {
        let mounted = true;

        function fail(message: string) {
            showToast({
                title: "Review not recorded",
                description: message,
                type: "error",
            });
            if (mounted) onFailureRef.current?.();
        }

        async function register() {
            try {
                const result = await markTaskActivityReviewedAction(target);
                if (result.success) {
                    router.refresh();
                } else {
                    fail(result.error ?? "Could not register this review.");
                }
            } catch (err) {
                fail(err instanceof Error ? err.message : "Could not register this review.");
            }
        }

        void register();

        return () => {
            mounted = false;
        };
    }, [router, target]);

    return null;
}