// src/app/student/student-top-bar-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function StudentTopBarSkeleton() {
    return (
        <div className="sticky top-0 z-30 border-b border-border/70 bg-space-950/80 px-4 md:px-8 py-3 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-32 bg-space-850" />
                    <Skeleton className="h-5 w-16 rounded-full bg-space-850" />
                </div>
                <Skeleton className="h-8 w-28 rounded-xl bg-space-850" />
            </div>
        </div>
    );
}