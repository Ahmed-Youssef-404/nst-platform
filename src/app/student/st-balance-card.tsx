// src/app/student/st-balance-card.tsx
// Pure presentational component - all data comes in as props from the
// server component that fetched it. No client-side data fetching here.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BalanceZone } from "@/types/types";

interface STBalanceCardProps {
    name: string;
    levelSt: number;
    totalSt: number;
    zone: BalanceZone;
    warningThreshold: number;
}

const ZONE_STYLES: Record<BalanceZone, { label: string; className: string }> = {
    normal: {
        label: "On track",
        className: "border-border bg-card text-foreground",
    },
    warning: {
        label: "Warning",
        className: "border-yellow-400 bg-yellow-50 text-yellow-900",
    },
    danger: {
        label: "Danger Zone",
        className: "border-red-400 bg-red-50 text-red-900",
    },
};

export function STBalanceCard({
    name,
    levelSt,
    totalSt,
    zone,
    warningThreshold,
}: STBalanceCardProps) {
    const zoneStyle = ZONE_STYLES[zone];

    return (
        <Card className={zoneStyle.className}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Welcome, {name}</span>
                    <span className="rounded-full border px-3 py-1 text-xs font-medium">
                        {zoneStyle.label}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">Level ST</p>
                    <p className="text-3xl font-bold">{levelSt}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Total ST</p>
                    <p className="text-3xl font-bold">{totalSt}</p>
                </div>
                {zone === "warning" && (
                    <p className="col-span-2 text-sm">
                        Your Level ST is at or below {warningThreshold}. Keep an eye on it.
                    </p>
                )}
                {zone === "danger" && (
                    <p className="col-span-2 text-sm font-medium">
                        Your Level ST has hit zero or below. Talk to your instructor if
                        you&apos;re not sure why.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}