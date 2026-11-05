// src/components/avatar/avatar-preview-modal.tsx
"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X, Sparkles } from "lucide-react";
import { useAvatarPreview } from "@/lib/avatar/avatar-preview-store";
import { generateAvatarDataUri } from "@/lib/avatar/generate";
import { getInitials } from "@/lib/profile/initials";
import { cn } from "@/lib/utils";

/**
 * Global Avatar Preview Modal.
 * Mounted once at root level (in RootLayout) and controlled via useAvatarPreview.
 * Displays large-size student avatars with gold accents and cosmic dark styling.
 */
export function AvatarPreviewModal() {
    const { isOpen, name, avatarConfig, src: directSrc, fallbackInitials, close } = useAvatarPreview();
    const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

    // Resolve avatar data URI from config if direct src not provided
    const resolvedSrc = React.useMemo(() => {
        if (directSrc) return directSrc;
        if (avatarConfig !== undefined) {
            return generateAvatarDataUri(avatarConfig);
        }
        return null;
    }, [directSrc, avatarConfig]);

    const hasImageError = Boolean(resolvedSrc && failedSrc === resolvedSrc);

    const initials = React.useMemo(() => {
        return getInitials(name || "", fallbackInitials || "ST");
    }, [name, fallbackInitials]);

    return (
        <DialogPrimitive.Root
            open={isOpen}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    close();
                }
            }}
        >
            <DialogPrimitive.Portal>
                {/* Backdrop: Dark translucent background with blur */}
                <DialogPrimitive.Backdrop
                    data-slot="avatar-preview-backdrop"
                    className={cn(
                        "fixed inset-0 z-50 bg-black/80 backdrop-blur-md",
                        "transition-opacity duration-200",
                        "data-open:animate-in data-open:fade-in-0",
                        "data-closed:animate-out data-closed:fade-out-0",
                        "motion-reduce:animate-none motion-reduce:transition-none"
                    )}
                />

                {/* Popup Content Card */}
                <DialogPrimitive.Popup
                    data-slot="avatar-preview-content"
                    aria-label={name ? `${name}'s avatar preview` : "Cadet avatar preview"}
                    className={cn(
                        "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
                        "w-[90vw] max-w-sm sm:max-w-md",
                        "flex flex-col items-center justify-center text-center",
                        "rounded-3xl border border-gold-500/35 bg-space-950/95 p-6 sm:p-8",
                        "shadow-[0_0_50px_rgba(234,179,8,0.18),0_25px_50px_rgba(0,0,0,0.85)]",
                        "backdrop-blur-xl outline-none select-none",
                        "transition-all duration-200",
                        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
                        "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
                        "motion-reduce:animate-none motion-reduce:transition-none"
                    )}
                    onClick={(e) => {
                        // Clicking inside popup must NOT close it
                        e.stopPropagation();
                    }}
                >
                    {/* Close Button */}
                    <DialogPrimitive.Close
                        data-slot="avatar-preview-close"
                        aria-label="Close avatar preview"
                        className={cn(
                            "absolute top-4 right-4 flex size-9 items-center justify-center rounded-full",
                            "border border-border/70 bg-space-900/80 text-starlight-400",
                            "hover:text-gold-300 hover:border-gold-500/50 hover:bg-space-850",
                            "transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold-400"
                        )}
                    >
                        <X className="size-4" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>

                    {/* Cosmic Ambient Glow Behind Avatar */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden rounded-3xl"
                    >
                        <div className="size-72 rounded-full bg-gold-500/10 blur-3xl" />
                        <div className="absolute size-48 rounded-full bg-amber-400/5 blur-2xl" />
                    </div>

                    {/* Large Centered Avatar Container */}
                    <div className="relative group/avatar-frame my-3 flex items-center justify-center">
                        {/* Decorative cosmic pulse ring */}
                        <div
                            aria-hidden="true"
                            className="absolute -inset-2.5 rounded-full border border-gold-500/25 opacity-70 pointer-events-none animate-pulse motion-reduce:animate-none"
                        />

                        {/* Circular frame */}
                        <div
                            className={cn(
                                "relative flex size-56 sm:size-72 md:size-80 items-center justify-center rounded-full",
                                "border-2 border-gold-500/40 bg-space-900 shadow-2xl ring-4 ring-gold-500/15 overflow-hidden",
                                "transition-transform duration-300 group-hover/avatar-frame:scale-[1.02] motion-reduce:group-hover/avatar-frame:scale-100"
                            )}
                        >
                            {resolvedSrc && !hasImageError ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={resolvedSrc}
                                    alt={name ? `${name}'s cadet avatar` : "Cadet avatar preview"}
                                    className="aspect-square size-full object-contain select-none"
                                    onError={() => setFailedSrc(resolvedSrc)}
                                />
                            ) : (
                                <div
                                    className="flex size-full items-center justify-center bg-space-850 font-display font-black text-5xl sm:text-6xl text-gold-400 select-none"
                                    aria-label={initials}
                                >
                                    {initials}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Student Identity Information */}
                    <div className="mt-4 space-y-1.5 w-full max-w-xs">
                        <DialogPrimitive.Title className="font-display text-xl sm:text-2xl font-bold tracking-tight text-starlight-100 truncate px-2">
                            {name || "Cadet Avatar"}
                        </DialogPrimitive.Title>

                        {/* <DialogPrimitive.Description className="text-xs font-mono tracking-widest uppercase text-gold-400/90 flex items-center justify-center gap-1.5">
                            <Sparkles className="size-3 text-gold-400 shrink-0" aria-hidden="true" />
                            <span>NST Cadet Avatar</span>
                        </DialogPrimitive.Description> */}
                    </div>
                </DialogPrimitive.Popup>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
