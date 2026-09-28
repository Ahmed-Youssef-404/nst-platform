// src/app/student/layout.tsx
// Server Component. Wraps every /student page with the dashboard shell:
//   Sidebar   - platform brand, student navigation, avatar + logout
//   Top bar   - sticky name + ST balance pinned above every page
//   Inset     - the page content with space theme and full responsiveness

import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentStudentId } from "@/lib/auth/get-current-user";
import { getStudentProfile } from "@/lib/data/get-student-name";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student-sidebar";
import { StudentTopBar } from "./student-top-bar";
import { StudentTopBarSkeleton } from "./student-top-bar-skeleton";
import StarsBackground from "@/components/StarsBackground";
import { Sparkles } from "lucide-react";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const studentId = await getCurrentStudentId();

    if (!studentId) {
        redirect("/login");
    }

    const profile = await getStudentProfile(studentId);

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full bg-space-950 text-starlight-100 selection:bg-gold-500/25 selection:text-gold-300">
                <StudentSidebar studentName={profile.name} groupType={profile.groupType} />
                <SidebarInset className="flex flex-col min-w-0 bg-transparent relative">
                    <StarsBackground />

                    {/* Mobile Header Bar */}
                    <header className="flex md:hidden items-center justify-between border-b border-border/70 bg-space-950/90 px-4 py-3 sticky top-0 z-40 backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                            <SidebarTrigger className="text-starlight-300 hover:text-starlight-100 p-1.5 rounded-lg" />
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="size-4 text-gold-400" />
                                <span className="font-display text-sm font-bold tracking-tight text-starlight-100">
                                    NST Platform
                                </span>
                            </div>
                        </div>
                    </header>

                    <Suspense fallback={<StudentTopBarSkeleton />}>
                        <StudentTopBar studentId={studentId} />
                    </Suspense>

                    <main className="flex-1 w-full relative z-10 px-4 py-8 md:px-8 max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}