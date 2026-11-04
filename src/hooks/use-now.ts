// src/hooks/use-now.ts
// Returns the current time in epoch ms, refreshed on an interval (default: once
// a minute) and whenever the tab becomes visible again (browsers throttle
// timers in background tabs). Returns `null` until mounted so server HTML and
// the first client render always match (no hydration mismatch).
"use client";

import { useEffect, useState } from "react";

export function useNow(intervalMs: number = 60_000): number | null {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        const tick = () => setNow(Date.now());
        tick();

        const id = window.setInterval(tick, intervalMs);
        const onVisible = () => {
            if (document.visibilityState === "visible") tick();
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            window.clearInterval(id);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [intervalMs]);

    return now;
}
