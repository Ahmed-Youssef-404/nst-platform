// src/app/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
    return (
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in">
            {/* Top Bar Skeleton */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-72 rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-xl" />
                    <Skeleton className="h-9 w-28 rounded-xl" />
                </div>
            </div>

            {/* Metric Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-border/70 bg-space-900/80 p-5 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <Skeleton className="size-8 rounded-lg" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-md" />
                        <Skeleton className="h-3 w-32 rounded-md" />
                    </div>
                ))}
            </div>

            {/* Main Area Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-border/70 bg-space-900/80 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-40 rounded-md" />
                        <Skeleton className="h-8 w-24 rounded-xl" />
                    </div>
                    <div className="space-y-3 pt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-2 border-b border-border/40 last:border-b-0">
                                <Skeleton className="size-10 rounded-xl" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-1/3 rounded-md" />
                                    <Skeleton className="h-3 w-1/2 rounded-md" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-space-900/80 p-6 space-y-4">
                    <Skeleton className="h-5 w-32 rounded-md" />
                    <div className="space-y-3 pt-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-3.5 rounded-xl border border-border/60 bg-space-850/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-24 rounded-md" />
                                    <Skeleton className="h-3 w-12 rounded-md" />
                                </div>
                                <Skeleton className="h-3 w-full rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
