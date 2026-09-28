// src/app/student/sessions/[id]/loading.tsx
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionDetailLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="inline-flex items-center gap-2 rounded-xl bg-space-900/80 px-3.5 py-1.5 text-xs text-starlight-400 border border-border/60">
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
            </div>

            {/* Session Header Card Skeleton */}
            <div className="rounded-2xl border border-border/80 bg-space-900/60 p-6 md:p-8 space-y-5">
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full bg-space-850" />
                        <Skeleton className="h-5 w-28 rounded-full bg-space-850" />
                    </div>
                    <Skeleton className="h-8 w-80 max-w-full bg-space-850" />
                    <Skeleton className="h-4 w-48 bg-space-850" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60">
                    <Skeleton className="h-16 rounded-xl bg-space-850" />
                    <Skeleton className="h-16 rounded-xl bg-space-850" />
                    <Skeleton className="h-16 rounded-xl bg-space-850" />
                    <Skeleton className="h-16 rounded-xl bg-space-850" />
                </div>
            </div>

            {/* TaskPager skeleton */}
            <div className="rounded-2xl border border-border/80 bg-space-900/80 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                    <Skeleton className="h-8 w-24 rounded-lg bg-space-850" />
                    <Skeleton className="h-5 w-32 bg-space-850" />
                    <Skeleton className="h-8 w-24 rounded-lg bg-space-850" />
                </div>
                <div className="space-y-3 pt-2">
                    <Skeleton className="h-6 w-1/2 bg-space-850" />
                    <Skeleton className="h-24 w-full rounded-xl bg-space-850" />
                    <Skeleton className="h-32 w-full rounded-xl bg-space-850" />
                </div>
            </div>
        </div>
    );
}