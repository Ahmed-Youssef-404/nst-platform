// src/app/instructor/sessions/new/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateSessionLoading() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="space-y-2 pb-6 border-b border-border/70">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-8 w-60 rounded-xl" />
                <Skeleton className="h-4 w-96 max-w-full rounded-md" />
            </div>

            {/* Form Card Skeleton */}
            <div className="rounded-2xl border border-border/70 bg-space-900/80 p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-36 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
