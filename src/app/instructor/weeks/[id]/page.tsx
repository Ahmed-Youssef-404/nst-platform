// src/app/instructor/weeks/[id]/page.tsx
// Week detail & management page for instructors.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getWeekDetail } from "@/lib/data/get-week-detail";
import { WeekDetailView } from "./week-detail-view";

export default async function WeekDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await getCurrentUser();
    if (!user || user.role !== "instructor") {
        redirect("/login");
    }

    const { id } = await params;
    const week = await getWeekDetail(id, user.id);

    if (!week) {
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

    return <WeekDetailView week={week} />;
}
