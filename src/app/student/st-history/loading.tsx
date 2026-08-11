// src/app/student/st-history/loading.tsx
// Next.js automatically wraps page.tsx in a Suspense boundary using this
// file as the fallback (same pattern as student/loading.tsx). Shape
// mirrors StudentSTHistoryView's timeline rows 1:1 so there's no layout
// shift when the real content swaps in.

import { Skeleton } from "@/components/ui/skeleton";

export default function STHistoryLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-72" />
            </div>

            <div className="space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between gap-4 border-b border-border py-3.5"
                    >
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-44" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-5 w-14" />
                    </div>
                ))}
            </div>
        </div>
    );
}