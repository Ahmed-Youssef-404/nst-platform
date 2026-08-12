// src/components/student-sidebar.tsx
// Sidebar navigation for the Student area. Structure per design decision:
//   Header  = platform name + collapse trigger
//   Content = nav links - grows one at a time as each door is actually
//             built (never disabled placeholders for unbuilt features).
//             Currently: My Sessions, Ranking, ST History, Send Feedback.
//             Store/Profile will be added the same way once those doors
//             land.
//   Footer  = fixed placeholder avatar (same for every student until the
//             real Avatar/Store system is built) + student's name + Logout
//
// The ST Balance is deliberately NOT here - it lives in the sticky top bar
// above the page content (see student-top-bar.tsx) so it's always fully
// visible on every /student page, regardless of whether the sidebar is
// collapsed or expanded.

import Link from "next/link";
import { CalendarCheck, Coins, MessageSquareWarning, Trophy } from "lucide-react";
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
    { href: "/student/ranking", label: "Ranking", icon: Trophy },
    { href: "/student/st-history", label: "ST History", icon: Coins },
    { href: "/student/feedback", label: "Send Feedback", icon: MessageSquareWarning },
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
            <SidebarHeader className="flex-row items-center justify-between px-3 py-2.5 backdrop-blur-md bg-sidebar">
                <Link
                    href="/student"
                    className="truncate font-display text-sm font-semibold group-data-[collapsible=icon]:hidden"
                >
                    NST Platform
                </Link>
                <SidebarTrigger />
            </SidebarHeader>

            <SidebarContent className=" backdrop-blur-md bg-sidebar">
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

            <SidebarFooter className=" backdrop-blur-md bg-sidebar flex flex-row justify-between gap-3 border-t border-sidebar-border p-3">
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