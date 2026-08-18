"use client";

import Link from "next/link";
import {
    CalendarCheck,
    Coins,
    History,
    MessageSquareWarning,
    Trophy,
} from "lucide-react";
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
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    {
        href: "/student",
        label: "My Sessions",
        icon: CalendarCheck,
    },
    {
        href: "/student/ranking",
        label: "Ranking",
        icon: Trophy,
    },
    {
        href: "/student/levels",
        label: "Level History",
        icon: History,
    },
    {
        href: "/student/st-history",
        label: "ST History",
        icon: Coins,
    },
    {
        href: "/student/feedback",
        label: "Send Feedback",
        icon: MessageSquareWarning,
    },
];

export function StudentSidebar({
    studentName,
}: {
    studentName: string;
}) {
    const pathname = usePathname();

    const initials = studentName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

    return (
        <Sidebar collapsible="icon">
            {/* Header */}
            <SidebarHeader className="border-b border-sidebar-border">
                <div className="flex items-center justify-between gap-2 p-3 group-data-[collapsible=icon]:justify-center">
                    <Link
                        href="/student"
                        className="truncate font-display text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden"
                    >
                        NST Platform
                    </Link>

                    <SidebarTrigger className="group-data-[collapsible=icon]:ml-0" />
                </div>
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent className="px-2 py-4">
                <SidebarMenu className="gap-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive =
                            item.href === "/student"
                                ? pathname === "/student"
                                : pathname.startsWith(item.href);

                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    // asChild
                                    tooltip={item.label}
                                    className={`
                                        relative h-10 px-3
                                        text-sm font-medium
                                        text-sidebar-foreground/70
                                        transition-colors duration-150
                                        border-b border-sidebar-border

                                        hover:bg-sidebar-accent
                                        hover:text-sidebar-foreground

                                        group-data-[collapsible=icon]:justify-center
                                        group-data-[collapsible=icon]:px-0

                                        ${isActive
                                            ? "bg-sidebar-accent text-sidebar-foreground"
                                            : ""
                                        }
                                    `}
                                >
                                    <Link
                                        href={item.href}
                                        className="flex w-full items-center gap-3"
                                    >
                                        <item.icon
                                            className={`
                                                size-[18px] shrink-0
                                                transition-transform duration-150
                                                ${isActive
                                                    ? "text-primary"
                                                    : "text-sidebar-foreground/50"
                                                }
                                            `}
                                        />

                                        <span className="truncate group-data-[collapsible=icon]:hidden">
                                            {item.label}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="border-t border-sidebar-border p-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar size="sm" className="shrink-0">
                            <AvatarImage
                                src="/avatar-placeholder.svg"
                                alt=""
                            />
                            <AvatarFallback>
                                {initials || "S"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                            <p className="truncate text-sm font-medium">
                                {studentName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Student
                            </p>
                        </div>
                    </div>

                    <div className="group-data-[collapsible=icon]:hidden">
                        <LogoutButton />
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}