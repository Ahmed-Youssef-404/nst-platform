// src/app/student/student-top-bar.tsx
// Async Server Component. Lives in the Student layout (not a single page)
// so it renders as a sticky bar pinned to the top of every /student page -
// per client request, this replaced the old STBalanceCard which only ever
// showed on the "My Sessions" list page.
//
// Fetches its own data (reconcile + balance) independently of whatever
// page is rendering below it, and is wrapped in its own <Suspense> in
// layout.tsx so a slow balance read never blocks the page content's own
// streaming/loading.tsx boundary, and vice versa.

import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { reconcileStudentST } from "@/lib/st-economy/reconcile";
import { getStudentBalance } from "@/lib/data/get-st-balance";
import type { BalanceZone } from "@/types/types";

const ZONE_STYLES: Record<
    BalanceZone,
    {
        label: string | null;
        badgeVariant: "warning" | "destructive";
        barClassName: string;
        message: string | null;
    }
> = {
    normal: {
        label: null,
        badgeVariant: "warning",
        barClassName: "border-border bg-card",
        message: null,
    },
    warning: {
        label: "Warning",
        badgeVariant: "warning",
        barClassName: "border-warning bg-warning-bg text-warning",
        message: "Your Level ST is running low. Keep an eye on it.",
    },
    danger: {
        label: "Danger Zone",
        badgeVariant: "destructive",
        barClassName: "border-error bg-error-bg text-error",
        message: "Your Level ST has hit zero or below. Talk to your instructor.",
    },
};

export async function StudentTopBar({ studentId }: { studentId: string }) {
    // Idempotent - harmless if page.tsx below also reconciles for its own
    // reasons. Kept here too so the balance shown in the bar is always
    // fresh, on every Student page, not just the list page.
    await reconcileStudentST(studentId);
    const balance = await getStudentBalance(studentId);
    const zoneStyle = ZONE_STYLES[balance.zone];

    return (
        <div
            className={`sticky top-0 z-20 border-b px-6 py-3 ${zoneStyle.barClassName}`}
        >
            <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-base font-medium">
                        {/* Welcome, {balance.name} */}
                        {balance.name}
                    </span>
                    {zoneStyle.label && (
                        <Badge variant={zoneStyle.badgeVariant}>{zoneStyle.label}</Badge>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <Coins className="size-4 text-coin" />
                    <span className="text-lg font-bold tabular-nums">
                        {balance.levelSt} ST
                    </span>
                </div>
                {zoneStyle.message && (
                    <p className="w-full text-xs">{zoneStyle.message}</p>
                )}
            </div>
        </div>
    );
}