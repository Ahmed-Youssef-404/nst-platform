// src/app/super-admin/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function SuperAdminLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Hero Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/70">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-36 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-8 w-64 rounded-xl" />
                    <Skeleton className="h-4 w-96 max-w-full rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-36 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
            </div>

            {/* Quick Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-border/70 bg-space-900/80 p-5 space-y-3 shadow-xs"
                    >
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-28 rounded-md" />
                            <Skeleton className="size-8 rounded-xl" />
                        </div>
                        <Skeleton className="h-9 w-24 rounded-lg" />
                        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                            <Skeleton className="h-3 w-16 rounded-md" />
                            <Skeleton className="h-3 w-28 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Management Tabs Skeleton */}
            <div className="flex items-center gap-2 border-b border-border/70 pb-3">
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-28 rounded-xl" />
            </div>

            {/* Content Table / Cards Skeleton */}
            <div className="rounded-2xl border border-border/70 bg-space-900/80 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Skeleton className="h-6 w-48 rounded-md" />
                        <Skeleton className="h-4 w-64 rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-48 rounded-xl" />
                        <Skeleton className="h-9 w-24 rounded-xl" />
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-space-850/50 gap-4"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <Skeleton className="size-10 rounded-xl shrink-0" />
                                <div className="space-y-1.5 min-w-0">
                                    <Skeleton className="h-4 w-40 rounded-md" />
                                    <Skeleton className="h-3 w-56 rounded-md" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-8 w-20 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
