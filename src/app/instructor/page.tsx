// src/app/instructor/page.tsx
// Instructor dashboard: every Group the Instructor is assigned to, each
// with its currently active Level and that Level's Sessions inline.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMyGroups } from "@/lib/data/get-my-groups";
import { InstructorDashboardView } from "./instructor-dashboard-view";

export default async function InstructorDashboardPage() {
    // Middleware already guards /instructor for the "instructor" role, but
    // a server component should never trust that alone - verify directly.
    const user = await getCurrentUser();

    if (!user || user.role !== "instructor") {
        redirect("/login");
    }

    const groups = await getMyGroups(user.id);

    return <InstructorDashboardView groups={groups} />;
}