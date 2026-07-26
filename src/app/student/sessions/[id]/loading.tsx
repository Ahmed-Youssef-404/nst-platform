// src/app/student/sessions/[id]/loading.tsx
// Shown by Next.js the instant a student clicks a session card, while
// page.tsx re-fetches getStudentLevel server-side to verify access and
// load the session's Tasks. Shapes mirror SessionDetailView (back link,
// title+badge, meta line, progress line, task pager) to avoid layout shift.

import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SessionDetailLoading() {
    return (
        <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <ArrowLeft className="size-4" />
                Back to My Sessions
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48" />
            </div>

            <Skeleton className="h-4 w-72" />

            {/* TaskPager skeleton */}
            <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                    <Skeleton className="h-5 w-24" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
        </div>
    );
}