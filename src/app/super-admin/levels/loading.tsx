// src/app/super-admin/levels/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function LevelsLoading() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20 rounded-md" />
                        <span className="text-starlight-400">/</span>
                        <Skeleton className="h-4 w-28 rounded-md" />
                    </div>
                    <Skeleton className="h-8 w-60 rounded-xl" />
                    <Skeleton className="h-4 w-88 max-w-full rounded-md" />
                </div>
                <Skeleton className="h-10 w-36 rounded-xl" />
            </div>

            {/* Level Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-32 rounded-xl shrink-0" />
                ))}
            </div>

            {/* Level Card Details */}
            <div className="rounded-2xl border border-border/70 bg-space-900/80 p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-7 w-52 rounded-md" />
                        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-24 rounded-xl" />
                        <Skeleton className="h-8 w-24 rounded-xl" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border border-border/50 bg-space-850/50 space-y-2">
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <Skeleton className="h-6 w-16 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Weeks List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-40 rounded-md" />
                    <Skeleton className="h-8 w-28 rounded-xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-border/70 bg-space-900/70 p-5 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-24 rounded-md" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-6 w-48 rounded-md" />
                            <Skeleton className="h-3 w-64 rounded-md" />
                            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                                <Skeleton className="h-4 w-20 rounded-md" />
                                <Skeleton className="h-7 w-20 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
