// src/components/student-sidebar.tsx
// Sidebar navigation for the Student area. Structure per design decision:
//   Header  = platform name + collapse trigger
//   Content = nav links (starts with just "My Sessions" - more links like
//             Store/Profile are added later once those doors are built,
//             not as disabled placeholders now)
//   Footer  = fixed placeholder avatar (same for every student until the
//             real Avatar/Store system is built) + student's name + Logout
//
// The ST Balance card is deliberately NOT here - it lives in the page
// content itself so it's always fully visible regardless of whether the
// sidebar is collapsed or expanded.

import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [
    { href: "/student", label: "My Sessions", icon: CalendarCheck },
];

export function StudentSidebar({ studentName }: { studentName: string }) {
    const initials = studentName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="flex-row items-center justify-between px-3 py-3">
                <Link
                    href="/student"
                    className="truncate font-display text-sm font-semibold group-data-[collapsible=icon]:hidden"
                >
                    NST Platform
                </Link>
                <SidebarTrigger />
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu className="px-2">
                    {NAV_ITEMS.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                render={<Link href={item.href} />}
                                tooltip={item.label}
                            >
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="gap-3 border-t border-sidebar-border p-3">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Avatar size="sm" className="shrink-0">
                        <AvatarImage src="/avatar-placeholder.svg" alt="" />
                        <AvatarFallback>{initials || "S"}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
                        {studentName}
                    </span>
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                    <LogoutButton />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}