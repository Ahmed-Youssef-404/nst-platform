// src/app/student/sessions/[id]/page.tsx
// Handles a Session from EITHER the student's active Level (the normal
// "My Sessions" flow) OR one of their past, non-active Levels (the "Level
// History" flow - see src/app/student/levels). A Session id is a UUID, so
// it's globally unique regardless of which Level it belongs to; we just
// need to resolve the right Level to authorize + render it. See
// getSessionLevelId for how that resolution + ownership check works.

import { redirect } from "next/navigation";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentLevelById } from "@/lib/data/get-student-level";
import { getSessionLevelId } from "@/lib/data/get-session-level-id";
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

    const levelId = await getSessionLevelId(id);
    const level = levelId ? await getStudentLevelById(studentId, levelId) : null;
    const session = level?.sessions.find((s) => s.id === id);

    // Either the Session doesn't exist, or it doesn't belong to this
    // student's own Group (whichever Level it's under) - same redirect
    // either way so we don't leak which case it was.
    if (!session) {
        redirect("/student?message=session-not-found");
    }

    // Server-side re-check: the List page already hides "upcoming"
    // Sessions behind a disabled (non-Link) card, but that's a UI-only
    // guard. Anyone who navigates here directly by URL must be bounced
    // back, since students must not access a Session before it starts.
    // (Only ever relevant for the active Level - past Levels' Sessions are
    // always "completed" by definition, but the check is harmless either way.)
    if (session.status === "upcoming") {
        redirect("/student?message=session-not-started");
    }

    return (
        <SessionDetailView
            studentId={studentId}
            session={session}
            isHistorical={!level?.isActive}
        />
    );
}