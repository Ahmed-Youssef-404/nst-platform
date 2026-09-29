// src/app/student/weeks/[id]/loading.tsx
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WeekDetailLoading() {
    return (
        <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-xl bg-card dark:bg-space-900/80 px-3.5 py-1.5 text-xs text-muted-foreground dark:text-starlight-400 border border-border/60">
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
            </div>

            {/* Week Header Skeleton */}
            <div className="rounded-2xl border border-border/80 bg-card dark:bg-space-900/60 p-6 md:p-8 space-y-5">
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-28 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-80 max-w-full" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>

            {/* Two Cards Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 bg-card dark:bg-space-900/60 p-6 space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="rounded-2xl border border-border/80 bg-card dark:bg-space-900/60 p-6 space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
            </div>

            {/* Tasks Pager Skeleton */}
            <div className="rounded-2xl border border-border/80 bg-card dark:bg-space-900/80 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
                <div className="space-y-3 pt-2">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
