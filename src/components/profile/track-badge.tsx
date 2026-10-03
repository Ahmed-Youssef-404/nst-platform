// src/components/profile/track-badge.tsx
// Same Beginner / Intermediate badge styling the instructor dashboard uses.

import { Badge } from "@/components/ui/badge";
import type { GroupTypeCode } from "@/types/types";

export function TrackBadge({ type }: { type: GroupTypeCode }) {
    const isBeginner = type === "BEGINNER";

    return (
        <Badge
            className={
                isBeginner
                    ? "rounded-full border-gold-500/35 bg-gold-500/15 px-3 py-1 text-xs font-semibold text-gold-700 dark:text-gold-300"
                    : "rounded-full border-blue-500/35 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300"
            }
        >
            {isBeginner ? "✦ Beginner Track" : "◆ Intermediate Track"}
        </Badge>
    );
}
