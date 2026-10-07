"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/landing/hooks/use-reduced-motion";

// Ring ellipse (centre 100,100). The first half of the path is the far side
// (behind the planet), the second half the near side (in front of it).
const RING_RX = 96;
const RING_RY = 26;
const RING_TILT = -16;
const RING_BACK = `M${100 - RING_RX} 100 A${RING_RX} ${RING_RY} 0 0 1 ${100 + RING_RX} 100`;
const RING_FRONT = `M${100 - RING_RX} 100 A${RING_RX} ${RING_RY} 0 0 0 ${100 + RING_RX} 100`;
const ORBIT_PATH = `${RING_BACK} A${RING_RX} ${RING_RY} 0 0 1 ${100 - RING_RX} 100`;
const ORBIT_SECONDS = 26;

/** Soft surface features that slide across the disc to suggest slow rotation. */
const SURFACE_BLOBS = [
    { cx: 70, cy: 78, rx: 26, ry: 9 },
    { cx: 128, cy: 104, rx: 32, ry: 11 },
    { cx: 92, cy: 132, rx: 22, ry: 7 },
] as const;
const SURFACE_PERIOD = 240;

function Satellite({ visibleOn, animated }: { visibleOn: "back" | "front"; animated: boolean }) {
    const values = visibleOn === "back" ? "1;0" : "0;1";
    return (
        <g
            transform={animated ? undefined : `translate(${100 + RING_RX} 100)`}
            opacity={animated ? undefined : visibleOn === "front" ? 1 : 0}
        >
            <g stroke="var(--gold-500)" strokeWidth="1.2" fill="var(--gold-500)">
                <rect x="-5.5" y="-0.9" width="3.5" height="1.8" rx="0.3" />
                <rect x="2" y="-0.9" width="3.5" height="1.8" rx="0.3" />
                <circle r="1.9" fill="var(--starlight-100)" stroke="none" />
            </g>
            {animated && (
                <>
                    <animateMotion dur={`${ORBIT_SECONDS}s`} repeatCount="indefinite" path={ORBIT_PATH} />
                    <animate
                        attributeName="opacity"
                        values={values}
                        keyTimes="0;0.5"
                        calcMode="discrete"
                        dur={`${ORBIT_SECONDS}s`}
                        repeatCount="indefinite"
                    />
                </>
            )}
        </g>
    );
}

/**
 * The "0" of 404 is a small ringed planet with a tiny satellite. Sized in em
 * so it scales with the numerals around it. Decorative: the page's real text
 * carries the meaning.
 */
export function PlanetZero({ className }: { className?: string }) {
    const reduced = useReducedMotion();
    const animated = !reduced;

    return (
        <svg
            viewBox="0 0 200 200"
            className={cn("shrink-0 overflow-visible", className)}
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <radialGradient id="nf-halo" cx="50%" cy="50%" r="50%">
                    <stop offset="55%" stopColor="var(--gold-500)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--gold-500)" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="nf-planet-body" cx="34%" cy="28%" r="85%">
                    <stop offset="0%" stopColor="var(--nf-planet-hi)" />
                    <stop offset="55%" stopColor="var(--nf-planet-mid)" />
                    <stop offset="100%" stopColor="var(--nf-planet-lo)" />
                </radialGradient>
                <radialGradient id="nf-planet-shade" cx="30%" cy="26%" r="90%">
                    <stop offset="45%" stopColor="var(--space-950)" stopOpacity="0" />
                    <stop offset="100%" stopColor="var(--space-950)" stopOpacity="0.55" />
                </radialGradient>
                <clipPath id="nf-planet-clip">
                    <circle cx="100" cy="100" r="66" />
                </clipPath>
            </defs>

            {/* Atmosphere */}
            <circle className="nf-halo" cx="100" cy="100" r="98" fill="url(#nf-halo)" />

            {/* Ring: far side, then satellite on its far side, then the planet */}
            <g transform={`rotate(${RING_TILT} 100 100)`}>
                <path d={RING_BACK} fill="none" stroke="var(--gold-500)" strokeOpacity="0.28" strokeWidth="1.2" />
                <Satellite visibleOn="back" animated={animated} />
            </g>

            <circle cx="100" cy="100" r="66" fill="url(#nf-planet-body)" />
            <g clipPath="url(#nf-planet-clip)">
                <g className="nf-surface" fill="var(--nf-planet-lo)" opacity="0.28">
                    {[0, SURFACE_PERIOD].map((offset) =>
                        SURFACE_BLOBS.map((b, i) => (
                            <ellipse key={`${offset}-${i}`} cx={b.cx + offset} cy={b.cy} rx={b.rx} ry={b.ry} />
                        ))
                    )}
                </g>
                <circle cx="100" cy="100" r="66" fill="url(#nf-planet-shade)" />
            </g>
            <circle cx="100" cy="100" r="66" fill="none" stroke="var(--nf-rim)" strokeOpacity="0.45" strokeWidth="0.8" />

            {/* Ring: near side, with the satellite crossing in front of the planet */}
            <g transform={`rotate(${RING_TILT} 100 100)`}>
                <path d={RING_FRONT} fill="none" stroke="var(--gold-500)" strokeOpacity="0.6" strokeWidth="1.4" />
                <Satellite visibleOn="front" animated={animated} />
            </g>
        </svg>
    );
}
