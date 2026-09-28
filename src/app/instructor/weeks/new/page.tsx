// src/app/instructor/weeks/new/page.tsx
// Create Week page. Expects ?groupId=... in the URL (the Instructor
// gets here via the "+ New Week" button on their dashboard).

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getGroupForWeekCreation } from "@/lib/data/get-week-detail";
import { CreateWeekForm } from "./create-week-form";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft } from "lucide-react";

export default async function NewWeekPage({
    searchParams,
}: {
    searchParams: Promise<{ groupId?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user || user.role !== "instructor") {
        redirect("/login");
    }

    const { groupId } = await searchParams;

    if (!groupId) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/60 p-12 text-center backdrop-blur-md">
                <AlertCircle className="size-8 text-amber-400 mb-3" />
                <h3 className="font-display text-base font-bold text-starlight-100">
                    No Group Specified
                </h3>
                <p className="text-xs text-starlight-400 max-w-sm mt-1 mb-5">
                    Please select a beginner group from your dashboard to create a new week.
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

    const group = await getGroupForWeekCreation(groupId, user.id);

    if (!group) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/60 p-12 text-center backdrop-blur-md">
                <AlertCircle className="size-8 text-error-400 mb-3" />
                <h3 className="font-display text-base font-bold text-starlight-100">
                    Group Not Accessible
                </h3>
                <p className="text-xs text-starlight-400 max-w-sm mt-1 mb-5">
                    This Group doesn&apos;t exist, is not a Beginner track group, or you are not assigned to it.
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

    return <CreateWeekForm group={group} />;
}
