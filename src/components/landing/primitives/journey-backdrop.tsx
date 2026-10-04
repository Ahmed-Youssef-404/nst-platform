"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed ambient layer behind the whole page: two depth layers of star dust
 * drift upward as the visitor scrolls, and the lower glow warms toward gold,
 * so the page reads as one continuous journey rather than stacked blocks.
 *
 * Writes `--journey` (0 → 1, whole-page scroll) on itself; CSS does the rest.
 */
export function JourneyBackdrop() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let frame = 0;
        const update = () => {
            frame = 0;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
            el.style.setProperty("--journey", progress.toFixed(4));
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        return () => {
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <div ref={ref} className="nl-backdrop" aria-hidden="true">
            <div className="nl-dust nl-dust--far" />
            <div className="nl-dust nl-dust--near" />
        </div>
    );
}
