// src/app/student/student-top-bar-skeleton.tsx
// Suspense fallback for <StudentTopBar>, shown for the instant it takes to
// reconcile + read the balance. Shape mirrors the real bar 1:1 so there's
// no layout shift when it swaps in.

import { Skeleton } from "@/components/ui/skeleton";

export function StudentTopBarSkeleton() {
    return (
        <div className="sticky top-0 z-20 border-b border-border px-6 py-3 backdrop-blur-md bg-white/5">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
                <Skeleton className="h-5 w-32 bg-white/30" />
                <Skeleton className="h-6 w-16 bg-white/30" />
            </div>
        </div>
    );
}