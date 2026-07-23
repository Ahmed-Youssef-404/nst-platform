// src/lib/st-economy/balance-status.ts
//
// Warning / Danger Zone is NOT stored anywhere - it's derived at read time
// from the student's current levelSt. This keeps it always correct (no risk
// of a stale "isWarning" flag going out of sync with the real balance).
//
// TODO: warningThreshold is currently a hardcoded default (20) since there
// is no SuperAdmin settings table/UI yet. Once one exists, replace
// DEFAULT_WARNING_THRESHOLD with a real read from that table. Every caller
// already goes through getBalanceStatus(), so that will be a one-file change.

import { BalanceStatus, BalanceZone } from "@/types/types";

export const DEFAULT_WARNING_THRESHOLD = 20;

export function getBalanceStatus(
    levelSt: number,
    totalSt: number,
    warningThreshold: number = DEFAULT_WARNING_THRESHOLD
): BalanceStatus {
    let zone: BalanceZone = "normal";

    if (levelSt <= 0) {
        zone = "danger";
    } else if (levelSt <= warningThreshold) {
        zone = "warning";
    }

    return { levelSt, totalSt, zone, warningThreshold };
}