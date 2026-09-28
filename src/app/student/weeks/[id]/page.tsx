// src/app/student/weeks/[id]/page.tsx
// Server Component - Student Week Detail Page (BEGINNER track)
// Scoped to the student's own group, checks start date, and renders the interactive view.

import { redirect } from "next/navigation";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentWeekDetail } from "@/lib/data/get-student-weeks";
import { StudentWeekDetailView } from "./student-week-detail-view";

export default async function StudentWeekDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const { id } = await params;
    const week = await getStudentWeekDetail(studentId, id);

    if (!week) {
        redirect("/student?message=week-not-found");
    }

    if (week.status === "upcoming") {
        redirect("/student?message=week-not-started");
    }

    return <StudentWeekDetailView week={week} studentId={studentId} />;
}
