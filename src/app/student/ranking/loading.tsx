// src/app/student/ranking/loading.tsx
// Next.js automatically wraps page.tsx in a Suspense boundary using this
// file as the fallback (same pattern as st-history/loading.tsx). Shape
// mirrors the podium + list so there's minimal layout shift when the
// real content swaps in.

import { Skeleton } from "@/components/ui/skeleton";

export default function RankingLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-72" />
            </div>

            {/* Podium skeleton */}
            <div className="flex items-end justify-center gap-3 px-2 pt-8">
                <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-16 w-20 rounded-t-lg" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-24 w-20 rounded-t-lg" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-12 w-20 rounded-t-lg" />
                </div>
            </div>

            {/* List skeleton */}
            <div className="space-y-1">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between gap-4 border-b border-border py-3.5"
                    >
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-5 w-14" />
                    </div>
                ))}
            </div>
        </div>
    );
}