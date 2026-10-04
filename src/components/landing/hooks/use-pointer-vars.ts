"use client";

import { useEffect, useRef } from "react";

/**
 * Tracks the pointer relative to an element and writes it to `--mx` / `--my`
 * (both -1 → 1, 0 at the centre). Children read the variables in CSS to tilt,
 * shift or glow, so pointer movement never triggers a React render.
 *
 * Values ease toward the pointer (and back to 0 when it leaves).
 * Pass `enabled = false` to leave the variables at 0 (touch / reduced motion).
 */
export function usePointerVars<T extends HTMLElement>(enabled = true) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        el.style.setProperty("--mx", "0");
        el.style.setProperty("--my", "0");
        if (!enabled) return;

        let targetX = 0;
        let targetY = 0;
        let x = 0;
        let y = 0;
        let frame = 0;

        const tick = () => {
            x += (targetX - x) * 0.08;
            y += (targetY - y) * 0.08;
            el.style.setProperty("--mx", x.toFixed(3));
            el.style.setProperty("--my", y.toFixed(3));
            const settled =
                Math.abs(targetX - x) < 0.002 && Math.abs(targetY - y) < 0.002;
            frame = settled ? 0 : requestAnimationFrame(tick);
        };
        const run = () => {
            if (!frame) frame = requestAnimationFrame(tick);
        };

        const onMove = (event: PointerEvent) => {
            const rect = el.getBoundingClientRect();
            targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
            run();
        };
        const onLeave = () => {
            targetX = 0;
            targetY = 0;
            run();
        };

        el.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerleave", onLeave);
        return () => {
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [enabled]);

    return ref;
}
