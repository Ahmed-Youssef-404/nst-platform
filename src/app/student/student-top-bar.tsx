// src/app/student/student-top-bar.tsx
// Async Server Component. Lives in the Student layout (not a single page)
// so it renders as a sticky bar pinned to the top of every /student page.
// Wrapped in its own <Suspense> in layout.tsx.

import Link from "next/link";
import { Coins, AlertTriangle, ShieldAlert, Sparkles, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { reconcileStudentST } from "@/lib/st-economy/reconcile";
import { getStudentBalance } from "@/lib/data/get-st-balance";
import type { BalanceZone } from "@/types/types";

const ZONE_STYLES: Record<
    BalanceZone,
    {
        label: string | null;
        badgeClassName: string;
        barClassName: string;
        message: string | null;
        icon: typeof AlertTriangle | null;
    }
> = {
    normal: {
        label: "Optimal Zone",
        badgeClassName: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25",
        barClassName: "border-border/80 bg-card/90 text-foreground dark:border-border/70 dark:bg-space-950/80",
        message: null,
        icon: null,
    },
    warning: {
        label: "Low ST Warning",
        badgeClassName: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 animate-pulse",
        barClassName: "border-amber-300/80 bg-amber-50/95 text-amber-900 shadow-xs dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200",
        message: "Your Level ST is running low. Complete tasks or earn bonuses to replenish your balance.",
        icon: AlertTriangle,
    },
    danger: {
        label: "Critical Danger Zone",
        badgeClassName: "bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40 animate-pulse",
        barClassName: "border-red-300/80 bg-red-50/95 text-red-900 shadow-xs dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-200",
        message: "Your Level ST has depleted to zero or below! Contact your instructor to avoid penalties.",
        icon: ShieldAlert,
    },
};

export async function StudentTopBar({ studentId }: { studentId: string }) {
    await reconcileStudentST(studentId);
    const balance = await getStudentBalance(studentId);
    const zoneStyle = ZONE_STYLES[balance.zone];

    return (
        <div
            className={`sticky top-0 z-30 border-b px-4 md:px-8 py-3 backdrop-blur-xl transition-all duration-300 ${zoneStyle.barClassName}`}
        >
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
                {/* Left: Greeting & status */}
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground dark:text-starlight-100 truncate">
                            {balance.name}
                        </span>
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gold-500/10 text-gold-700 dark:text-gold-400 border border-gold-500/25">
                            <Sparkles className="size-2.5 text-gold-600 dark:text-gold-400" />
                            Cadet
                        </span>
                    </div>

                    {zoneStyle.label && balance.zone !== "normal" && (
                        <div className="flex items-center gap-1.5">
                            {zoneStyle.icon && <zoneStyle.icon className="size-3.5 shrink-0" />}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${zoneStyle.badgeClassName}`}>
                                {zoneStyle.label}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right: Star Tokens Balance */}
                <div className="flex shrink-0 items-center gap-3">
                    <Link
                        href="/student/st-history"
                        className="group flex items-center gap-2 rounded-xl bg-card dark:bg-space-850/90 hover:bg-muted/70 dark:hover:bg-space-800 px-3 py-1.5 border border-gold-500/30 shadow-xs dark:shadow-gold transition-all duration-200"
                        title="View ST Transaction History"
                    >
                        <div className="flex size-6 items-center justify-center rounded-lg bg-gold-500/15 text-gold-600 dark:text-gold-400 group-hover:scale-110 transition-transform">
                            <Coins className="size-3.5 text-gold-600 dark:text-gold-400" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-base font-bold tabular-nums text-gold-700 dark:text-gold-300">
                                {balance.levelSt}
                            </span>
                            <span className="text-[11px] font-semibold tracking-wider text-gold-600 dark:text-gold-400 uppercase">
                                ST
                            </span>
                        </div>
                        <ChevronRight className="size-3.5 text-muted-foreground dark:text-starlight-400 group-hover:text-gold-600 dark:group-hover:text-gold-300 transition-colors" />
                    </Link>
                </div>

                {/* Warning / Danger Message */}
                {zoneStyle.message && (
                    <div className="w-full pt-1">
                        <div className="flex items-center gap-2 rounded-lg bg-background/80 dark:bg-space-950/60 px-3 py-1.5 text-xs border border-current/25 shadow-xs">
                            {zoneStyle.icon && <zoneStyle.icon className="size-3.5 shrink-0" />}
                            <p className="font-medium">{zoneStyle.message}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}