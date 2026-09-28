// src/app/student/levels/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function LevelHistoryLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <Skeleton className="h-6 w-32 rounded-full bg-space-850" />
                <Skeleton className="h-8 w-64 bg-space-850" />
                <Skeleton className="h-4 w-96 max-w-full bg-space-850" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border/70 bg-space-900/60 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20 bg-space-850" />
                            <Skeleton className="h-5 w-24 rounded-full bg-space-850" />
                        </div>
                        <Skeleton className="h-6 w-48 bg-space-850" />
                        <div className="pt-4 border-t border-border/50 flex justify-between">
                            <Skeleton className="h-4 w-32 bg-space-850" />
                            <Skeleton className="h-4 w-20 bg-space-850" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}