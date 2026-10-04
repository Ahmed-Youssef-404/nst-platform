"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLiteMode } from "../hooks/use-lite-mode";
import { useReducedMotion } from "../hooks/use-reduced-motion";

interface MagneticProps {
    children: React.ReactNode;
    className?: string;
    /** How far the element follows the pointer (0–1). */
    strength?: number;
    /** Distance (px) from the element's edge at which the pull starts. */
    radius?: number;
}

/**
 * Pulls its child gently toward the pointer when it gets close, and eases it
 * back on leave. Disabled on touch devices and for reduced motion.
 */
export function Magnetic({ children, className, strength = 0.3, radius = 70 }: MagneticProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const lite = useLiteMode();
    const reduced = useReducedMotion();
    const disabled = lite || reduced;

    useEffect(() => {
        const wrap = wrapRef.current;
        const inner = innerRef.current;
        if (!wrap || !inner || disabled) return;

        const onMove = (event: PointerEvent) => {
            const rect = wrap.getBoundingClientRect();
            const dx = event.clientX - (rect.left + rect.width / 2);
            const dy = event.clientY - (rect.top + rect.height / 2);
            const near =
                Math.abs(dx) < rect.width / 2 + radius && Math.abs(dy) < rect.height / 2 + radius;

            inner.style.transform = near
                ? `translate3d(${dx * strength}px, ${dy * strength}px, 0)`
                : "translate3d(0, 0, 0)";
        };
        const reset = () => {
            inner.style.transform = "translate3d(0, 0, 0)";
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerleave", reset);
        return () => {
            window.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerleave", reset);
        };
    }, [disabled, strength, radius]);

    return (
        <div ref={wrapRef} className={cn("inline-block", className)}>
            <div
                ref={innerRef}
                className="transition-transform duration-300 ease-out will-change-transform"
            >
                {children}
            </div>
        </div>
    );
}
