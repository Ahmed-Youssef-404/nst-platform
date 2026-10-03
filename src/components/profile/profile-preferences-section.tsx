// src/components/profile/profile-preferences-section.tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
    Check,
    Loader2,
    LogOut,
    Monitor,
    Moon,
    Palette,
    Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileSection } from "@/components/profile/profile-section";
import { logoutAction } from "@/lib/actions/auth";

const THEME_OPTIONS = [
    {
        value: "light",
        label: "Light",
        description: "Bright theme for daytime focus",
        icon: Sun,
    },
    {
        value: "dark",
        label: "Dark",
        description: "Deep space theme with gold glow",
        icon: Moon,
    },
    {
        value: "system",
        label: "System",
        description: "Syncs with your device settings",
        icon: Monitor,
    },
] as const;

export function ProfilePreferencesSection() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await logoutAction();
        } catch {
            // Next.js redirect naturally redirects; reset only if failed before navigation
            setIsLoggingOut(false);
        }
    };

    return (
        <ProfileSection
            title="Preferences & Session"
            description="Customize your visual appearance and manage your active login session."
            icon={Palette}
        >
            <div className="space-y-6">
                {/* Theme Selector */}
                <div>
                    <div className="mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                            Interface Theme
                        </h3>
                        <p className="mt-0.5 text-xs text-starlight-400">
                            Choose how NST Platform appears to you across all devices.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {THEME_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isActive = mounted && theme === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTheme(option.value)}
                                    aria-pressed={isActive}
                                    className={`group relative flex flex-col items-start rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold-500/40 cursor-pointer ${
                                        isActive
                                            ? "border-gold-500/45 bg-gold-500/10 shadow-gold"
                                            : "border-border/70 bg-space-850/40 hover:border-gold-500/25 hover:bg-space-850/70"
                                    }`}
                                >
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <div
                                            className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                                                isActive
                                                    ? "border-gold-500/35 bg-gold-500/15 text-gold-600 dark:text-gold-400"
                                                    : "border-border/70 bg-space-900/60 text-starlight-400 group-hover:text-starlight-200"
                                            }`}
                                        >
                                            <Icon className="size-4" />
                                        </div>

                                        {isActive && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/30 bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-gold-700 dark:text-gold-300">
                                                <Check className="size-3" />
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    <span
                                        className={`mt-3 block font-display text-sm font-semibold tracking-tight ${
                                            isActive ? "text-gold-700 dark:text-gold-300" : "text-starlight-100"
                                        }`}
                                    >
                                        {option.label}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-starlight-400">
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px bg-border/60" />

                {/* Session & Logout */}
                <div className="rounded-xl border border-border/70 bg-space-850/40 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400">
                                <LogOut className="size-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-starlight-100">
                                    Sign out
                                </h3>
                                <p className="mt-0.5 text-xs text-starlight-400">
                                    End your active session on this device. You will need to sign in again to access NST Platform.
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="shrink-0 border-red-500/30 text-red-600 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/15 dark:hover:text-red-300 focus-visible:ring-red-500/30"
                        >
                            {isLoggingOut ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Signing out...</span>
                                </>
                            ) : (
                                <>
                                    <LogOut className="size-4" />
                                    <span>Log out</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </ProfileSection>
    );
}
