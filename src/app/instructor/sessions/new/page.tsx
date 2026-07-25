// src/app/instructor/sessions/new/page.tsx
// Create Session page. Expects ?levelId=... in the URL (the Instructor
// gets here via the "+ New Session" button on their dashboard, scoped to
// one Group's active Level).

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getLevelForInstructor } from "@/lib/data/get-level-for-instructor";
import { CreateSessionForm } from "./create-session-form";

export default async function NewSessionPage({
    searchParams,
}: {
    searchParams: Promise<{ levelId?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user || user.role !== "instructor") {
        redirect("/login");
    }

    const { levelId } = await searchParams;

    if (!levelId) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    No Level specified. Start from your dashboard instead.
                </p>
                <Link href="/instructor" className="text-sm text-primary hover:underline">
                    ← Back to dashboard
                </Link>
            </div>
        );
    }

    const level = await getLevelForInstructor(levelId, user.id);

    if (!level) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    This Level doesn&apos;t exist, isn&apos;t active, or you&apos;re not
                    assigned to it.
                </p>
                <Link href="/instructor" className="text-sm text-primary hover:underline">
                    ← Back to dashboard
                </Link>
            </div>
        );
    }

    return <CreateSessionForm level={level} />;
}