// src/app/instructor/weeks/[id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function InstructorWeekDetailLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Hero */}
            <div className="rounded-2xl border border-border/70 bg-space-900/80 p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-64 rounded-xl" />
                        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-32 rounded-xl" />
                        <Skeleton className="h-10 w-28 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-3.5 rounded-xl border border-border/50 bg-space-850/50 space-y-1.5">
                            <Skeleton className="h-3 w-20 rounded-md" />
                            <Skeleton className="h-5 w-16 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Tasks Section Skeleton */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Skeleton className="h-6 w-36 rounded-md" />
                        <Skeleton className="h-3 w-48 rounded-md" />
                    </div>
                    <Skeleton className="h-9 w-32 rounded-xl" />
                </div>

                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-border/70 bg-space-900/80 p-6 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="size-8 rounded-lg" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-5 w-48 rounded-md" />
                                        <Skeleton className="h-3 w-32 rounded-md" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                    <Skeleton className="h-8 w-16 rounded-lg" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-full rounded-md" />
                            <Skeleton className="h-4 w-3/4 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
