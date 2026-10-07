"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/landing/hooks/use-reduced-motion";

type Anchor = "start" | "middle" | "end";

interface RouteNode {
    x: number;
    y: number;
    label: string;
    sub: string;
    /** Label position relative to the node. */
    lx: number;
    ly: number;
    anchor: Anchor;
}

interface RouteLayout {
    viewBox: string;
    origin: RouteNode;
    relays: RouteNode[];
    destination: RouteNode;
    /** Healthy part of the route (origin through the last relay). */
    solid: string;
    /** Last hop before the connection is lost. */
    unstable: string;
    /** Faint line that fades toward the destination. */
    fade: { d: string; x1: number; x2: number };
    /** Where the signal dies. */
    breakAt: { x: number; y: number };
    /** Wording for the break label, placed relative to `breakAt`. */
    timeout: { dx: number; dy: number; anchor: Anchor };
}

// Two purpose-built layouts rather than one scaled-down diagram, so labels
// stay legible on phones.
const WIDE: RouteLayout = {
    viewBox: "0 0 880 150",
    origin: { x: 70, y: 78, label: "ORIGIN", sub: "NST", lx: 0, ly: 34, anchor: "middle" },
    relays: [
        { x: 300, y: 42, label: "RELAY·01", sub: "OK", lx: 0, ly: -20, anchor: "middle" },
        { x: 520, y: 104, label: "RELAY·02", sub: "OK", lx: 0, ly: 34, anchor: "middle" },
    ],
    destination: { x: 800, y: 72, label: "DESTINATION", sub: "UNKNOWN", lx: 0, ly: 46, anchor: "middle" },
    solid: "M70 78 C150 78 210 42 300 42 S440 104 520 104",
    unstable: "M520 104 C570 104 610 86 650 80",
    fade: { d: "M678 77 L774 72", x1: 678, x2: 774 },
    breakAt: { x: 650, y: 80 },
    timeout: { dx: 0, dy: -26, anchor: "middle" },
};

const COMPACT: RouteLayout = {
    viewBox: "0 0 320 220",
    origin: { x: 42, y: 34, label: "ORIGIN", sub: "NST", lx: 0, ly: 28, anchor: "middle" },
    relays: [
        { x: 256, y: 58, label: "RELAY·01", sub: "OK", lx: 0, ly: -18, anchor: "middle" },
        { x: 84, y: 120, label: "RELAY·02", sub: "OK", lx: -16, ly: 4, anchor: "end" },
    ],
    destination: { x: 262, y: 176, label: "DESTINATION", sub: "UNKNOWN", lx: 0, ly: 34, anchor: "middle" },
    solid: "M42 34 C110 30 196 38 256 58 C206 84 134 100 84 120",
    unstable: "M84 120 C110 140 134 148 160 152",
    fade: { d: "M182 154 L240 172", x1: 182, x2: 240 },
    breakAt: { x: 160, y: 152 },
    timeout: { dx: 0, dy: 26, anchor: "middle" },
};

const PACKET_SECONDS = 6;

function NodeLabel({ node }: { node: RouteNode }) {
    return (
        <text
            x={node.x + node.lx}
            y={node.y + node.ly}
            textAnchor={node.anchor}
            fontFamily="var(--font-display), ui-sans-serif, system-ui, sans-serif"
            letterSpacing="2"
        >
            <tspan fill="var(--starlight-200)" fontSize="11" fontWeight="600">{node.label}</tspan>
            <tspan x={node.x + node.lx} dy="14" fill="var(--starlight-400)" fontSize="10">{node.sub}</tspan>
        </text>
    );
}

function RouteSvg({ layout, id, animated }: { layout: RouteLayout; id: string; animated: boolean }) {
    const { origin, relays, destination, solid, unstable, fade, breakAt, timeout } = layout;
    const packetPath = `${solid} ${unstable.replace(/^M[\d.\s]+/, "")}`;
    const fadeId = `nf-fade-${id}`;

    return (
        <svg
            viewBox={layout.viewBox}
            className="h-auto w-full"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <linearGradient id={fadeId} gradientUnits="userSpaceOnUse" x1={fade.x1} y1="0" x2={fade.x2} y2="0">
                    <stop offset="0%" stopColor="var(--gold-500)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="var(--gold-500)" stopOpacity="0.06" />
                </linearGradient>
            </defs>

            {/* Healthy route */}
            <path d={solid} fill="none" stroke="var(--gold-500)" strokeOpacity="0.55" strokeWidth="1.5" />
            {/* Unstable last hop */}
            <path
                d={unstable}
                className="nf-flicker"
                fill="none"
                stroke="var(--gold-500)"
                strokeOpacity="0.55"
                strokeWidth="1.5"
                strokeDasharray="5 5"
            />
            {/* Lost stretch toward the destination */}
            <path d={fade.d} fill="none" stroke={`url(#${fadeId})`} strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" />

            {/* Break marker */}
            <g stroke="var(--gold-400)" strokeWidth="1.5" strokeLinecap="round">
                <path d={`M${breakAt.x - 5} ${breakAt.y - 7} L${breakAt.x + 5} ${breakAt.y + 7}`} />
                <path d={`M${breakAt.x + 3} ${breakAt.y - 7} L${breakAt.x + 13} ${breakAt.y + 7}`} />
            </g>
            <text
                x={breakAt.x + timeout.dx}
                y={breakAt.y + timeout.dy}
                textAnchor={timeout.anchor}
                fill="var(--gold-500)"
                fontSize="10"
                letterSpacing="2.2"
                fontFamily="var(--font-display), ui-sans-serif, system-ui, sans-serif"
            >
                TIMEOUT
            </text>

            {/* Origin: solid gold star-node with a slow pulse ring */}
            <g>
                <circle cx={origin.x} cy={origin.y} r="12" fill="none" stroke="var(--gold-500)" strokeOpacity="0.35" />
                <circle cx={origin.x} cy={origin.y} r="5" fill="var(--gold-500)" />
            </g>

            {/* Relays */}
            {relays.map((r) => (
                <g key={r.label}>
                    <circle cx={r.x} cy={r.y} r="8" fill="var(--space-950)" stroke="var(--gold-500)" strokeOpacity="0.7" strokeWidth="1.5" />
                    <circle cx={r.x} cy={r.y} r="2.5" fill="var(--gold-500)" />
                </g>
            ))}

            {/* Destination: hollow, dashed, slowly turning, marked with a cross */}
            <g>
                <circle
                    className="nf-spin-slow"
                    cx={destination.x}
                    cy={destination.y}
                    r="17"
                    fill="none"
                    stroke="var(--starlight-300)"
                    strokeOpacity="0.55"
                    strokeWidth="1.2"
                    strokeDasharray="3 5"
                />
                <path
                    d={`M${destination.x - 5} ${destination.y - 5} L${destination.x + 5} ${destination.y + 5} M${destination.x + 5} ${destination.y - 5} L${destination.x - 5} ${destination.y + 5}`}
                    stroke="var(--starlight-200)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                />
            </g>

            {[origin, ...relays, destination].map((n) => (
                <NodeLabel key={n.label} node={n} />
            ))}

            {/* The packet: travels the route and dies at the break */}
            {animated ? (
                <>
                    <circle r="3.6" fill="var(--starlight-100)">
                        <animateMotion
                            dur={`${PACKET_SECONDS}s`}
                            repeatCount="indefinite"
                            path={packetPath}
                            calcMode="spline"
                            keyTimes="0;1"
                            keySplines="0.45 0 0.55 1"
                        />
                        <animate
                            attributeName="opacity"
                            values="0;1;1;0;0"
                            keyTimes="0;0.06;0.78;0.82;1"
                            dur={`${PACKET_SECONDS}s`}
                            repeatCount="indefinite"
                        />
                    </circle>
                    <circle cx={breakAt.x} cy={breakAt.y} r="3" fill="none" stroke="var(--gold-400)" strokeWidth="1.2" opacity="0">
                        <animate
                            attributeName="r"
                            values="3;3;18;18"
                            keyTimes="0;0.78;0.98;1"
                            dur={`${PACKET_SECONDS}s`}
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0;0;0.8;0;0"
                            keyTimes="0;0.78;0.8;0.98;1"
                            dur={`${PACKET_SECONDS}s`}
                            repeatCount="indefinite"
                        />
                    </circle>
                </>
            ) : (
                <circle cx={breakAt.x - 14} cy={breakAt.y + 2} r="3.4" fill="var(--starlight-100)" opacity="0.6" />
            )}
        </svg>
    );
}

/**
 * The failed route: ORIGIN → relays → a packet that times out on its way to a
 * DESTINATION that can't be reached. One layout for wide screens, one for
 * phones. Purely visual; `RouteSummary` below is the accessible equivalent.
 */
export function RouteMap({ className }: { className?: string }) {
    const reduced = useReducedMotion();

    return (
        <div className={cn("mx-auto w-full max-w-[55rem]", className)}>
            <div className="hidden sm:block">
                <RouteSvg layout={WIDE} id="wide" animated={!reduced} />
            </div>
            <div className="mx-auto max-w-[22rem] sm:hidden">
                <RouteSvg layout={COMPACT} id="compact" animated={!reduced} />
            </div>
            <p className="sr-only">
                Route diagram: a request left the NST origin and passed two relays, but the final hop timed out. The
                destination could not be reached.
            </p>
        </div>
    );
}
