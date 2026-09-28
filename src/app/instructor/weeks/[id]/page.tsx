// src/app/instructor/weeks/[id]/page.tsx
// Week detail & management page for instructors.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getWeekDetail } from "@/lib/data/get-week-detail";
import { WeekDetailView } from "./week-detail-view";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft } from "lucide-react";

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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/60 p-12 text-center backdrop-blur-md">
                <AlertCircle className="size-8 text-error-400 mb-3" />
                <h3 className="font-display text-base font-bold text-starlight-100">
                    Week Not Found
                </h3>
                <p className="text-xs text-starlight-400 max-w-sm mt-1 mb-5">
                    This Week doesn&apos;t exist, or you are not assigned to its Group.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 rounded-xl text-xs font-semibold"
                    render={<Link href="/instructor" />}
                >
                    <ChevronLeft className="size-3.5 mr-1" />
                    Back to dashboard
                </Button>
            </div>
        );
    }

    return <WeekDetailView week={week} />;
}
