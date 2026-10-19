// src/components/profile/student-avatar-section.tsx
"use client";

import * as React from "react";
import { Sparkles, Palette, Check, ArrowRight } from "lucide-react";
import type { StudentAvatarConfig } from "@/types/avatar";
import { StudentAvatar } from "@/components/avatar/student-avatar";
import { AvatarEditor } from "@/components/avatar/avatar-editor";

export function StudentAvatarSection({
    initialConfig,
    studentName,
}: {
    initialConfig: StudentAvatarConfig | null;
    studentName: string;
}) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [savedConfig, setSavedConfig] = React.useState<StudentAvatarConfig | null>(initialConfig);
    const editorRef = React.useRef<HTMLDivElement>(null);

    const handleSaveSuccess = (newConfig: StudentAvatarConfig) => {
        setSavedConfig(newConfig);
    };

    const handleOpenEditor = () => {
        setIsEditing(true);
        setTimeout(() => {
            editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    return (
        <section className="space-y-4">
            {isEditing ? (
                <div ref={editorRef} className="animate-fade-in">
                    <AvatarEditor
                        initialConfig={savedConfig}
                        studentName={studentName}
                        onSaveSuccess={handleSaveSuccess}
                        onCancel={() => setIsEditing(false)}
                    />
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-2xl border border-gold-500/25 bg-card p-6 shadow-md dark:bg-space-900/80 transition-all hover:border-gold-500/40">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-24 -right-16 size-48 rounded-full bg-gold-500/10 blur-3xl"
                    />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <StudentAvatar
                                avatarConfig={savedConfig}
                                name={studentName}
                                size="xl"
                                className="size-16 sm:size-20 border-2 border-gold-500/40 shadow-gold ring-2 ring-gold-500/20"
                            />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gold-400">
                                        <Sparkles className="size-3" />
                                        Cadet Persona
                                    </span>
                                    {savedConfig && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                                            <Check className="size-2.5" />
                                            Customized
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-display text-lg font-bold text-starlight-100">
                                    Cadet Avatar
                                </h3>
                                <p className="text-xs text-starlight-400 max-w-md">
                                    {savedConfig
                                        ? "Your custom 2D avatar represents you in group leaderboards, podiums, and platform spaces."
                                        : "You are currently using the default Cadet avatar. Customize your hairstyle, outfit, expression, and gear."}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleOpenEditor}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500/20 via-gold-500/30 to-gold-500/15 border border-gold-500/40 px-4 py-2.5 text-xs font-bold text-gold-300 shadow-gold transition-all duration-200 hover:bg-gold-500/30 hover:text-gold-200 active:scale-95 shrink-0"
                        >
                            <Palette className="size-4 text-gold-400" />
                            <span>Customize Avatar</span>
                            <ArrowRight className="size-3.5 text-gold-400/80" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
