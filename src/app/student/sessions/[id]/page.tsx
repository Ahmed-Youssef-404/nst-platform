// src/app/student/sessions/[id]/page.tsx
import { redirect } from "next/navigation";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentLevel } from "@/lib/data/get-student-level";
import { SessionDetailView } from "./session-detail-view";

export default async function StudentSessionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const { id } = await params;
    const level = await getStudentLevel(studentId);
    const session = level?.sessions.find((s) => s.id === id);

    // Either the Session doesn't exist, or it doesn't belong to this
    // student's own active Level/Group - same redirect either way so we
    // don't leak which case it was.
    if (!session) {
        redirect("/student?message=session-not-found");
    }

    // Server-side re-check: the List page already hides "upcoming"
    // Sessions behind a disabled (non-Link) card, but that's a UI-only
    // guard. Anyone who navigates here directly by URL must be bounced
    // back, since students must not access a Session before it starts.
    if (session.status === "upcoming") {
        redirect("/student?message=session-not-started");
    }

    return <SessionDetailView studentId={studentId} session={session} />;
}