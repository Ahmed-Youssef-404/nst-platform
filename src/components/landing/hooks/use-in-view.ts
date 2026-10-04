"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
    threshold?: number;
    rootMargin?: string;
    /** Stay `true` after the first intersection. Default: false (tracks live visibility). */
    once?: boolean;
}

/** Tracks whether an element is on screen. Used to start/stop animation loops. */
export function useInView<T extends Element>({
    threshold = 0.1,
    rootMargin = "0px",
    once = false,
}: Options = {}) {
    const ref = useRef<T>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setInView(entry.isIntersecting);
                if (entry.isIntersecting && once) observer.disconnect();
            },
            { threshold, rootMargin }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, rootMargin, once]);

    return { ref, inView };
}
