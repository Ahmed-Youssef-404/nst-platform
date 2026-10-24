"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/landing/hooks/use-reduced-motion";
import { useLiteMode } from "@/components/landing/hooks/use-lite-mode";

/**
 * Ambient space layers for the maintenance screen: two depths of CSS star dust
 * plus a faint grid. Mouse-only parallax writes --px/--py on `.mt-root`
 * (rAF-throttled, cleaned up on unmount). Touch, pen, reduced-motion and
 * low-power devices skip it entirely - the scene is complete without it.
 */
export function MaintenanceScene() {
    const ref = useRef<HTMLDivElement>(null);
    const reduced = useReducedMotion();
    const lite = useLiteMode();

    useEffect(() => {
        const root = ref.current?.closest<HTMLElement>(".mt-root");
        if (!root || reduced || lite) return;

        let frame = 0;
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse" || frame) return;
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
        <div ref={ref} className="mt-backdrop" aria-hidden="true">
            <div className="mt-grid" />
            <div className="mt-layer mt-layer--far">
                <div className="mt-dust mt-dust--far" />
            </div>
            <div className="mt-layer mt-layer--near">
                <div className="mt-dust mt-dust--near" />
            </div>
        </div>
    );
}
