// src/app/super-admin/batches/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function BatchesLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <span className="text-starlight-400">/</span>
                        <Skeleton className="h-4 w-32 rounded-md" />
                    </div>
                    <Skeleton className="h-8 w-56 rounded-xl" />
                    <Skeleton className="h-4 w-80 max-w-full rounded-md" />
                </div>
                <Skeleton className="h-10 w-36 rounded-xl" />
            </div>

            {/* Batch Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-border/70 bg-space-900/80 p-5 space-y-4 shadow-xs"
                    >
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40 rounded-md" />
                            <Skeleton className="h-3 w-48 rounded-md" />
                        </div>
                        <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                            <Skeleton className="h-4 w-20 rounded-md" />
                            <Skeleton className="h-4 w-20 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Groups Section */}
            <div className="rounded-2xl border border-border/70 bg-space-900/80 p-6 space-y-4">
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
                            className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-space-850/50"
                        >
                            <div className="flex items-center gap-3">
                                <Skeleton className="size-9 rounded-lg" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32 rounded-md" />
                                    <Skeleton className="h-3 w-48 rounded-md" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-24 rounded-full" />
                                <Skeleton className="h-7 w-16 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
