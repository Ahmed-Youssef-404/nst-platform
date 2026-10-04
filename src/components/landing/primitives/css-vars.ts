import type { CSSProperties } from "react";

/** Types an object of CSS custom properties (`--x: 12`) as a React style. */
export function cssVars(vars: Record<string, string | number>): CSSProperties {
    return vars as CSSProperties;
}
