// src/app/student/st-history/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function STHistoryLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <Skeleton className="h-6 w-32 rounded-full bg-space-850" />
                <Skeleton className="h-8 w-64 bg-space-850" />
                <Skeleton className="h-4 w-96 max-w-full bg-space-850" />
            </div>

            {/* Summary cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-24 rounded-2xl bg-space-850" />
                <Skeleton className="h-24 rounded-2xl bg-space-850" />
                <Skeleton className="h-24 rounded-2xl bg-space-850" />
            </div>

            {/* Timeline rows skeleton */}
            <div className="rounded-2xl border border-border/70 bg-space-900/60 p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-b-0"
                    >
                        <div className="flex items-center gap-3.5">
                            <Skeleton className="h-10 w-10 rounded-xl bg-space-850" />
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-44 bg-space-850" />
                                <Skeleton className="h-3 w-28 bg-space-850" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-16 bg-space-850" />
                    </div>
                ))}
            </div>
        </div>
    );
}