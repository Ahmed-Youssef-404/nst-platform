"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CYCLE_STEPS } from "../data/landing-content";
import { useInView } from "../hooks/use-in-view";
import { useReducedMotion } from "../hooks/use-reduced-motion";

const SIZE = 360;
const C = SIZE / 2;
const R = 128;
const GAP = 13; // degrees trimmed from each arc so it doesn't touch the nodes

const polar = (deg: number, radius = R) => {
    const rad = (deg * Math.PI) / 180;
    return [Number((C + radius * Math.cos(rad)).toFixed(2)), Number((C + radius * Math.sin(rad)).toFixed(2))] as const;
};

const ANGLES = CYCLE_STEPS.map((_, i) => -90 + (360 / CYCLE_STEPS.length) * i);
const STEP_DEG = 360 / CYCLE_STEPS.length;

const arc = (from: number) => {
    const [x1, y1] = polar(from + GAP);
    const [x2, y2] = polar(from + STEP_DEG - GAP);
    return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
};

/** Learn → Practice → Track → Review → Improve, as a loop that keeps turning. */
export function FollowUpOrbit() {
    const [active, setActive] = useState(0);
    const paused = useRef(false);
    const reduced = useReducedMotion();
    const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

    useEffect(() => {
        if (!inView || reduced) return;
        const timer = setInterval(() => {
            if (!paused.current) setActive((i) => (i + 1) % CYCLE_STEPS.length);
        }, 2200);
        return () => clearInterval(timer);
    }, [inView, reduced]);

    const current = CYCLE_STEPS[active];

    return (
        <div ref={ref} className="mx-auto w-full max-w-sm">
            <div className="relative">
                <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full overflow-visible" role="group" aria-label="The NST learning loop">
                    <circle cx={C} cy={C} r={R + 34} fill="none" stroke="var(--starlight-300)" strokeOpacity="0.18" strokeDasharray="2 9" className="nl-spin-slow" />

                    {ANGLES.map((angle, i) => (
                        <path
                            key={CYCLE_STEPS[i].id}
                            d={arc(angle)}
                            fill="none"
                            strokeLinecap="round"
                            strokeWidth={i === active ? 2.5 : 1.5}
                            stroke={i === active ? "var(--gold-500)" : "var(--starlight-400)"}
                            strokeOpacity={i === active ? 1 : 0.4}
                            style={{ transition: "all 400ms" }}
                        />
                    ))}

                    {ANGLES.map((angle, i) => {
                        const [x, y] = polar(angle);
                        const isActive = i === active;
                        const [lx, ly] = polar(angle, R + 34);
                        return (
                            <g
                                key={CYCLE_STEPS[i].id}
                                tabIndex={0}
                                role="button"
                                aria-label={`${CYCLE_STEPS[i].label}: ${CYCLE_STEPS[i].line}`}
                                aria-pressed={isActive}
                                className="cursor-pointer outline-none [&:focus-visible_.ring]:opacity-100"
                                onPointerEnter={() => { paused.current = true; setActive(i); }}
                                onPointerLeave={() => { paused.current = false; }}
                                onFocus={() => { paused.current = true; setActive(i); }}
                                onBlur={() => { paused.current = false; }}
                                onClick={() => setActive(i)}
                            >
                                <circle cx={x} cy={y} r="26" fill="transparent" />
                                <circle className="ring opacity-0 transition-opacity" cx={x} cy={y} r="19" fill="none" stroke="var(--gold-500)" strokeWidth="1.5" />
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={isActive ? 11 : 7}
                                    fill={isActive ? "var(--gold-500)" : "var(--space-900)"}
                                    stroke={isActive ? "var(--gold-300)" : "var(--starlight-300)"}
                                    strokeWidth="1.5"
                                    style={{ transition: "r 300ms var(--ease-spring, ease)" }}
                                />
                                <text
                                    x={lx}
                                    y={ly + 4}
                                    textAnchor="middle"
                                    fontSize="12"
                                    letterSpacing="0.08em"
                                    className="font-technical"
                                    fill={isActive ? "var(--gold-400)" : "var(--starlight-300)"}
                                    style={{ transition: "fill 300ms" }}
                                >
                                    {CYCLE_STEPS[i].label.toUpperCase()}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-heading text-2xl font-extrabold text-starlight-100">{current.label}</span>
                    <span aria-live="polite" className={cn("mt-1 max-w-[9rem] text-sm text-starlight-300")}>
                        {current.line}
                    </span>
                </div>
            </div>
        </div>
    );
}
