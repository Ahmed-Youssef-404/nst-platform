"use client";

import { cn } from "@/lib/utils";
import { CYCLE_STEPS } from "../data/landing-content";

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

interface FollowUpOrbitProps {
    /** Controlled active step (0-4), driven by scroll progression. */
    activeStep?: number;
}

/** Learn → Practice → Track → Review → Improve, driven by scroll progression. */
export function FollowUpOrbit({ activeStep = 0 }: FollowUpOrbitProps) {
    const active = Math.max(0, Math.min(CYCLE_STEPS.length - 1, activeStep));
    const current = CYCLE_STEPS[active];

    return (
        <div className="mx-auto w-full max-w-sm">
            <div className="relative">
                <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full overflow-visible" role="group" aria-label="The NST learning loop">
                    {/* Background orbital guide */}
                    <circle cx={C} cy={C} r={R + 34} fill="none" stroke="var(--starlight-300)" strokeOpacity="0.18" strokeDasharray="2 9" className="nl-spin-slow" />

                    {/* Connecting Arcs */}
                    {ANGLES.map((angle, i) => {
                        const isActive = i === active;
                        return (
                            <path
                                key={CYCLE_STEPS[i].id}
                                d={arc(angle)}
                                fill="none"
                                strokeLinecap="round"
                                strokeWidth={isActive ? 3 : 1.5}
                                stroke={isActive ? "var(--gold-500)" : "var(--starlight-400)"}
                                strokeOpacity={isActive ? 1 : 0.35}
                                style={{
                                    transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                                    filter: isActive ? "drop-shadow(0 0 6px rgba(var(--nl-gold-rgb) / 0.5))" : "none",
                                }}
                            />
                        );
                    })}

                    {/* Step Nodes */}
                    {ANGLES.map((angle, i) => {
                        const [x, y] = polar(angle);
                        const isActive = i === active;
                        const [lx, ly] = polar(angle, R + 36);

                        return (
                            <g
                                key={CYCLE_STEPS[i].id}
                                aria-label={`${CYCLE_STEPS[i].label}: ${CYCLE_STEPS[i].line}`}
                                aria-current={isActive ? "step" : undefined}
                                className="pointer-events-none select-none"
                            >
                                {/* Hit area */}
                                <circle cx={x} cy={y} r="26" fill="transparent" />

                                {/* Glowing outer ring for active step */}
                                <circle
                                    className="transition-all duration-400"
                                    cx={x}
                                    cy={y}
                                    r={isActive ? 20 : 16}
                                    fill="none"
                                    stroke="var(--gold-500)"
                                    strokeWidth="1.5"
                                    strokeOpacity={isActive ? 0.9 : 0}
                                    style={{
                                        filter: isActive ? "drop-shadow(0 0 8px rgba(var(--nl-gold-rgb) / 0.6))" : "none",
                                    }}
                                />

                                {/* Subtle pulse halo for active step */}
                                {isActive && (
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="24"
                                        fill="var(--gold-500)"
                                        fillOpacity="0.15"
                                        className="nl-pulse-ring"
                                    />
                                )}

                                {/* Main node core */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={isActive ? 11 : 7}
                                    fill={isActive ? "var(--gold-500)" : "var(--space-900)"}
                                    stroke={isActive ? "var(--gold-300)" : "var(--starlight-300)"}
                                    strokeWidth={isActive ? 2 : 1.5}
                                    style={{
                                        transition: "r 300ms var(--ease-spring, ease), fill 300ms, stroke 300ms",
                                    }}
                                />

                                {/* Step Label */}
                                <text
                                    x={lx}
                                    y={ly + 4}
                                    textAnchor="middle"
                                    fontSize={isActive ? "13" : "11.5"}
                                    fontWeight={isActive ? "700" : "500"}
                                    letterSpacing="0.09em"
                                    className="font-technical"
                                    fill={isActive ? "var(--gold-400)" : "var(--starlight-300)"}
                                    style={{
                                        transition: "all 300ms",
                                        filter: isActive ? "drop-shadow(0 0 6px rgba(var(--nl-gold-rgb) / 0.4))" : "none",
                                    }}
                                >
                                    {CYCLE_STEPS[i].label.toUpperCase()}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Center Core Text */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <span
                        key={`label-${current.id}`}
                        className="font-heading text-2xl font-extrabold text-starlight-100 transition-all duration-300 animate-in fade-in zoom-in-95"
                    >
                        {current.label}
                    </span>
                    <span
                        key={`line-${current.id}`}
                        aria-live="polite"
                        className={cn("mt-1 max-w-[10rem] text-sm text-starlight-300 transition-all duration-300 animate-in fade-in")}
                    >
                        {current.line}
                    </span>
                </div>
            </div>
        </div>
    );
}
