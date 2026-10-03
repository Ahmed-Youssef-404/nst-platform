// src/components/profile/profile-skeleton.tsx
// Shared loading state for the three profile routes.

import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
    return (
        <div
            className="mx-auto max-w-4xl space-y-6 animate-fade-in"
            aria-busy="true"
            aria-label="Loading profile"
        >
            <div className="flex flex-col items-start gap-5 rounded-2xl border border-border/70 bg-space-900/80 p-6 sm:flex-row sm:items-center md:p-8">
                <Skeleton className="size-20 shrink-0 rounded-full sm:size-24" />
                <div className="w-full flex-1 space-y-3">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-8 w-2/3 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
            </div>

            {Array.from({ length: 2 }).map((_, i) => (
                <div
                    key={i}
                    className="space-y-4 rounded-2xl border border-border/70 bg-space-900/70 p-5 md:p-6"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-xl" />
                        <Skeleton className="h-5 w-40 rounded-md" />
                    </div>
                    {Array.from({ length: 3 }).map((__, j) => (
                        <div key={j} className="grid gap-2 sm:grid-cols-[10.5rem_1fr] sm:gap-4">
                            <Skeleton className="h-3 w-24 rounded-md" />
                            <Skeleton className="h-4 w-2/3 rounded-md" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
