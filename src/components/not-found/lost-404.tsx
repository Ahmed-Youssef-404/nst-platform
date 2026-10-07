"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/landing/hooks/use-reduced-motion";
import { PlanetZero } from "./planet-zero";

// Stage coordinate system: 1000 × 440, centred on (500, 220). The numerals are
// sized with container units (34cqw) so they stay locked to this overlay at
// every screen width.
const CENTER = { x: 500, y: 220 };

interface OrbitSpec {
    rx: number;
    ry: number;
    tilt: number;
    opacity: number;
    dashed?: boolean;
    /** Seconds for one lap of the travelling dot; omitted = no dot. */
    lap?: number;
}

const ORBITS: OrbitSpec[] = [
    { rx: 470, ry: 132, tilt: -9, opacity: 0.2, lap: 38 },
    { rx: 402, ry: 92, tilt: 7, opacity: 0.14, dashed: true },
];

const STARS = [
    { x: 92, y: 300, r: 1.6, d: 0 },
    { x: 168, y: 52, r: 1.2, d: 1.2 },
    { x: 310, y: 392, r: 1.4, d: 2.1 },
    { x: 420, y: 36, r: 1.1, d: 0.6 },
    { x: 640, y: 410, r: 1.5, d: 1.7 },
    { x: 760, y: 60, r: 1.3, d: 2.8 },
    { x: 930, y: 250, r: 1.6, d: 0.9 },
    { x: 868, y: 372, r: 1.1, d: 3.3 },
    { x: 34, y: 170, r: 1.2, d: 2.4 },
] as const;

function ellipsePath(rx: number, ry: number) {
    return `M${CENTER.x - rx} ${CENTER.y} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
}

function Reticle({ x, y, flipX, flipY }: { x: number; y: number; flipX?: boolean; flipY?: boolean }) {
    const dx = flipX ? -1 : 1;
    const dy = flipY ? -1 : 1;
    return (
        <path
            d={`M${x} ${y + 22 * dy} V${y} H${x + 22 * dx}`}
            fill="none"
            stroke="var(--gold-500)"
            strokeOpacity="0.4"
            strokeWidth="1"
        />
    );
}

function StageOverlay({ reduced }: { reduced: boolean }) {
    return (
        <svg
            viewBox="0 0 1000 440"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <radialGradient id="nf-moon" cx="35%" cy="30%" r="80%">
                    <stop offset="0%" stopColor="var(--starlight-200)" />
                    <stop offset="100%" stopColor="var(--space-800)" />
                </radialGradient>
            </defs>

            {/* Orbit lines passing through the numerals */}
            {ORBITS.map((o, i) => (
                <g key={i} transform={`rotate(${o.tilt} ${CENTER.x} ${CENTER.y})`}>
                    <ellipse
                        cx={CENTER.x}
                        cy={CENTER.y}
                        rx={o.rx}
                        ry={o.ry}
                        fill="none"
                        stroke="var(--gold-500)"
                        strokeOpacity={o.opacity}
                        strokeWidth="1"
                        strokeDasharray={o.dashed ? "2 7" : undefined}
                    />
                    {o.lap && (
                        <circle r="3" fill="var(--gold-500)" cx={reduced ? CENTER.x + o.rx : undefined}
                            cy={reduced ? CENTER.y : undefined}>
                            {!reduced && (
                                <animateMotion dur={`${o.lap}s`} repeatCount="indefinite" path={ellipsePath(o.rx, o.ry)} />
                            )}
                        </circle>
                    )}
                </g>
            ))}

            {/* A small broken network in the upper corners */}
            <g stroke="var(--gold-500)" strokeOpacity="0.28" strokeWidth="1" fill="none">
                <path d="M120 96 L206 138 L304 78" />
                <path d="M720 66 L812 108 L880 84" />
                <path d="M880 84 L934 132" strokeDasharray="3 5" />
            </g>
            <g fill="var(--gold-500)">
                <circle cx="120" cy="96" r="3" opacity="0.7" />
                <circle cx="206" cy="138" r="2.5" opacity="0.5" />
                <circle cx="304" cy="78" r="3" opacity="0.7" />
                <circle cx="720" cy="66" r="2.5" opacity="0.5" />
                <circle cx="812" cy="108" r="3" opacity="0.7" />
                <circle cx="880" cy="84" r="3" opacity="0.7" />
            </g>
            {/* ...whose last link goes nowhere */}
            <g className="nf-flicker" stroke="var(--gold-500)" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round">
                <path d="M928 126 L940 138 M940 126 L928 138" />
            </g>

            {/* A distant moon */}
            <g className="nf-float">
                <circle cx="905" cy="318" r="15" fill="url(#nf-moon)" opacity="0.85" />
                <circle cx="905" cy="318" r="15" fill="none" stroke="var(--starlight-300)" strokeOpacity="0.25" />
            </g>

            {/* Stars */}
            {STARS.map((s) => (
                <circle
                    key={`${s.x}-${s.y}`}
                    className="nf-twinkle"
                    cx={s.x}
                    cy={s.y}
                    r={s.r}
                    fill="var(--starlight-100)"
                    style={{ animationDelay: `${s.d}s` }}
                />
            ))}

            {/* Instrument details: reticle corners and micro-labels */}
            <Reticle x={14} y={14} />
            <Reticle x={986} y={14} flipX />
            <Reticle x={14} y={426} flipY />
            <Reticle x={986} y={426} flipX flipY />

            <g
                className="hidden sm:block"
                fill="var(--starlight-400)"
                fontFamily="var(--font-display), ui-sans-serif, system-ui, sans-serif"
                fontSize="11"
                letterSpacing="2.2"
            >
                <text x="44" y="36">SECTOR 404·Ω</text>
                <text x="956" y="36" textAnchor="end">RA 04h 04m · DEC +40°04′</text>
                <text x="44" y="416">GRID 40.4 / 04.4</text>
                <text x="956" y="416" textAnchor="end">REQUEST ▸ ∅</text>
            </g>
        </svg>
    );
}

/**
 * The hero: a huge gold "404" whose zero is a ringed planet, with orbit lines
 * crossing the numerals. Decorative; the text equivalent lives in the
 * page heading and status readout.
 */
export function Lost404({ className }: { className?: string }) {
    const reduced = useReducedMotion();

    return (
        <div
            className={cn("nf-stage relative mx-auto aspect-[1000/440] w-full max-w-[56rem]", className)}
            aria-hidden="true"
        >
            <StageOverlay reduced={reduced} />

            <div className="absolute inset-0 grid place-items-center">
                <div className="nf-digits flex items-center justify-center font-heading font-extrabold leading-none tracking-tighter [font-size:34cqw]">
                    <span className="nf-gold-text nf-glitch" data-text="4">4</span>
                    <PlanetZero className="mx-[-0.19em] h-[1.1em] w-[1.1em]" />
                    <span className="nf-gold-text nf-glitch nf-glitch--late" data-text="4">4</span>
                </div>
            </div>
        </div>
    );
}
