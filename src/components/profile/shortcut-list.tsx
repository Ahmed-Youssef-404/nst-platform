// src/components/profile/shortcut-list.tsx
// Compact grid of plain navigation links to EXISTING routes. Not a
// dashboard - just quick doors out of the profile page.

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export interface Shortcut {
    href: string;
    label: string;
    description: string;
    icon: LucideIcon;
}

export function ShortcutList({ items }: { items: Shortcut[] }) {
    return (
        <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
                <li key={item.href}>
                    <Link
                        href={item.href}
                        className="group flex h-full items-center gap-3 rounded-xl border border-border/70 bg-space-850/50 p-3.5 transition-all hover:border-gold-500/35 hover:bg-space-850 focus-visible:border-gold-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
                    >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400">
                            <item.icon className="size-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-starlight-100">
                                {item.label}
                            </p>
                            <p className="truncate text-xs text-starlight-400">{item.description}</p>
                        </div>
                        <ChevronRight
                            className="size-4 shrink-0 text-starlight-400 transition-colors group-hover:text-gold-500"
                            aria-hidden="true"
                        />
                    </Link>
                </li>
            ))}
        </ul>
    );
}
