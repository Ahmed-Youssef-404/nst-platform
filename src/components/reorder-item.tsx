// src/components/reorder-item.tsx
"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";

/**
 * Same curve as the NST `--ease-standard` token (cubic-bezier(0.2, 0, 0, 1)):
 * quick start, soft landing, no overshoot. 280ms sits inside the 200–350ms
 * window used by the rest of the NST motion tokens.
 */
const REORDER_TRANSITION = {
    duration: 0.28,
    ease: [0.2, 0, 0, 1],
} as const;

/**
 * Wrapper for one item in a reorderable list.
 *
 * - Render it as the direct child of the list container and give IT the
 *   stable `key` (not the inner component), so Motion can track each item
 *   across reorders.
 * - `layout="position"` animates only the item's translation. Sizes are not
 *   interpolated, so inner content (text, textareas, markdown) is never
 *   scaled or distorted while moving.
 * - The wrapper has no CSS transition of its own, so it does not fight the
 *   inner card's `transition-*` classes.
 * - `reducedMotion="user"` makes Motion honour `prefers-reduced-motion`:
 *   layout changes then snap instantly instead of animating.
 */
export function ReorderItem({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <MotionConfig reducedMotion="user">
            <motion.div
                layout="position"
                transition={{ layout: REORDER_TRANSITION }}
                className={className}
            >
                {children}
            </motion.div>
        </MotionConfig>
    );
}