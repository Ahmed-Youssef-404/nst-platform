"use client";

import { useEffect, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Counts from 0 to `target` once `start` flips true. Jumps straight to the target when `skip` is set. */
export function useCountUp(target: number, start: boolean, skip = false, duration = 1400) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!start || skip) return;

        let frame = 0;
        const began = performance.now();
        const step = (now: number) => {
            const t = Math.min(1, (now - began) / duration);
            setValue(Math.round(target * easeOutCubic(t)));
            if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [target, start, skip, duration]);

    return skip && start ? target : value;
}
