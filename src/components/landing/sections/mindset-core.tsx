"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CORE_NODES } from "../data/landing-content";
import { useInView } from "../hooks/use-in-view";
import { useReducedMotion } from "../hooks/use-reduced-motion";

const CENTER = 260;
const ORBITS = [125, 178, 226] as const;

// Each node sits on one of the three orbits at a hand-picked angle so the
// layout reads as organic rather than a regular polygon.
const PLACEMENTS = [
    { orbit: 0, angle: -80 },
    { orbit: 1, angle: -18 },
    { orbit: 2, angle: 42 },
    { orbit: 0, angle: 112 },
    { orbit: 1, angle: 172 },
    { orbit: 2, angle: 232 },
] as const;

const NODE_POSITIONS = CORE_NODES.map((node, i) => {
    const { orbit, angle } = PLACEMENTS[i];
    const radius = ORBITS[orbit];
    const rad = (angle * Math.PI) / 180;
    return {
        ...node,
        x: Number((CENTER + radius * Math.cos(rad)).toFixed(2)),
        y: Number((CENTER + radius * Math.sin(rad)).toFixed(2)),
    };
});

const circlePath = (r: number) =>
    `M ${CENTER - r} ${CENTER} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;

/**
 * The hero's centrepiece: a "mindset core" with three orbits and six thinking
 * steps. It tilts toward the cursor (via the `--mx` / `--my` variables set by
 * the hero), hovering or focusing a node puts that step in the core, and with
 * no interaction it cycles on its own, so touch users see it work too.
 */
export function MindsetCore({ className }: { className?: string }) {
    const [active, setActive] = useState(0);
    const hovering = useRef(false);
    const reduced = useReducedMotion();
    const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });

    useEffect(() => {
        if (!inView || reduced) return;
        const timer = setInterval(() => {
            if (!hovering.current) setActive((i) => (i + 1) % NODE_POSITIONS.length);
        }, 3200);
        return () => clearInterval(timer);
    }, [inView, reduced]);

    const current = NODE_POSITIONS[active];

    return (
        <div ref={ref} className={cn("relative mx-auto w-full max-w-[34rem]", className)}>
            <div
                className="transition-transform duration-300 ease-out will-change-transform"
                style={{
                    transform:
                        "perspective(1100px) rotateY(calc(var(--mx, 0) * 9deg)) rotateX(calc(var(--my, 0) * -7deg))",
                }}
            >
                <svg
                    viewBox="0 0 520 520"
                    className="h-auto w-full overflow-visible"
                    role="group"
                    aria-label="The programmer mindset: six steps orbiting a core"
                >
                    <defs>
                        <radialGradient id="mc-core" cx="50%" cy="45%" r="60%">
                            <stop offset="0%" stopColor="var(--gold-300)" />
                            <stop offset="55%" stopColor="var(--gold-500)" />
                            <stop offset="100%" stopColor="var(--gold-800)" />
                        </radialGradient>
                        <radialGradient id="mc-halo" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="var(--gold-500)" stopOpacity="0.38" />
                            <stop offset="100%" stopColor="var(--gold-500)" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    <circle cx={CENTER} cy={CENTER} r="250" fill="url(#mc-halo)" />

                    {/* Orbits */}
                    <g className="nl-spin-slow" fill="none" strokeLinecap="round">
                        <circle cx={CENTER} cy={CENTER} r={ORBITS[2]} stroke="var(--starlight-300)" strokeOpacity="0.28" strokeDasharray="2 10" />
                    </g>
                    <g className="nl-spin-reverse" fill="none" strokeLinecap="round">
                        <circle cx={CENTER} cy={CENTER} r={ORBITS[1]} stroke="var(--gold-500)" strokeOpacity="0.35" strokeDasharray="6 8" />
                    </g>
                    <circle cx={CENTER} cy={CENTER} r={ORBITS[0]} fill="none" stroke="var(--starlight-300)" strokeOpacity="0.3" />

                    {/* Signals travelling the orbits */}
                    {!reduced &&
                        ORBITS.map((r, i) => (
                            <circle key={r} r="2.6" fill="var(--gold-300)">
                                <animateMotion
                                    dur={`${10 + i * 6}s`}
                                    repeatCount="indefinite"
                                    path={circlePath(r)}
                                    keyPoints={i % 2 ? "1;0" : "0;1"}
                                    keyTimes="0;1"
                                    calcMode="linear"
                                />
                            </circle>
                        ))}

                    {/* Active beam core → node */}
                    <line
                        x1={CENTER}
                        y1={CENTER}
                        x2={current.x}
                        y2={current.y}
                        stroke="var(--gold-500)"
                        strokeOpacity="0.7"
                        strokeWidth="1.2"
                        strokeDasharray="4 6"
                        className="nl-dash-flow"
                    />

                    {/* Core */}
                    <circle cx={CENTER} cy={CENTER} r="62" fill="url(#mc-core)" />
                    <circle cx={CENTER} cy={CENTER} r="74" fill="none" stroke="var(--gold-500)" strokeOpacity="0.45" />
                    <text
                        x={CENTER}
                        y={CENTER + 6}
                        textAnchor="middle"
                        className="font-technical"
                        fontSize="17"
                        fontWeight="700"
                        fill="var(--space-950)"
                    >
                        {current.label}
                    </text>

                    {/* Nodes */}
                    {NODE_POSITIONS.map((node, i) => {
                        const isActive = i === active;
                        return (
                            <g
                                key={node.id}
                                tabIndex={0}
                                role="button"
                                aria-label={`${node.label}: ${node.hint}`}
                                aria-pressed={isActive}
                                className="cursor-pointer outline-none [&:focus-visible_.node-ring]:opacity-100"
                                onPointerEnter={() => {
                                    hovering.current = true;
                                    setActive(i);
                                }}
                                onPointerLeave={() => {
                                    hovering.current = false;
                                }}
                                onFocus={() => {
                                    hovering.current = true;
                                    setActive(i);
                                }}
                                onBlur={() => {
                                    hovering.current = false;
                                }}
                                onClick={() => setActive(i)}
                            >
                                <circle cx={node.x} cy={node.y} r="26" fill="transparent" />
                                <circle
                                    className="node-ring opacity-0 transition-opacity"
                                    cx={node.x}
                                    cy={node.y}
                                    r="17"
                                    fill="none"
                                    stroke="var(--gold-500)"
                                    strokeWidth="1.5"
                                />
                                {isActive && (
                                    <circle
                                        className="nl-pulse-ring"
                                        cx={node.x}
                                        cy={node.y}
                                        r="12"
                                        fill="none"
                                        stroke="var(--gold-500)"
                                    />
                                )}
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={isActive ? 8 : 5}
                                    fill={isActive ? "var(--gold-400)" : "var(--space-900)"}
                                    stroke={isActive ? "var(--gold-300)" : "var(--starlight-300)"}
                                    strokeWidth="1.5"
                                    style={{ transition: "r 300ms var(--ease-spring, ease)" }}
                                />
                                <text
                                    x={node.x}
                                    y={node.y + (node.y > CENTER ? 28 : -20)}
                                    textAnchor="middle"
                                    className="font-technical"
                                    fontSize="12"
                                    letterSpacing="0.06em"
                                    fill={isActive ? "var(--gold-400)" : "var(--starlight-300)"}
                                    style={{ transition: "fill 300ms" }}
                                >
                                    {node.label.toUpperCase()}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <p
                aria-live="polite"
                className="mt-2 h-6 text-center font-technical text-sm tracking-wide text-starlight-300"
            >
                {current.hint}
            </p>
        </div>
    );
}
