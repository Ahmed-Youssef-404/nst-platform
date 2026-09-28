// src/app/student/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboardLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Level Hero Skeleton */}
            <div className="rounded-2xl border border-border/70 bg-space-900/60 p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-32 rounded-full bg-space-850" />
                            <Skeleton className="h-6 w-24 rounded-full bg-space-850" />
                        </div>
                        <Skeleton className="h-8 w-64 bg-space-850" />
                        <Skeleton className="h-4 w-96 max-w-full bg-space-850" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-20 w-24 rounded-xl bg-space-850" />
                        <Skeleton className="h-20 w-24 rounded-xl bg-space-850" />
                        <Skeleton className="h-20 w-24 rounded-xl bg-space-850" />
                    </div>
                </div>

                <Skeleton className="h-2 w-full rounded-full bg-space-850" />
            </div>

            {/* Sessions Cards Skeleton */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-44 bg-space-850" />
                    <Skeleton className="h-4 w-20 bg-space-850" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-border/70 bg-space-900/50 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-20 bg-space-850" />
                                <Skeleton className="h-5 w-20 rounded-full bg-space-850" />
                            </div>
                            <Skeleton className="h-6 w-3/4 bg-space-850" />
                            <div className="space-y-2 border-t border-border/50 pt-3">
                                <Skeleton className="h-4 w-40 bg-space-850" />
                                <Skeleton className="h-4 w-28 bg-space-850" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}