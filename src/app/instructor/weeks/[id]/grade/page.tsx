// src/app/instructor/weeks/[id]/grade/page.tsx
// Week grading screen for instructors.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getWeekGradingData } from "@/lib/data/get-week-grading-data";
import { WeekGradingView } from "./week-grading-view";

export default async function WeekGradingPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await getCurrentUser();
    if (!user || user.role !== "instructor") {
        redirect("/login");
    }

    const { id } = await params;
    const data = await getWeekGradingData(id, user.id);

    if (!data) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    This Week doesn&apos;t exist, or you&apos;re not assigned to its Group.
                </p>
                <Link href="/instructor" className="text-sm text-primary hover:underline">
                    ← Back to dashboard
                </Link>
            </div>
        );
    }

    return <WeekGradingView data={data} />;
}
