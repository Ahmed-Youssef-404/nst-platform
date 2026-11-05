// src/app/instructor/students/[id]/loading.tsx
// Shown while the student 360 Server Component fetches its data.
// Mirrors InstructorStudentDetailView + Student360Header + tabs layout.

import { Skeleton, SkeletonAvatar } from "@/components/ui/skeleton";

export default function InstructorStudentDetailLoading() {
    return (
        <div
            className="space-y-6 animate-fade-in pb-12"
            role="status"
            aria-busy="true"
            aria-live="polite"
        >
            <span className="sr-only">Loading student profile…</span>

            {/* Top navigation & action bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3.5 w-32 rounded-md" />
                        <Skeleton className="h-3.5 w-40 rounded-md" />
                    </div>
                    <Skeleton className="h-8 w-60 rounded-xl" />
                    <Skeleton className="h-4 w-96 max-w-full rounded-md" />
                </div>
                <Skeleton className="h-9 w-28 rounded-xl shrink-0 self-start sm:self-center" />
            </div>

            {/* Header card: avatar + identity + stat tiles */}
            <div className="rounded-2xl border border-border/80 bg-space-900/80 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <SkeletonAvatar size="size-20" />
                    <div className="space-y-3 w-full">
                        <div className="flex items-center gap-3 flex-wrap">
                            <Skeleton className="h-8 w-56 rounded-xl" />
                            <Skeleton className="h-6 w-36 rounded-full" />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Skeleton className="h-7 w-44 rounded-lg" />
                            <Skeleton className="h-7 w-52 rounded-lg" />
                            <Skeleton className="h-7 w-40 rounded-lg" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 border-t border-border/70">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-border/80 bg-space-950/60 p-3.5 space-y-2"
                        >
                            <Skeleton className="h-3 w-20 rounded-md" />
                            <Skeleton className="h-6 w-16 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="space-y-4">
                <div className="flex flex-wrap gap-1 rounded-xl border border-border/80 bg-space-900/90 p-1 w-fit max-w-full">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-24 sm:w-28 rounded-lg" />
                    ))}
                </div>

                <div className="rounded-2xl border border-border/70 bg-space-900/80 p-6 space-y-4">
                    <Skeleton className="h-5 w-40 rounded-md" />
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-space-850/50 p-4"
                            >
                                <div className="space-y-1.5 min-w-0">
                                    <Skeleton className="h-4 w-44 max-w-full rounded-md" />
                                    <Skeleton className="h-3 w-64 max-w-full rounded-md" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}