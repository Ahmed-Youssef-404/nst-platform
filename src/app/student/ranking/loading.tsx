// src/app/student/ranking/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function RankingLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <Skeleton className="h-6 w-32 rounded-full bg-space-850" />
                <Skeleton className="h-8 w-64 bg-space-850" />
                <Skeleton className="h-4 w-96 max-w-full bg-space-850" />
            </div>

            {/* Podium skeleton */}
            <div className="flex items-end justify-center gap-4 sm:gap-6 px-4 pt-10 pb-4">
                <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-14 w-14 rounded-full bg-space-850" />
                    <Skeleton className="h-4 w-20 bg-space-850" />
                    <Skeleton className="h-28 w-28 sm:w-36 rounded-t-2xl bg-space-850" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-16 w-16 rounded-full bg-space-850" />
                    <Skeleton className="h-4 w-24 bg-space-850" />
                    <Skeleton className="h-40 w-28 sm:w-36 rounded-t-2xl bg-space-850" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-14 w-14 rounded-full bg-space-850" />
                    <Skeleton className="h-4 w-20 bg-space-850" />
                    <Skeleton className="h-24 w-28 sm:w-36 rounded-t-2xl bg-space-850" />
                </div>
            </div>

            {/* Roster skeleton */}
            <div className="rounded-2xl border border-border/70 bg-space-900/60 p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-b-0"
                    >
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-6 rounded-md bg-space-850" />
                            <Skeleton className="h-8 w-8 rounded-full bg-space-850" />
                            <Skeleton className="h-4 w-36 bg-space-850" />
                        </div>
                        <Skeleton className="h-5 w-16 bg-space-850" />
                    </div>
                ))}
            </div>
        </div>
    );
}