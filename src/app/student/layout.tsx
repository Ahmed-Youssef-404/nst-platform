// src/app/student/layout.tsx
// Server Component. Wraps every /student page with the sidebar shell:
//   Sidebar   - platform name/trigger, "My Sessions" nav, avatar+name+logout
//   Inset     - the actual page content (each page still owns its own
//               data fetching; the layout only needs the student's name
//               for the sidebar footer)
//
// Middleware already guards /student for the "student" role, but this is
// a server component so it verifies directly rather than trusting that
// alone (same pattern as page.tsx).

import { redirect } from "next/navigation";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentName } from "@/lib/data/get-student-name";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student-sidebar";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const name = await getStudentName(studentId);

    return (
        <SidebarProvider>
            <StudentSidebar studentName={name} />
            <SidebarInset>
                <header className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
                    <SidebarTrigger />
                    <span className="font-display text-sm font-semibold">
                        NST Platform
                    </span>
                </header>
                <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}