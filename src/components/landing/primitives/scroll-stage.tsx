"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { useScrollProgress } from "../hooks/use-scroll-progress";

interface ScrollStageProps {
    id?: string;
    /** Scroll length of the stage, in viewport heights. */
    length?: number;
    /** Receives coarse progress (0–1) for scenes that need React state. */
    onProgress?: (progress: number) => void;
    className?: string;
    children: React.ReactNode;
}

/**
 * A tall section whose content stays pinned (CSS `position: sticky`) while the
 * visitor scrolls through it. Normal browser scrolling is never intercepted:
 * the page simply scrolls past a pinned scene, and `--p` (0 → 1) on this
 * element drives whatever the children animate.
 *
 * With reduced motion the stage is not pinned and rests on its final state.
 */
export function ScrollStage({ id, length = 220, onProgress, className, children }: ScrollStageProps) {
    const reduced = useReducedMotion();
    const ref = useScrollProgress<HTMLElement>(onProgress, reduced ? 1 : undefined);

    return (
        <section
            id={id}
            ref={ref}
            style={reduced ? undefined : { height: `${length}svh` }}
            className={cn("relative", className)}
        >
            <div className={cn(reduced ? "min-h-svh py-24" : "sticky top-0 h-svh overflow-hidden")}>
                {children}
            </div>
        </section>
    );
}
