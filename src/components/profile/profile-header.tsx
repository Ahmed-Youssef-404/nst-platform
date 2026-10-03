// src/components/profile/profile-header.tsx
// Identity block shared by all three roles: avatar (initials), name, role
// badge, a one-line description and optional identifier chips.

import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/profile/initials";

export interface ProfileChip {
    icon: LucideIcon;
    label: string;
    value: string;
    mono?: boolean;
}

export function ProfileHeader({
    name,
    roleLabel,
    roleIcon: RoleIcon,
    description,
    initialsFallback,
    chips = [],
}: {
    name: string;
    roleLabel: string;
    roleIcon: LucideIcon;
    description: string;
    initialsFallback: string;
    chips?: ProfileChip[];
}) {
    return (
        <header className="relative overflow-hidden rounded-2xl border border-gold-500/25 bg-card p-6 shadow-md dark:bg-space-900/80 md:p-8">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-gold-500/10 blur-3xl"
            />

            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <Avatar className="size-20 shrink-0 border border-gold-500/35 bg-gold-500/10 ring-4 ring-gold-500/10 sm:size-24">
                    <AvatarFallback className="bg-gold-500/10 font-display text-2xl font-bold text-gold-700 dark:bg-space-850 dark:text-gold-300 sm:text-3xl">
                        {getInitials(name, initialsFallback)}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/25 bg-gold-500/10 px-2.5 py-0.5 text-xs font-semibold text-gold-700 dark:text-gold-400">
                        <RoleIcon className="size-3" aria-hidden="true" />
                        {roleLabel}
                    </span>

                    <h1 className="break-words font-display text-2xl font-bold tracking-tight text-starlight-100 sm:text-3xl">
                        {name}
                    </h1>

                    <p className="text-sm text-starlight-400">{description}</p>

                    {chips.length > 0 && (
                        <ul className="flex flex-wrap gap-2 pt-1">
                            {chips.map((chip) => (
                                <li
                                    key={chip.label}
                                    className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border/70 bg-space-850/60 px-2.5 py-1 text-xs text-starlight-300"
                                >
                                    <chip.icon
                                        className="size-3.5 shrink-0 text-gold-600 dark:text-gold-400"
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only">{chip.label}: </span>
                                    <span className={chip.mono ? "truncate font-mono" : "truncate"}>
                                        {chip.value}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </header>
    );
}
