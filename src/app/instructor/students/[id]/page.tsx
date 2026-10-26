// src/app/instructor/students/[id]/page.tsx
// Instructor view for a single student's 360 profile.
// Guarded strictly by instructor role and group-assignment authorization.

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getStudent360 } from "@/lib/data/get-student-360";
import { InstructorStudentDetailView } from "./instructor-student-detail-view";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft } from "lucide-react";

export default async function InstructorStudentDetailPage(props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ groupId?: string }>;
}) {
    const user = await getCurrentUser();

    if (!user || user.role !== "instructor") {
        redirect("/login");
    }

    const { id } = await props.params;
    const searchParams = await props.searchParams;

    const data = await getStudent360(id, {
        instructorId: user.id,
    });

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/60 p-12 text-center backdrop-blur-md">
                <AlertCircle className="size-8 text-destructive mb-3" />
                <h3 className="font-display text-base font-bold text-starlight-100">
                    Student Profile Unavailable
                </h3>
                <p className="text-xs text-starlight-400 max-w-sm mt-1 mb-5">
                    This student does not exist, or you are not assigned to their cohort group.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 rounded-xl text-xs font-semibold"
                    render={<Link href="/instructor/students" />}
                >
                    <ChevronLeft className="size-3.5 mr-1" />
                    Return to Student ST
                </Button>
            </div>
        );
    }

    return (
        <InstructorStudentDetailView
            data={data}
            backGroupId={searchParams.groupId}
        />
    );
}
