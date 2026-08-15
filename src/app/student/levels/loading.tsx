// src/app/student/levels/loading.tsx
// Next.js automatically wraps page.tsx in a Suspense boundary using this
// file as the fallback (same pattern as ranking/loading.tsx). Shape
// mirrors the Level cards so there's minimal layout shift when the real
// content swaps in.

import { Skeleton } from "@/components/ui/skeleton";

export default function LevelHistoryLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-72" />
            </div>

            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-3 rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}