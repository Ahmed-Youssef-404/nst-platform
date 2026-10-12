"use client";

import { useEffect, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCountUp(
    target: number,
    start: boolean,
    skip = false,
    duration = 1400,
) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!Number.isFinite(target)) {
            setValue(0);
            return;
        }

        if (!start) {
            setValue(0);
            return;
        }

        if (skip || duration <= 0) {
            setValue(target);
            return;
        }

        setValue(0);

        let frame = 0;
        const began = performance.now();

        const step = (now: number) => {
            const progress = Math.min(
                1,
                (now - began) / duration,
            );

            const nextValue = Math.round(
                target * easeOutCubic(progress),
            );

            setValue(progress === 1 ? target : nextValue);

            if (progress < 1) {
                frame = requestAnimationFrame(step);
            }
        };

        frame = requestAnimationFrame(step);

        return () => cancelAnimationFrame(frame);
    }, [target, start, skip, duration]);

    return value;
}