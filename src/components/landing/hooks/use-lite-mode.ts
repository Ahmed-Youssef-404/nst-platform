"use client";

import { useSyncExternalStore } from "react";

const SMALL_SCREEN = "(max-width: 767px)";
const COARSE_POINTER = "(pointer: coarse)";

function computeLite(): boolean {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const weakCpu = (nav.hardwareConcurrency ?? 8) <= 4;
    const weakMemory = (nav.deviceMemory ?? 8) <= 4;
    return (
        window.matchMedia(SMALL_SCREEN).matches ||
        window.matchMedia(COARSE_POINTER).matches ||
        weakCpu ||
        weakMemory
    );
}

function subscribe(onChange: () => void) {
    const small = window.matchMedia(SMALL_SCREEN);
    small.addEventListener("change", onChange);
    return () => small.removeEventListener("change", onChange);
}

/**
 * "Lite" = phones, touch devices and low-power machines. Heavy effects
 * (particle counts, shooting stars, 3D tilt) use this to scale themselves down.
 */
export function useLiteMode(): boolean {
    return useSyncExternalStore(subscribe, computeLite, () => false);
}
