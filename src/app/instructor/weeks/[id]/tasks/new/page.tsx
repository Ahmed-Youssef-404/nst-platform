// src/app/instructor/weeks/[id]/tasks/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getWeekDetail } from "@/lib/data/get-week-detail";
import { TaskCreateView } from "./task-create-view";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft } from "lucide-react";

export default async function NewTaskPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await getCurrentUser();
    if (!user || user.role !== "instructor") {
        redirect("/login");
    }

    const { id } = await params;
    const week = await getWeekDetail(id, user.id);

    if (!week) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/60 p-12 text-center backdrop-blur-md">
                    <AlertCircle className="size-8 text-error-400 mb-3" />
                    <h3 className="font-display text-base font-bold text-foreground">
                        Week Not Found
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                        This Week doesn&apos;t exist, or you are not assigned to its Group.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs font-semibold"
                        render={<Link href="/instructor" />}
                    >
                        <ChevronLeft className="size-3.5 mr-1" />
                        Back to dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (!week.canEditTasks) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-space-900/60 p-12 text-center backdrop-blur-md">
                    <AlertCircle className="size-8 text-amber-500 mb-3" />
                    <h3 className="font-display text-base font-bold text-foreground">
                        Tasks are Locked
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
                        This week has already begun, so new tasks can no longer be added.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs font-semibold"
                        render={<Link href={`/instructor/weeks/${week.id}`} />}
                    >
                        <ChevronLeft className="size-3.5 mr-1" />
                        Back to {week.name}
                    </Button>
                </div>
            </div>
        );
    }

    return <TaskCreateView week={week} />;
}
