// src/lib/time-progress.ts
// Pure (React-free) helpers for the Week/Session time progress indicator.
//
// Everything here works on absolute instants (epoch milliseconds). Dates reach
// the frontend as JS `Date` objects built from Postgres `timestamptz` values,
// so they are already timezone-independent. The `Africa/Cairo` convention is
// purely a *display* concern and stays in `formatDateTime()` - nothing in this
// file formats or re-interprets a timezone.

export type DateInput = Date | string | number | null | undefined;

/** Epoch ms for a valid date-like value, otherwise `null`. Never NaN. */
export function toTimestamp(value: DateInput): number | null {
    if (value === null || value === undefined || value === "") return null;
    const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
}

export interface TimeProgress {
    /** 0-100, always finite. Elapsed share of [start, deadline]. */
    percent: number;
    /** True once `now` has reached the deadline. */
    isPastDeadline: boolean;
    /** 0-1 position inside [start, deadline] (used to drive the colour). */
    fraction: number;
    /** Milliseconds since the deadline (0 until it passes). */
    msPastDeadline: number;
    /** Total scheduled duration in ms (>= 0). */
    durationMs: number;
}

/**
 * progress = (now - start) / (deadline - start) * 100, clamped to 0-100.
 * Returns `null` when the dates are missing/invalid or the deadline is before
 * the start - the UI then renders nothing rather than a misleading bar.
 */
export function computeTimeProgress(
    start: DateInput,
    deadline: DateInput,
    nowMs: number
): TimeProgress | null {
    const startMs = toTimestamp(start);
    const deadlineMs = toTimestamp(deadline);
    if (startMs === null || deadlineMs === null || !Number.isFinite(nowMs)) return null;
    if (deadlineMs < startMs) return null;

    const durationMs = deadlineMs - startMs;
    const isPastDeadline = nowMs >= deadlineMs;

    let fraction: number;
    if (durationMs === 0) {
        // start === deadline: avoid division by zero.
        fraction = isPastDeadline ? 1 : 0;
    } else {
        fraction = (nowMs - startMs) / durationMs;
    }
    fraction = Math.min(1, Math.max(0, fraction));

    return {
        percent: fraction * 100,
        fraction,
        isPastDeadline,
        msPastDeadline: isPastDeadline ? nowMs - deadlineMs : 0,
        durationMs,
    };
}

/**
 * A Session has a start time but no single stored deadline: each Task carries
 * its own. The Session's "deadline" for the indicator is the latest one.
 */
export function getLatestDeadline(deadlines: DateInput[]): Date | null {
    let latest: number | null = null;
    for (const d of deadlines) {
        const ms = toTimestamp(d);
        if (ms !== null && (latest === null || ms > latest)) latest = ms;
    }
    return latest === null ? null : new Date(latest);
}

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

type RGB = readonly [number, number, number];

// Mirror the design tokens (dark theme) - gold-500 / success-500 live in
// src/app/styles.css. They are duplicated here only because the colour has to
// be interpolated numerically in JS; keep them in sync with the tokens.
const GOLD: RGB = [0xe8, 0xb8, 0x4a]; // --gold-500
const AMBER: RGB = [0xf0, 0x9e, 0x2a];
const ORANGE: RGB = [0xea, 0x6d, 0x2c];
const RED: RGB = [0xe0, 0x48, 0x48];
const GREEN: RGB = [0x2b, 0xe2, 0x92]; // #2be292 (--success-500)

// Colour stops along the elapsed fraction of the period (continuous
// interpolation between neighbours - there are no hard thresholds).
const STOPS: readonly { at: number; color: RGB }[] = [
    { at: 0, color: GOLD },
    { at: 0.5, color: GOLD }, // stays gold for the first half
    { at: 0.75, color: AMBER },
    { at: 0.9, color: ORANGE },
    { at: 1, color: RED },
];

const MIN_GREEN_TRANSITION_MS = 30 * 60_000; // 30 minutes
const MAX_GREEN_TRANSITION_MS = 24 * 60 * 60_000; // 24 hours

/** How long after the deadline the red -> green fade takes (scales with the period). */
export function getGreenTransitionMs(durationMs: number): number {
    const scaled = durationMs * 0.25;
    return Math.min(MAX_GREEN_TRANSITION_MS, Math.max(MIN_GREEN_TRANSITION_MS, scaled));
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mix(a: RGB, b: RGB, t: number): RGB {
    const k = clamp01(t);
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
}

function toCss([r, g, b]: RGB, alpha?: number): string {
    const c = `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
    return alpha === undefined ? `rgb(${c})` : `rgb(${c} / ${alpha})`;
}

function colorAt(progress: TimeProgress): RGB {
    if (progress.isPastDeadline) {
        const fade = getGreenTransitionMs(progress.durationMs);
        // Red -> gold -> green. Mixing red straight into green in RGB passes
        // through a muddy brown, so the fade is routed through the brand gold.
        const t = clamp01(progress.msPastDeadline / fade);
        return t < 0.5 ? mix(RED, GOLD, t * 2) : mix(GOLD, GREEN, (t - 0.5) * 2);
    }
    const f = progress.fraction;
    for (let i = 1; i < STOPS.length; i++) {
        const prev = STOPS[i - 1];
        const next = STOPS[i];
        if (f <= next.at) {
            const span = next.at - prev.at;
            return mix(prev.color, next.color, span === 0 ? 1 : (f - prev.at) / span);
        }
    }
    return RED;
}

export interface ProgressColors {
    /** Solid colour for the current moment. */
    base: string;
    /** Fill gradient (slightly deeper -> slightly lighter than `base`). */
    gradient: string;
    /** Soft glow around the fill. */
    glow: string;
}

export function computeProgressColors(progress: TimeProgress): ProgressColors {
    const base = colorAt(progress);
    const deeper = mix(base, [0, 0, 0], 0.18);
    const lighter = mix(base, [255, 255, 255], 0.14);
    return {
        base: toCss(base),
        gradient: `linear-gradient(90deg, ${toCss(deeper)}, ${toCss(base)} 60%, ${toCss(lighter)})`,
        glow: `0 0 12px ${toCss(base, 0.35)}`,
    };
}
