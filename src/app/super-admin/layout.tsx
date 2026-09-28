// src/app/super-admin/layout.tsx
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/super-admin-sidebar";
import StarsBackground from "@/components/StarsBackground";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { Crown } from "lucide-react";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    let adminName = "Super Admin";
    let adminEmail = user?.email ?? "";

    if (user?.id) {
        try {
            const superAdmin = await prisma.superAdmin.findUnique({
                where: { id: user.id },
                select: { name: true, email: true },
            });
            if (superAdmin) {
                adminName = superAdmin.name;
                adminEmail = superAdmin.email;
            }
        } catch {
            // graceful fallback
        }
    }

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full bg-space-950 text-starlight-100 selection:bg-gold-500/25 selection:text-gold-300">
                <SuperAdminSidebar
                    adminName={adminName}
                    adminEmail={adminEmail}
                />

                <SidebarInset className="flex flex-col min-w-0 bg-transparent relative">
                    <StarsBackground />

                    {/* Top Command Bar */}
                    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-space-900/80 dark:bg-space-950/80 px-4 md:px-8 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger className="text-starlight-400 hover:text-starlight-100 hover:bg-space-850 p-2 rounded-lg transition-colors" />
                            <div className="h-4 w-px bg-border/80 hidden sm:block" />
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-700 dark:text-gold-400 border border-gold-500/25 shadow-xs">
                                    <Crown className="size-3.5 text-gold-600 dark:text-gold-400 animate-pulse" />
                                    <span>Super Admin Command Deck</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex flex-col text-right">
                                <span className="text-xs font-semibold text-starlight-100">
                                    {adminName}
                                </span>
                                <span className="text-[10px] text-starlight-400 font-mono">
                                    {adminEmail}
                                </span>
                            </div>
                            <div className="h-4 w-px bg-border/80 hidden md:block" />
                            <ThemeToggle />
                            <LogoutButton />
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 w-full relative z-10 px-4 py-8 md:px-8 max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}