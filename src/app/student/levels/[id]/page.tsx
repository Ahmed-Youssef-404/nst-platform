// src/app/student/levels/[id]/page.tsx
// Server Component - Detail half of the Level History List+Detail pattern
// (see ../page.tsx for the List half). Reuses the exact same
// SessionListView already used on "My Sessions" - it's driven purely by
// the StudentLevelView shape, so it renders a past Level's Sessions the
// same way it renders the active one.
//
// getStudentLevelById is scoped to the student's own Group (a Level from
// another Group simply won't resolve - see get-student-level.ts), so this
// doubles as the authorization check; no separate ownership query needed.

import { redirect } from "next/navigation";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentLevelById } from "@/lib/data/get-student-level";
import { SessionListView } from "@/app/student/session-list-view";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function LevelHistoryDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const { id } = await params;
    const level = await getStudentLevelById(studentId, id);

    // Either the Level doesn't exist, or it belongs to a different Group -
    // same redirect either way so we don't leak which case it was.
    if (!level) {
        redirect("/student/levels");
    }

    return (
        <div className="space-y-6">
            <Link
                href="/student/levels"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to Level History
            </Link>

            {!level.isActive && (
                <Badge variant="outline" className="w-fit">
                    Past Level
                </Badge>
            )}

            <SessionListView level={level} />
        </div>
    );
}