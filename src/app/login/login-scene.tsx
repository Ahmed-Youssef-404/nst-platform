"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/landing/hooks/use-reduced-motion";
import { useLiteMode } from "@/components/landing/hooks/use-lite-mode";

/**
 * Ambient Cosmic Space Scene for the NST Login Universe.
 * Handles slow floating stardust, faint navigation grid, and gentle pointer parallax.
 */
export function LoginScene() {
    const containerRef = useRef<HTMLDivElement>(null);
    const reduced = useReducedMotion();
    const lite = useLiteMode();

    useEffect(() => {
        const root = containerRef.current?.closest<HTMLElement>(".nst-login");
        if (!root || reduced || lite) return;

        let frame = 0;
        const handlePointerMove = (e: PointerEvent) => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                const x = (e.clientX / window.innerWidth - 0.5) * 2;
                const y = (e.clientY / window.innerHeight - 0.5) * 2;
                root.style.setProperty("--lx", x.toFixed(3));
                root.style.setProperty("--ly", y.toFixed(3));
            });
        };

        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [reduced, lite]);

    return (
        <div ref={containerRef} className="nst-login-backdrop" aria-hidden="true">
            {/* Coordinate mesh overlay */}
            <div className="nst-login-grid" />

            {/* Parallax Dust Layers */}
            <div className="nst-parallax-layer nst-parallax-layer--far">
                <div className="nst-login-dust nst-login-dust--far" />
            </div>
            <div className="nst-parallax-layer nst-parallax-layer--near">
                <div className="nst-login-dust nst-login-dust--near" />
            </div>

            {/* Subtle atmospheric accents */}
            <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 h-80 w-80 rounded-full bg-gold-600/5 blur-[100px] pointer-events-none" />
        </div>
    );
}
