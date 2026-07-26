// src/components/constellation.tsx
import { cn } from "@/lib/utils";

interface ConstellationProps {
    className?: string;
    /** Visual density / complexity preset. */
    variant?: "hero" | "divider";
}

/**
 * The page's signature motif: a handful of stars connected by faint lines,
 * evoking the star-map sailors once used to navigate — the literal source
 * of "Northern Stars Team". Rendered as static SVG (no external assets),
 * colored entirely off brand tokens so it adapts to light/dark automatically.
 *
 * Used sparingly: once large in the hero backdrop, once small as a section
 * divider. Not repeated as generic decoration elsewhere.
 */
export function Constellation({ className, variant = "hero" }: ConstellationProps) {
    if (variant === "divider") {
        return (
            <svg
                viewBox="0 0 240 40"
                className={cn("h-8 w-auto", className)}
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="M10 20 L70 12 L120 26 L170 10 L230 20"
                    stroke="var(--color-primary)"
                    strokeOpacity="0.35"
                    strokeWidth="1"
                />
                {[
                    [10, 20],
                    [70, 12],
                    [120, 26],
                    [170, 10],
                    [230, 20],
                ].map(([cx, cy], i) => (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={i === 2 ? 3 : 2}
                        fill="var(--color-primary)"
                        opacity={i === 2 ? 1 : 0.6}
                    />
                ))}
            </svg>
        );
    }

    return (
        <svg
            viewBox="0 0 800 600"
            className={cn("h-full w-full", className)}
            fill="none"
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
        >
            {/* Guide lines connecting the "North Star" cluster */}
            <path
                d="M120 480 L340 260 L520 340 L680 90"
                stroke="var(--color-primary)"
                strokeOpacity="0.25"
                strokeWidth="1"
            />
            <path
                d="M340 260 L400 120"
                stroke="var(--color-secondary)"
                strokeOpacity="0.2"
                strokeWidth="1"
            />
            <path
                d="M520 340 L610 470"
                stroke="var(--color-primary)"
                strokeOpacity="0.18"
                strokeWidth="1"
            />
            
            {/* Additional connection lines for more constellation depth */}
            <path
                d="M120 480 L200 520 L400 120"
                stroke="var(--color-primary)"
                strokeOpacity="0.12"
                strokeWidth="0.8"
            />
            <path
                d="M680 90 L600 220 L520 340"
                stroke="var(--color-secondary)"
                strokeOpacity="0.12"
                strokeWidth="0.8"
            />
            <path
                d="M340 260 L260 150 L200 520"
                stroke="var(--color-primary)"
                strokeOpacity="0.1"
                strokeWidth="0.8"
            />

            {/* Scattered background stars - Increased count from 10 to 30 */}
            {[
                // Original stars
                [60, 90, 1.2, 0.4],
                [180, 40, 1, 0.3],
                [260, 150, 1.5, 0.5],
                [450, 60, 1, 0.35],
                [600, 220, 1.3, 0.4],
                [720, 380, 1, 0.3],
                [740, 200, 1.4, 0.45],
                [40, 300, 1, 0.3],
                [200, 520, 1.2, 0.35],
                [580, 500, 1, 0.3],
                // New stars - top area
                [100, 50, 0.8, 0.25],
                [320, 30, 1.1, 0.3],
                [550, 45, 0.9, 0.2],
                [700, 60, 1.3, 0.35],
                [780, 120, 1, 0.25],
                // New stars - middle area
                [150, 200, 1.2, 0.3],
                [300, 350, 0.8, 0.2],
                [420, 280, 1.4, 0.35],
                [480, 180, 1, 0.25],
                [650, 300, 1.1, 0.3],
                [700, 450, 0.9, 0.2],
                // New stars - bottom area
                [80, 420, 1.3, 0.35],
                [160, 560, 0.9, 0.25],
                [320, 480, 1.1, 0.3],
                [450, 520, 1.4, 0.35],
                [550, 420, 0.8, 0.2],
                [650, 540, 1.2, 0.3],
                // New stars - scattered
                [25, 220, 0.8, 0.2],
                [380, 70, 1, 0.25],
                [500, 260, 1.2, 0.3],
                [760, 510, 0.9, 0.2],
            ].map(([cx, cy, r, o], i) => (
                <circle key={`bg-${i}`} cx={cx} cy={cy} r={r} fill="var(--color-foreground)" opacity={o} />
            ))}

            {/* The named constellation points - Added more stars */}
            {[
                [120, 480, 3],
                [340, 260, 3],
                [400, 120, 2.5],
                [520, 340, 3],
                [610, 470, 2.5],
                [680, 90, 4],
                // Additional constellation points
                [200, 520, 2],
                [260, 150, 2.5],
                [600, 220, 2],
                [450, 60, 1.8],
                [720, 380, 2],
                [300, 350, 1.8],
            ].map(([cx, cy, r], i) => (
                <circle
                    key={`star-${i}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={i === 5 ? "var(--color-secondary)" : "var(--color-primary)"}
                />
            ))}

            {/* Soft glow on the "North Star" — the brightest point, top right */}
            <circle cx="680" cy="90" r="14" fill="var(--color-secondary)" opacity="0.12" />
            
            {/* Additional subtle glows on secondary bright stars */}
            <circle cx="120" cy="480" r="8" fill="var(--color-primary)" opacity="0.08" />
            <circle cx="520" cy="340" r="8" fill="var(--color-primary)" opacity="0.08" />
        </svg>
    );
}