// src/components/avatar/student-avatar.tsx
"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarDataUri } from "@/lib/avatar/generate";
import { getInitials } from "@/lib/profile/initials";
import { openAvatarPreview } from "@/lib/avatar/avatar-preview-store";
import type { StudentAvatarConfig } from "@/types/avatar";
import { cn } from "@/lib/utils";

export interface StudentAvatarProps {
    avatarConfig?: StudentAvatarConfig | null;
    name: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
    fallbackInitials?: string;
    alt?: string;
    onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
    previewable?: boolean;
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
    onClick,
    previewable = true,
}: StudentAvatarProps) {
    const dataUri = React.useMemo(() => {
        return generateAvatarDataUri(avatarConfig);
    }, [avatarConfig]);

    const initials = React.useMemo(() => {
        return getInitials(name, fallbackInitials || "ST");
    }, [name, fallbackInitials]);

    const isInteractive = previewable || Boolean(onClick);

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        // Stop event propagation so clicking the avatar inside clickable rows, links, or buttons
        // only opens the preview modal and does not trigger parent row navigation or actions.
        e.stopPropagation();
        if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === "function") {
            e.nativeEvent.stopImmediatePropagation();
        }

        if (onClick) {
            onClick(e);
        }

        if (previewable) {
            e.preventDefault();
            openAvatarPreview({
                name,
                avatarConfig,
                fallbackInitials,
                src: dataUri,
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === "function") {
                e.nativeEvent.stopImmediatePropagation();
            }
            e.preventDefault();

            if (onClick) {
                onClick(e as unknown as React.MouseEvent<HTMLElement>);
            }

            if (previewable) {
                openAvatarPreview({
                    name,
                    avatarConfig,
                    fallbackInitials,
                    src: dataUri,
                });
            }
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    return (
        <Avatar
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            title={isInteractive ? (alt || `View ${name}'s avatar`) : undefined}
            aria-label={isInteractive ? (alt || `View ${name}'s avatar`) : undefined}
            onClick={handleClick}
            onKeyDown={isInteractive ? handleKeyDown : undefined}
            onKeyUp={isInteractive ? handleKeyUp : undefined}
            className={cn(
                "relative shrink-0 overflow-hidden rounded-full border border-gold-500/30 bg-space-900 shadow-xs ring-1 ring-gold-500/15",
                SIZE_CLASSES[size],
                isInteractive && "cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 hover:ring-2 hover:ring-gold-400/50 hover:border-gold-400/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold-400 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 motion-reduce:transition-none",
                className
            )}
        >
            <AvatarImage
                src={dataUri}
                alt={alt || `${name}'s cadet avatar`}
                className="aspect-square size-full object-cover select-none pointer-events-none"
                loading="lazy"
            />
            <AvatarFallback
                className="font-display font-bold uppercase text-gold-400 bg-space-850 select-none pointer-events-none"
            >
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}
