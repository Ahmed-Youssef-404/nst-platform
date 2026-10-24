// src/app/instructor/students/page.tsx
// Instructor ST management: pick a student from an assigned group and
// add/deduct ST.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getInstructorStudentsForST } from "@/lib/data/get-instructor-students";
import { InstructorStudentsSTView } from "./instructor-students-st-view";

export default async function InstructorStudentsSTPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== "instructor") {
        redirect("/login");
    }

    const groups = await getInstructorStudentsForST(user.id);

    return <InstructorStudentsSTView groups={groups} />;
}
