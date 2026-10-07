// src/components/boot/boot-scene.tsx
// Pure markup — no state. All motion lives in boot.css.

// Deterministic (no Math.random) so server and client markup always match.
// [x%, y%, size px, delay s, twinkle duration s]
const STARS: ReadonlyArray<readonly [number, number, number, number, number]> = [
    [12, 18, 1.5, 0.1, 3.4], [78, 12, 1, 0.3, 4.1], [34, 8, 1, 0.5, 3.0], [90, 34, 1.5, 0.2, 4.6],
    [6, 52, 1, 0.6, 3.8], [22, 76, 1.5, 0.4, 3.2], [68, 82, 1, 0.7, 4.4], [92, 70, 1, 0.3, 3.6],
    [48, 90, 1, 0.5, 4.0], [58, 6, 1.5, 0.2, 3.3], [16, 36, 1, 0.8, 4.2], [84, 54, 1, 0.1, 3.9],
    // extras — hidden on small screens
    [30, 28, 1, 0.9, 3.5], [72, 26, 1, 0.4, 4.3], [42, 70, 1.5, 0.6, 3.1], [8, 88, 1, 0.8, 4.5],
    [96, 90, 1, 0.5, 3.7], [54, 40, 1, 1.0, 4.0], [26, 94, 1, 0.3, 3.4], [80, 94, 1, 0.7, 3.9],
];
const ORBIT = "M 12 200 A 188 54 0 1 1 388 200 A 188 54 0 1 1 12 200";

export function BootScene({ tagline }: { tagline: string }) {
    return (
        <>
            <div className="nb-dust nb-dust--far" aria-hidden="true" />
            <div className="nb-dust nb-dust--near" aria-hidden="true" />

            <div className="nb-stars" aria-hidden="true">
                {STARS.map(([x, y, size, delay, dur], i) => (
                    <span
                        key={i}
                        className={i >= 12 ? "nb-star nb-star--extra" : "nb-star"}
                        style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            width: size,
                            height: size,
                            animationDelay: `${delay}s, ${delay + 0.6}s`,
                            animationDuration: `0.9s, ${dur}s`,
                        }}
                    />
                ))}
            </div>

            <div className="nb-parallax">
                <div className="nb-stage">
                    <div className="nb-sun" aria-hidden="true">
                        <div className="nb-sun__core" />
                    </div>

                    <svg className="nb-svg" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
                        <defs>
                            <radialGradient id="nb-body" cx="0.74" cy="0.2" r="0.95">
                                <stop offset="0" style={{ stopColor: "var(--gold-900)" }} />
                                <stop offset="0.42" style={{ stopColor: "var(--space-800)" }} />
                                <stop offset="1" style={{ stopColor: "var(--space-950)" }} />
                            </radialGradient>
                            <linearGradient id="nb-rim" x1="0.85" y1="0.05" x2="0.25" y2="0.85">
                                <stop offset="0" style={{ stopColor: "var(--gold-300)" }} />
                                <stop offset="0.5" style={{ stopColor: "var(--gold-500)", stopOpacity: 0.35 }} />
                                <stop offset="1" style={{ stopColor: "var(--gold-500)", stopOpacity: 0 }} />
                            </linearGradient>
                            <clipPath id="nb-clip-back"><rect x="0" y="0" width="400" height="200" /></clipPath>
                            <clipPath id="nb-clip-front"><rect x="0" y="200" width="400" height="200" /></clipPath>
                        </defs>

                        <g transform="rotate(-18 200 200)">
                            <g clipPath="url(#nb-clip-back)">
                                <OrbitLine />
                            </g>
                        </g>

                        <g className="nb-planet">
                            <circle cx="200" cy="200" r="118" fill="url(#nb-body)" />
                            <circle cx="200" cy="200" r="117.25" fill="none" stroke="url(#nb-rim)" strokeWidth="1.5" />
                        </g>

                        <g transform="rotate(-18 200 200)">
                            <g clipPath="url(#nb-clip-front)">
                                <OrbitLine />
                            </g>
                        </g>
                    </svg>

                    <div className="nb-logo">
                        <span className="nb-logo__word">NST</span>
                    </div>
                </div>
            </div>

            <p className="nb-tagline">{tagline}</p>
        </>
    );
}

function OrbitLine() {
    return (
        <g className="nb-orbit">
            <path d={ORBIT} className="nb-orbit__track" fill="none" />
            {/* pathLength=100 lets CSS drive the real progress with a plain number */}
            <path d={ORBIT} className="nb-orbit__progress" fill="none" pathLength={100} />
            <g className="nb-orbit__star">
                <circle r="7" className="nb-orbit__halo" />
                <circle r="2.6" className="nb-orbit__dot" />
                <animateMotion dur="4.2s" repeatCount="indefinite" path={ORBIT} />
            </g>
        </g>
    );
}