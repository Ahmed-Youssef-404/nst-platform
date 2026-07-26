// src/app/student/loading.tsx
// Next.js automatically wraps page.tsx in a Suspense boundary using this
// file as the fallback, so navigation to /student is instant and this
// skeleton is shown while the server component awaits reconcileStudentST +
// getStudentBalance + getStudentLevel, instead of the browser sitting on
// the previous page until all of that resolves.
//
// Shapes mirror STBalanceCard and SessionListView 1:1 (same Card/CardHeader
// structure, same grid-cols-2 balance layout, same card list) so there's no
// layout shift when the real content swaps in.

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboardLoading() {
    return (
        <div className="space-y-6">
            {/* STBalanceCard skeleton */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-12" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-12" />
                    </div>
                </CardContent>
            </Card>

            {/* SessionListView skeleton */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="h-4 w-32" />
                </div>

                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex-row items-center justify-between space-y-0">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </CardHeader>
                            <CardContent className="flex items-center justify-between">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-14" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}