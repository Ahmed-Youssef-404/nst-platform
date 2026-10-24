// Server-rendered SVG: a softly lit planet, thin orbital paths and a small
// service satellite. All colour comes from the NST tokens; motion is pure CSS
// (see maintenance.css) so it is switched off by prefers-reduced-motion.

const RING_PATH_FULL = "M30 200 A170 52 0 1 1 370 200 A170 52 0 1 1 30 200";
const RING_PATH_FRONT = "M30 200 A170 52 0 0 0 370 200";
const SAT_PATH = "M370 200 A170 52 0 1 1 30 200 A170 52 0 1 1 370 200";

const SPARKS = [
    { x: 58, y: 88, r: 1.6 },
    { x: 338, y: 70, r: 1.2 },
    { x: 352, y: 292, r: 1.8 },
    { x: 84, y: 318, r: 1.2 },
    { x: 214, y: 26, r: 1.4 },
] as const;

export function MaintenancePlanet() {
    return (
        <div className="mt-planet" aria-hidden="true">
            <div className="mt-planet-float">
                <svg viewBox="0 0 400 400" className="block h-full w-full" focusable="false">
                    <defs>
                        <radialGradient id="mt-body" cx="34%" cy="30%" r="82%">
                            <stop offset="0%" style={{ stopColor: "var(--mt-planet-hi)" }} />
                            <stop offset="42%" style={{ stopColor: "var(--mt-planet-mid)" }} />
                            <stop offset="100%" style={{ stopColor: "var(--mt-planet-lo)" }} />
                        </radialGradient>
                        <radialGradient id="mt-halo" cx="50%" cy="50%" r="50%">
                            <stop offset="55%" stopColor="rgb(var(--mt-gold-rgb) / 0.22)" />
                            <stop offset="100%" stopColor="rgb(var(--mt-gold-rgb) / 0)" />
                        </radialGradient>
                        <linearGradient id="mt-shade" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="45%" stopColor="transparent" />
                            <stop offset="100%" style={{ stopColor: "var(--space-950)", stopOpacity: 0.78 }} />
                        </linearGradient>
                        <clipPath id="mt-disc">
                            <circle cx="200" cy="200" r="78" />
                        </clipPath>
                    </defs>

                    <circle cx="200" cy="200" r="150" fill="url(#mt-halo)" opacity="var(--mt-halo)" />
                    <circle cx="200" cy="200" r="132" className="mt-ring mt-ring--faint" fill="none" />

                    {SPARKS.map((s) => (
                        <circle key={`${s.x}-${s.y}`} cx={s.x} cy={s.y} r={s.r} className="mt-spark" />
                    ))}

                    <g transform="rotate(-18 200 200)">
                        <path d={RING_PATH_FULL} className="mt-ring" fill="none" />
                    </g>

                    <circle cx="200" cy="200" r="78" fill="url(#mt-body)" />
                    <g clipPath="url(#mt-disc)">
                        <ellipse cx="170" cy="176" rx="46" ry="9" className="mt-band" />
                        <ellipse cx="226" cy="206" rx="52" ry="11" className="mt-band" />
                        <ellipse cx="188" cy="238" rx="38" ry="7" className="mt-band" />
                        <circle cx="200" cy="200" r="78" fill="url(#mt-shade)" />
                    </g>
                    <circle cx="200" cy="200" r="78" fill="none" className="mt-rim" />

                    <g transform="rotate(-18 200 200)">
                        <path d={RING_PATH_FRONT} className="mt-ring mt-ring--front" fill="none" />
                        <g className="mt-sat-wrap">
                            <g className="mt-sat" style={{ offsetPath: `path("${SAT_PATH}")` }}>
                                <rect x="-9" y="-1.4" width="6" height="2.8" rx="0.5" className="mt-sat-panel" />
                                <rect x="3" y="-1.4" width="6" height="2.8" rx="0.5" className="mt-sat-panel" />
                                <circle r="2.8" className="mt-sat-core" />
                            </g>
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    );
}
