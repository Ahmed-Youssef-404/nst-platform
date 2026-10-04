"use client";

import { useEffect, useRef } from "react";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Scroll progress (0 → 1) of a tall element as it travels through the
 * viewport, written to the element's `--p` CSS variable.
 *
 * Writing a CSS variable instead of React state means a scroll-linked scene
 * can animate every frame without re-rendering. Pass `onProgress` only when
 * the scene also needs a coarse React value (e.g. "which step is active").
 *
 * When `frozenAt` is set (reduced motion) the progress is pinned to that
 * value and no scroll listener is attached.
 */
export function useScrollProgress<T extends HTMLElement>(
    onProgress?: (progress: number) => void,
    frozenAt?: number
) {
    const ref = useRef<T>(null);
    const callback = useRef(onProgress);

    useEffect(() => {
        callback.current = onProgress;
    });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const apply = (p: number) => {
            el.style.setProperty("--p", p.toFixed(4));
            callback.current?.(p);
        };

        if (frozenAt !== undefined) {
            apply(frozenAt);
            return;
        }

        let frame = 0;
        const measure = () => {
            frame = 0;
            const rect = el.getBoundingClientRect();
            const travel = rect.height - window.innerHeight;
            apply(travel <= 0 ? 0 : clamp01(-rect.top / travel));
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(measure);
        };

        measure();
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        return () => {
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [frozenAt]);

    return ref;
}
