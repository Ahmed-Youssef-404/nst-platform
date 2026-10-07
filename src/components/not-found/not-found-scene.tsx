"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/landing/hooks/use-reduced-motion";
import { useLiteMode } from "@/components/landing/hooks/use-lite-mode";

/**
 * Ambient space layer: CSS star dust (two depths) plus a faint grid. Pointer
 * parallax writes --px/--py on the page root; it is skipped on touch devices,
 * low-power machines and for reduced motion.
 */
export function NotFoundScene() {
    const ref = useRef<HTMLDivElement>(null);
    const reduced = useReducedMotion();
    const lite = useLiteMode();

    useEffect(() => {
        const root = ref.current?.closest<HTMLElement>(".nf-root");
        if (!root || reduced || lite) return;

        let frame = 0;
        const onMove = (e: PointerEvent) => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                root.style.setProperty("--px", ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
                root.style.setProperty("--py", ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
            });
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => {
            window.removeEventListener("pointermove", onMove);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [reduced, lite]);

    return (
        <div ref={ref} className="nf-backdrop" aria-hidden="true">
            <div className="nf-grid" />
            <div className="nf-layer nf-layer--far">
                <div className="nf-dust nf-dust--far" />
            </div>
            <div className="nf-layer nf-layer--near">
                <div className="nf-dust nf-dust--near" />
            </div>
        </div>
    );
}
