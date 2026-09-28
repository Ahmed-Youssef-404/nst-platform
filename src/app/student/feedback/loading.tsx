// src/app/student/feedback/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentFeedbackLoading() {
    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="space-y-2 pb-6 border-b border-border/70">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-8 w-56 rounded-xl" />
                <Skeleton className="h-4 w-96 max-w-full rounded-md" />
            </div>

            {/* Form Skeleton */}
            <div className="rounded-2xl border border-border/70 bg-space-900/80 p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 rounded-xl" />
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-36 w-full rounded-xl" />
                </div>

                <div className="flex justify-end pt-4 border-t border-border/50">
                    <Skeleton className="h-10 w-36 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
