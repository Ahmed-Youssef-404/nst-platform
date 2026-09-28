// src/app/instructor/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function InstructorDashboardLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Hero Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/70">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-32 rounded-full" />
                        <Skeleton className="h-5 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-8 w-60 rounded-xl" />
                    <Skeleton className="h-4 w-96 max-w-full rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-36 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-border/70 bg-space-900/80 p-5 space-y-3 shadow-xs"
                    >
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <Skeleton className="size-8 rounded-xl" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-md" />
                        <Skeleton className="h-3 w-32 rounded-md" />
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-border/70 bg-space-900/80 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-36 rounded-md" />
                            <Skeleton className="h-3 w-48 rounded-md" />
                        </div>
                        <Skeleton className="h-8 w-28 rounded-xl" />
                    </div>

                    <div className="space-y-3 pt-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-space-850/50 gap-4"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Skeleton className="size-10 rounded-xl shrink-0" />
                                    <div className="space-y-1.5 min-w-0">
                                        <Skeleton className="h-4 w-36 rounded-md" />
                                        <Skeleton className="h-3 w-48 rounded-md" />
                                    </div>
                                </div>
                                <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-space-900/80 p-6 space-y-4">
                    <Skeleton className="h-5 w-32 rounded-md" />
                    <div className="space-y-3 pt-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-xl border border-border/50 bg-space-850/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-28 rounded-md" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-3 w-full rounded-md" />
                                <Skeleton className="h-3 w-2/3 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
