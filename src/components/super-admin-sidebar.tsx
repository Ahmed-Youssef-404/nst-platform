// src/components/super-admin-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ChevronRight,
    Users,
    Layers,
    Sparkles,
    Shield,
    Crown,
    GraduationCap,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";

const NAV_ITEMS = [
    {
        href: "/super-admin",
        label: "Overview & Users",
        icon: Users,
        description: "Dashboard, students & instructors",
        exact: true,
    },
    {
        href: "/super-admin/batches",
        label: "Batches & Groups",
        icon: Layers,
        description: "Cohorts, tracks & assignments",
        exact: true,
    },
    {
        href: "/super-admin/levels",
        label: "Levels & Progression",
        icon: Sparkles,
        description: "Active levels per group",
        exact: true,
    },
];

function getSuperAdminSubLinks(itemHref: string, pathname: string) {
    // Direct command views with no sub-routes currently.
    // Return empty array to keep sidebar clean.
    return [];
}

export function SuperAdminSidebar({
    adminName,
    adminEmail,
}: {
    adminName: string;
    adminEmail: string;
}) {
    const pathname = usePathname();
    const isProfileActive = pathname === "/super-admin/profile";

    const initials =
        adminName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "SA";

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-border/80 bg-space-900 dark:bg-space-950/95 backdrop-blur-xl transition-all duration-300"
        >
            {/* Header */}
            <SidebarHeader className="border-b border-border/70 p-3.5">
                <div className="flex items-center justify-between gap-2.5 group-data-[collapsible=icon]:justify-center">
                    <Link
                        href="/super-admin"
                        className="flex items-center gap-2.5 truncate group-data-[collapsible=icon]:hidden focus:outline-hidden"
                    >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400/25 via-gold-500/15 to-transparent border border-gold-500/30 shadow-gold">
                            <Crown className="size-4 text-gold-600 dark:text-gold-400 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                            <span className="truncate font-display text-sm font-bold tracking-tight text-starlight-100 block">
                                NST Platform
                            </span>
                            <span className="text-[10px] text-gold-600 dark:text-gold-400 font-bold tracking-wider uppercase block -mt-0.5">
                                Super Admin Suite
                            </span>
                        </div>
                    </Link>

                    <SidebarTrigger className="group-data-[collapsible=icon]:ml-0 text-starlight-400 hover:text-starlight-100 hover:bg-space-850 p-1.5 rounded-lg transition-colors" />
                </div>
            </SidebarHeader>

            {/* Navigation Content */}
            <SidebarContent className="px-3 py-4">
                <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-starlight-400 group-data-[collapsible=icon]:hidden">
                    Command Menu
                </div>

                <SidebarMenu className="gap-1.5">
                    {NAV_ITEMS.map((item) => {
                        const subLinks = getSuperAdminSubLinks(item.href, pathname);
                        const isExactActive = pathname === item.href;
                        const isParentActive = !item.exact && pathname.startsWith(item.href);
                        const isHighlighted = isExactActive || isParentActive;

                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    tooltip={item.label}
                                    render={<Link href={item.href} />}
                                    className={`
                                        relative h-12 px-3 rounded-xl text-sm font-medium
                                        transition-all duration-200
                                        group-data-[collapsible=icon]:justify-center
                                        group-data-[collapsible=icon]:px-0
                                        ${
                                            isExactActive
                                                ? "bg-gold-500/15 text-gold-700 dark:text-gold-300 border border-gold-500/35 shadow-gold font-semibold"
                                                : isParentActive
                                                  ? "bg-space-850/80 text-starlight-100 border border-gold-500/25 font-medium"
                                                  : "text-starlight-300 hover:bg-space-850 hover:text-starlight-100 border border-transparent"
                                        }
                                    `}
                                >
                                    <item.icon
                                        className={`
                                            size-5 shrink-0 transition-transform duration-200
                                            ${isHighlighted ? "text-gold-600 dark:text-gold-400 scale-110" : "text-starlight-400 group-hover:text-starlight-200"}
                                        `}
                                    />

                                    <div className="flex flex-col min-w-0 text-left group-data-[collapsible=icon]:hidden">
                                        <span className={`truncate font-semibold text-xs tracking-tight ${isHighlighted ? "text-gold-700 dark:text-gold-300" : "text-starlight-100"}`}>
                                            {item.label}
                                        </span>
                                        <span className={`truncate text-[10px] font-normal ${isHighlighted ? "text-gold-600/80 dark:text-gold-400/80" : "text-starlight-400"}`}>
                                            {item.description}
                                        </span>
                                    </div>
                                </SidebarMenuButton>

                                {subLinks.length > 0 && (
                                    <SidebarMenuSub className="my-1.5 ml-4 mr-1 flex flex-col gap-1 border-l-2 border-gold-500/30 pl-2.5 py-0.5 group-data-[collapsible=icon]:hidden animate-fade-in">
                                        {subLinks.map((sub: any) => (
                                            <SidebarMenuSubItem key={sub.href}>
                                                <SidebarMenuSubButton
                                                    render={<Link href={sub.href} />}
                                                    isActive={sub.isActive}
                                                    className={`
                                                        relative h-8 px-2.5 rounded-lg text-xs font-medium
                                                        transition-all duration-150 flex items-center gap-2
                                                        ${
                                                            sub.isActive
                                                                ? "bg-gold-500/15 text-gold-700 dark:text-gold-300 border border-gold-500/35 shadow-xs font-semibold"
                                                                : "text-starlight-300 hover:bg-space-850 hover:text-starlight-100 border border-transparent"
                                                        }
                                                    `}
                                                >
                                                    <sub.icon
                                                        className={`size-3.5 shrink-0 transition-colors ${
                                                            sub.isActive
                                                                ? "text-gold-600 dark:text-gold-400"
                                                                : "text-starlight-400"
                                                        }`}
                                                    />
                                                    <span className="truncate">{sub.label}</span>
                                                    {sub.isActive && (
                                                        <span className="ml-auto size-1.5 rounded-full bg-gold-500 dark:bg-gold-400 shadow-[0_0_6px_rgba(234,179,8,0.7)] shrink-0" />
                                                    )}
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                )}
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="border-t border-border/70 p-2.5 bg-space-850/40 dark:bg-space-900/60">
                <Link
                    href="/super-admin/profile"
                    aria-label="My Profile"
                    title="My Profile"
                    aria-current={isProfileActive ? "page" : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-xl p-2 transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold-500/40 ${
                        isProfileActive
                            ? "bg-gold-500/15 ring-1 ring-gold-500/35 font-semibold text-gold-700 dark:text-gold-300"
                            : "hover:bg-space-850 text-starlight-300 hover:text-starlight-100"
                    }`}
                >
                    <Avatar size="sm" className="shrink-0 border border-gold-500/30 bg-gold-500/10 text-gold-600 dark:text-gold-400 ring-1 ring-gold-500/20">
                        <AvatarFallback className="font-bold text-xs text-gold-700 dark:text-gold-400 bg-gold-500/10 dark:bg-space-850">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden text-left">
                        <p className="truncate text-xs font-semibold text-starlight-100 flex items-center gap-1">
                            {adminName}
                            <Shield className="size-2.5 text-gold-600 dark:text-gold-400 inline shrink-0" />
                        </p>
                        <p className="truncate text-[10px] text-starlight-400 font-mono">
                            {adminEmail}
                        </p>
                    </div>

                    <ChevronRight className="size-4 shrink-0 text-starlight-400 transition-transform group-hover:translate-x-0.5 group-data-[collapsible=icon]:hidden" />
                </Link>
            </SidebarFooter>
        </Sidebar>
    );
}
