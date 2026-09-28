// src/app/instructor/weeks/new/page.tsx
// Create Week page. Expects ?groupId=... in the URL (the Instructor
// gets here via the "+ New Week" button on their dashboard).

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getGroupForWeekCreation } from "@/lib/data/get-week-detail";
import { CreateWeekForm } from "./create-week-form";

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
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    No Group specified. Start from your dashboard instead.
                </p>
                <Link href="/instructor" className="text-sm text-primary hover:underline">
                    ← Back to dashboard
                </Link>
            </div>
        );
    }

    const group = await getGroupForWeekCreation(groupId, user.id);

    if (!group) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    This Group doesn&apos;t exist, is not a Beginner track group, or you&apos;re not
                    assigned to it.
                </p>
                <Link href="/instructor" className="text-sm text-primary hover:underline">
                    ← Back to dashboard
                </Link>
            </div>
        );
    }

    return <CreateWeekForm group={group} />;
}
