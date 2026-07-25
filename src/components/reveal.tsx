// src/components/reveal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealDirection = "up" | "down" | "left" | "right" | "none";

const directionClasses: Record<RevealDirection, string> = {
    up: "slide-in-from-bottom-6",
    down: "slide-in-from-top-6",
    left: "slide-in-from-right-6",
    right: "slide-in-from-left-6",
    none: "",
};

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    /** Direction the content animates in from. Default "up" (fades + rises). */
    direction?: RevealDirection;
    /** Delay before the animation starts, in ms. Use this to stagger a row of items. */
    delay?: number;
    /** Animation duration, in ms. */
    duration?: number;
    /** Fraction of the element that must be visible before it triggers (0–1). */
    threshold?: number;
    /** If false, the element re-animates every time it re-enters the viewport. */
    once?: boolean;
    as?: React.ElementType;
}

/**
 * Wraps children and animates them in (fade + slide) the first time they
 * scroll into view, using tw-animate-css's `animate-in` utilities under the
 * hood. Built for landing-page sections — wrap each section/card in this
 * instead of hand-rolling an IntersectionObserver per page.
 *
 * Usage: <Reveal><Card /></Reveal>  or  <Reveal delay={150}><Card /></Reveal>
 * for staggered siblings.
 */
export function Reveal({
    children,
    className,
    direction = "up",
    delay = 0,
    duration = 600,
    threshold = 0.15,
    once = true,
    as: Tag = "div",
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        // Subscribing to an external system (the viewport) and calling
        // setState from its callback — not synchronously in the effect body.
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    if (once) observer.disconnect();
                } else if (!once) {
                    setVisible(false);
                }
            },
            { threshold }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [once, threshold]);

    return (
        <Tag
            ref={ref}
            className={cn(
                visible
                    ? cn("animate-in fade-in", directionClasses[direction])
                    : "opacity-0",
                className
            )}
            style={{
                animationDelay: visible ? `${delay}ms` : undefined,
                animationDuration: visible ? `${duration}ms` : undefined,
                animationFillMode: "both",
            }}
        >
            {children}
        </Tag>
    );
}