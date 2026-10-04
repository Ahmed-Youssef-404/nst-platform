"use client";

import { cssVars } from "../primitives/css-vars";
import { ScrollStage } from "../primitives/scroll-stage";
import { DIRECTION_TERMS, NOISE_TERMS, PHILOSOPHY_COPY } from "../data/landing-content";

// Positions are percentages of the stage. `route` is where a node settles once
// the noise resolves into a path; the four extras dissolve into that path.
const NODE_LAYOUT = [
    { chaos: [72, 70], route: [9, 78] },
    { chaos: [14, 18], route: [27, 58] },
    { chaos: [88, 52], route: [45, 68] },
    { chaos: [40, 12], route: [61, 40] },
    { chaos: [8, 48], route: [78, 50] },
    { chaos: [58, 84], route: [91, 20] },
    { chaos: [30, 86], route: [36, 63] },
    { chaos: [82, 12], route: [53, 54] },
    { chaos: [50, 40], route: [70, 45] },
    { chaos: [22, 32], route: [18, 68] },
] as const;

const ROUTE_PATH = "M9 78 L27 58 L45 68 L61 40 L78 50 L91 20";
const SCRIBBLES = [
    "M72 70 L14 18 L88 52",
    "M40 12 L8 48 L58 84",
    "M30 86 L82 12 L50 40",
    "M22 32 L88 52 L40 12",
];

// Scroll progress → movement. `--e` is an eased 0→1 that drives every node.
const STAGE_VARS = cssVars({
    "--m": "clamp(0, calc((var(--p) - 0.12) / 0.6), 1)",
    "--e": "calc(var(--m) * var(--m) * (3 - 2 * var(--m)))",
});

/**
 * "The noise → the direction". As the visitor scrolls, scattered, contradictory
 * advice drifts into place and resolves into one clear route. All motion is
 * CSS driven by a single scroll variable, so scrolling never re-renders React.
 */
export function Philosophy() {
    return (
        <ScrollStage id="philosophy" length={230}>
            <div className="mx-auto flex h-full max-w-6xl flex-col justify-center gap-6 px-6 py-20 sm:gap-8">
                <div className="max-w-2xl">
                    <p className="relative h-4 font-technical text-xs tracking-[0.22em] uppercase">
                        <span
                            className="absolute inset-0 text-starlight-400"
                            style={{ opacity: "clamp(0, calc(1 - var(--p) * 3), 1)" }}
                        >
                            {PHILOSOPHY_COPY.noiseTitle}
                        </span>
                        <span
                            className="absolute inset-0 text-gold-500"
                            style={{ opacity: "clamp(0, calc((var(--p) - 0.35) * 3), 1)" }}
                        >
                            {PHILOSOPHY_COPY.directionTitle}
                        </span>
                    </p>
                    <h2 className="mt-4 font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-balance text-starlight-100 sm:text-4xl md:text-5xl">
                        {PHILOSOPHY_COPY.headline}
                    </h2>
                </div>

                <div
                    style={STAGE_VARS}
                    className="relative mx-auto aspect-[4/5] max-h-[52svh] w-full max-w-4xl [container-type:size] sm:aspect-[8/5]"
                >
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="absolute inset-0 h-full w-full overflow-visible"
                        aria-hidden="true"
                        fill="none"
                    >
                        <g style={{ opacity: "clamp(0, calc(1 - var(--e) * 4), 1)" }}>
                            {SCRIBBLES.map((d) => (
                                <path
                                    key={d}
                                    d={d}
                                    stroke="var(--starlight-400)"
                                    strokeOpacity="0.4"
                                    strokeDasharray="1.5 2.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            ))}
                        </g>
                        <path
                            d={ROUTE_PATH}
                            pathLength={1}
                            stroke="var(--gold-500)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray="1"
                            style={{ strokeDashoffset: "calc(1 - clamp(0, (var(--p) - 0.45) / 0.4, 1))" }}
                        />
                    </svg>

                    {NODE_LAYOUT.map((node, i) => {
                        const [cx, cy] = node.chaos;
                        const [rx, ry] = node.route;
                        const isRoute = i < DIRECTION_TERMS.length;
                        return (
                            <div
                                key={NOISE_TERMS[i]}
                                className="absolute top-0 left-0 will-change-transform"
                                style={{
                                    transform: `translate3d(calc((${cx} * (1 - var(--e)) + ${rx} * var(--e)) * 1cqw), calc((${cy} * (1 - var(--e)) + ${ry} * var(--e)) * 1cqh), 0)`,
                                    opacity: isRoute ? 1 : "clamp(0, calc(1 - (var(--e) - 0.55) * 4), 1)",
                                }}
                            >
                                <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
                                    <span
                                        className="size-2.5 rounded-full ring-1 ring-[color:var(--border-default)]"
                                        style={{
                                            background: isRoute
                                                ? "color-mix(in oklab, var(--starlight-400) calc((1 - var(--e)) * 100%), var(--gold-500))"
                                                : "var(--starlight-400)",
                                            boxShadow: isRoute
                                                ? "0 0 calc(var(--e) * 14px) rgb(var(--nl-gold-rgb) / 0.8)"
                                                : undefined,
                                        }}
                                    />
                                    <span className="relative h-4 w-0">
                                        <span
                                            className="absolute top-0 left-1/2 -translate-x-1/2 font-technical text-[0.7rem] whitespace-nowrap text-starlight-400 sm:text-xs"
                                            style={{ opacity: "clamp(0, calc(1 - var(--e) * 3), 1)" }}
                                        >
                                            {NOISE_TERMS[i]}
                                        </span>
                                        {isRoute && (
                                            <span
                                                className="absolute top-0 left-1/2 -translate-x-1/2 font-technical text-[0.7rem] font-semibold whitespace-nowrap text-gold-500 sm:text-xs"
                                                style={{ opacity: "clamp(0, calc((var(--e) - 0.55) * 3), 1)" }}
                                            >
                                                {DIRECTION_TERMS[i]}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <p
                    className="mx-auto max-w-xl text-center text-base text-balance text-starlight-300 sm:text-lg"
                    style={{ opacity: "clamp(0, calc((var(--p) - 0.78) * 6), 1)" }}
                >
                    {PHILOSOPHY_COPY.support}
                </p>
            </div>
        </ScrollStage>
    );
}
