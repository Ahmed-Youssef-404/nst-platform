// src/components/boot/initial-loading-screen.tsx
"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { HERO_COPY } from "@/components/landing/data/landing-content";
import { useLiteMode } from "@/components/landing/hooks/use-lite-mode";
import { usePointerVars } from "@/components/landing/hooks/use-pointer-vars";
import { useReducedMotion } from "@/components/landing/hooks/use-reduced-motion";
import { BootScene } from "./boot-scene";

type Phase = "intro" | "exit" | "done";

/** Landing hero mounts with this id — its presence means the page is really there. */
const READY_SELECTOR = "#top";
/** Long enough for the logo reveal to land; never added on top of a slow load. */
const MIN_MS = 1600;
const MIN_MS_REDUCED = 300;
const EXIT_MS = 750;
const EXIT_MS_REDUCED = 250;
/** Safety net: never trap the visitor behind the loader. */
const MAX_MS = 6000;

const noopSubscribe = () => () => { };
const readArmed = () => document.documentElement.dataset.nstBoot === "active";

export function InitialLoadingScreen() {
    // Server snapshot = true so SSR markup always exists; the inline script in
    // <BootGate> decides (before paint) whether CSS actually shows it.
    const armed = useSyncExternalStore(noopSubscribe, readArmed, () => true);
    const [phase, setPhase] = useState<Phase>("intro");
    const [progress, setProgress] = useState(12);

    const reduced = useReducedMotion();
    const lite = useLiteMode();
    const rootRef = usePointerVars<HTMLDivElement>(!reduced && !lite);

    useEffect(() => {
        if (!armed) return;
        try {
            sessionStorage.setItem("nst-boot", "1");
        } catch {
            /* private mode — loader just replays next visit */
        }

        const minMs = reduced ? MIN_MS_REDUCED : MIN_MS;
        const exitMs = reduced ? EXIT_MS_REDUCED : EXIT_MS;
        const start = performance.now();
        const timers: number[] = [];
        let fontsOk = false;
        let pageOk = false;
        let finished = false;
        let observer: MutationObserver | null = null;

        const finish = () => {
            if (finished) return;
            finished = true;
            observer?.disconnect();
            const wait = Math.max(0, minMs - (performance.now() - start));
            timers.push(
                window.setTimeout(() => {
                    setProgress(100);
                    setPhase("exit");
                    timers.push(
                        window.setTimeout(() => {
                            document.documentElement.dataset.nstBoot = "done";
                            setPhase("done");
                        }, exitMs)
                    );
                }, wait)
            );
        };

        // Progress is real: it only advances when something actually became ready.
        const update = () => {
            setProgress(12 + (fontsOk ? 33 : 0) + (pageOk ? 45 : 0));
            if (fontsOk && pageOk) finish();
        };

        const checkPage = () => {
            if (pageOk || !document.querySelector(READY_SELECTOR)) return;
            pageOk = true;
            observer?.disconnect();
            update();
        };

        (document.fonts?.ready ?? Promise.resolve()).then(() => {
            fontsOk = true;
            update();
        });

        observer = new MutationObserver(checkPage);
        observer.observe(document.body, { childList: true, subtree: true });
        timers.push(window.requestAnimationFrame(checkPage));
        timers.push(window.setTimeout(finish, MAX_MS));

        return () => {
            observer?.disconnect();
            timers.forEach((t) => {
                window.clearTimeout(t);
                window.cancelAnimationFrame(t);
            });
        };
    }, [armed, reduced]);

    if (!armed || phase === "done") return null;

    return (
        <div
            ref={rootRef}
            className="nb-root dark"
            data-phase={phase}
            style={{ "--nb-p": progress } as CSSProperties}
            role="status"
            aria-live="polite"
            aria-label="Loading NST"
        >
            <BootScene tagline={HERO_COPY.support} />
        </div>
    );
}