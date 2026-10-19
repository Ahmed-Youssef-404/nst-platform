// src/components/avatar/student-avatar.tsx
"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarDataUri } from "@/lib/avatar/generate";
import { getInitials } from "@/lib/profile/initials";
import type { StudentAvatarConfig } from "@/types/avatar";
import { cn } from "@/lib/utils";

export interface StudentAvatarProps {
    avatarConfig?: StudentAvatarConfig | null;
    name: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
    fallbackInitials?: string;
    alt?: string;
}

const SIZE_CLASSES = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-base",
    xl: "size-20 text-xl",
    "2xl": "size-28 text-2xl",
} as const;

export function StudentAvatar({
    avatarConfig,
    name,
    size = "md",
    className,
    fallbackInitials,
    alt,
}: StudentAvatarProps) {
    const dataUri = React.useMemo(() => {
        return generateAvatarDataUri(avatarConfig);
    }, [avatarConfig]);

    const initials = React.useMemo(() => {
        return getInitials(name, fallbackInitials || "ST");
    }, [name, fallbackInitials]);

    return (
        <Avatar
            className={cn(
                "relative shrink-0 overflow-hidden rounded-full border border-gold-500/30 bg-space-900 shadow-xs ring-1 ring-gold-500/15",
                SIZE_CLASSES[size],
                className
            )}
        >
            <AvatarImage
                src={dataUri}
                alt={alt || `${name}'s cadet avatar`}
                className="aspect-square size-full object-cover select-none"
                loading="lazy"
            />
            <AvatarFallback
                className="font-display font-bold uppercase text-gold-400 bg-space-850 select-none"
            >
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}
