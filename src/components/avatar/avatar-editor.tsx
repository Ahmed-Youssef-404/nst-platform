// src/components/avatar/avatar-editor.tsx
"use client";

import * as React from "react";
import {
    Sparkles,
    Check,
    RotateCcw,
    Dices,
    Loader2,
    Sliders,
    Eye,
    Smile,
    Shirt,
    Glasses,
    UserCheck,
    Save,
    Palette,
    Tag,
} from "lucide-react";
import {
    type StudentAvatarConfig,
    DEFAULT_AVATAR_CONFIG,
    ALLOWED_SKIN_COLORS,
    ALLOWED_HAIR_COLORS,
    ALLOWED_TOPS,
    ALLOWED_CLOTHING,
    ALLOWED_CLOTHING_GRAPHICS,
    ALLOWED_CLOTHES_COLORS,
    ALLOWED_EYES,
    ALLOWED_EYEBROWS,
    ALLOWED_MOUTH,
    ALLOWED_ACCESSORIES,
    ALLOWED_ACCESSORIES_COLORS,
    ALLOWED_FACIAL_HAIR,
    normalizeHexColor,
} from "@/types/avatar";
import {
    SKIN_COLOR_OPTIONS,
    HAIR_COLOR_OPTIONS,
    TOP_OPTIONS,
    CLOTHING_OPTIONS,
    CLOTHING_GRAPHIC_OPTIONS,
    CLOTHES_COLOR_OPTIONS,
    HAT_COLOR_OPTIONS,
    EYES_OPTIONS,
    EYEBROWS_OPTIONS,
    MOUTH_OPTIONS,
    ACCESSORY_OPTIONS,
    ACCESSORIES_COLOR_OPTIONS,
    FACIAL_HAIR_OPTIONS,
    isHeadwearTop,
    type ColorOption,
} from "@/lib/avatar/options";
import {
    getTopThumbnail,
    getEyesThumbnail,
    getEyebrowsThumbnail,
    getMouthThumbnail,
    getClothingThumbnail,
    getGraphicThumbnail,
    getAccessoryThumbnail,
    getFacialHairThumbnail,
} from "@/lib/avatar/thumbnails";
import { generateAvatarDataUri } from "@/lib/avatar/generate";
import { saveStudentAvatarAction } from "@/lib/actions/avatar";
import { cn } from "@/lib/utils";

export interface AvatarEditorProps {
    initialConfig?: StudentAvatarConfig | null;
    studentName: string;
    onSaveSuccess?: (savedConfig: StudentAvatarConfig) => void;
    onCancel?: () => void;
    className?: string;
}

type EditorTab = "hair" | "face" | "base" | "clothing" | "details";

export function AvatarEditor({
    initialConfig,
    studentName,
    onSaveSuccess,
    onCancel,
    className,
}: AvatarEditorProps) {
    const savedConfig = React.useMemo<StudentAvatarConfig>(() => {
        return initialConfig ?? DEFAULT_AVATAR_CONFIG;
    }, [initialConfig]);

    const [currentConfig, setCurrentConfig] = React.useState<StudentAvatarConfig>(savedConfig);
    const [activeTab, setActiveTab] = React.useState<EditorTab>("hair");
    const [isSaving, startSavingTransition] = React.useTransition();
    const [statusMessage, setStatusMessage] = React.useState<{
        type: "success" | "error" | null;
        text: string;
    }>({ type: null, text: "" });

    // Detect if current config differs from saved config
    const isDirty = React.useMemo(() => {
        return JSON.stringify(currentConfig) !== JSON.stringify(savedConfig);
    }, [currentConfig, savedConfig]);

    // Live preview data URI (memoized in memory)
    const previewDataUri = React.useMemo(() => {
        return generateAvatarDataUri(currentConfig);
    }, [currentConfig]);

    const updateConfig = <K extends keyof StudentAvatarConfig>(
        key: K,
        value: StudentAvatarConfig[K]
    ) => {
        setCurrentConfig((prev) => ({ ...prev, [key]: value }));
        setStatusMessage({ type: null, text: "" });
    };

    const handleRandomize = () => {
        const randomFrom = <T,>(arr: readonly T[]): T =>
            arr[Math.floor(Math.random() * arr.length)]!;

        const randomConfig: StudentAvatarConfig = {
            skinColor: randomFrom(ALLOWED_SKIN_COLORS),
            hairColor: randomFrom(ALLOWED_HAIR_COLORS),
            top: randomFrom(ALLOWED_TOPS),
            hatColor: randomFrom(ALLOWED_CLOTHES_COLORS),
            clothing: randomFrom(ALLOWED_CLOTHING),
            clothesColor: randomFrom(ALLOWED_CLOTHES_COLORS),
            clothingGraphic: randomFrom(ALLOWED_CLOTHING_GRAPHICS),
            eyes: randomFrom(ALLOWED_EYES),
            eyebrows: randomFrom(ALLOWED_EYEBROWS),
            mouth: randomFrom(ALLOWED_MOUTH),
            accessories: Math.random() > 0.6 ? randomFrom(ALLOWED_ACCESSORIES) : "none",
            accessoriesColor: randomFrom(ALLOWED_ACCESSORIES_COLORS),
            facialHair: Math.random() > 0.75 ? randomFrom(ALLOWED_FACIAL_HAIR) : "none",
            facialHairColor: randomFrom(ALLOWED_HAIR_COLORS),
        };

        setCurrentConfig(randomConfig);
        setStatusMessage({ type: null, text: "" });
    };

    const handleResetDefault = () => {
        setCurrentConfig(DEFAULT_AVATAR_CONFIG);
        setStatusMessage({ type: null, text: "" });
    };

    const handleRevert = () => {
        setCurrentConfig(savedConfig);
        setStatusMessage({ type: null, text: "" });
    };

    const handleSave = () => {
        startSavingTransition(async () => {
            setStatusMessage({ type: null, text: "" });
            const result = await saveStudentAvatarAction(currentConfig);
            if (result.success) {
                setStatusMessage({
                    type: "success",
                    text: "Avatar updated and synced across NST Platform!",
                });
                onSaveSuccess?.(result.config);
            } else {
                setStatusMessage({
                    type: "error",
                    text: result.error || "Failed to save avatar.",
                });
            }
        });
    };

    const hasHeadwear = isHeadwearTop(currentConfig.top);
    const isGraphicShirt = currentConfig.clothing === "graphicShirt";

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl border border-gold-500/30 bg-card p-4 sm:p-6 shadow-xl dark:bg-space-900/90",
                className
            )}
        >
            {/* Background Ambient Space Glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 -right-24 size-80 rounded-full bg-gold-500/10 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-gold-500/5 blur-3xl"
            />

            {/* Mobile-Only Persistent Sticky Preview Header */}
            <div className="sticky top-0 z-30 -mx-4 -mt-4 mb-4 flex items-center justify-between gap-3 border-b border-gold-500/30 bg-space-950/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:-mt-6 sm:px-6 lg:hidden">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative size-12 shrink-0 rounded-full border-2 border-gold-500/40 bg-gradient-to-b from-space-850 to-space-900 p-0.5 shadow-gold overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewDataUri}
                            alt={`${studentName}'s avatar preview`}
                            className="size-full select-none object-cover rounded-full"
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-bold text-starlight-100">
                                {studentName}
                            </span>
                            {isDirty && (
                                <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400 border border-amber-500/30 animate-pulse">
                                    Unsaved
                                </span>
                            )}
                        </div>
                        <span className="block text-[10px] text-starlight-400">
                            Live Cadet Preview
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleRandomize}
                        title="Randomize Appearance"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-border/70 bg-space-850 text-gold-400 hover:border-gold-500/40 hover:bg-space-800"
                    >
                        <Dices className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !isDirty}
                        className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-gold transition-all",
                            isDirty
                                ? "bg-gradient-to-r from-gold-500 to-gold-600 text-space-950 hover:brightness-110 active:scale-95"
                                : "bg-space-800 text-starlight-400 border border-border/60 cursor-not-allowed opacity-60"
                        )}
                    >
                        {isSaving ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Save className="size-3.5" />
                        )}
                        <span className="text-[11px]">{isDirty ? "Save" : "Saved"}</span>
                    </button>
                </div>
            </div>

            {/* Desktop Top Header */}
            <div className="relative mb-6 hidden items-center justify-between gap-3 border-b border-border/70 pb-4 lg:flex">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-0.5 text-xs font-semibold text-gold-600 dark:text-gold-400">
                            <Sparkles className="size-3" />
                            Cadet Identity System
                        </span>
                        {isDirty && (
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500 dark:text-amber-300 border border-amber-500/30 animate-pulse">
                                Unsaved Changes
                            </span>
                        )}
                    </div>
                    <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-starlight-100 sm:text-2xl">
                        Avatar Customizer
                    </h2>
                    <p className="text-xs text-starlight-400">
                        Design your unique cadet look with visual previews and custom colors.
                    </p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleRandomize}
                        title="Randomize Appearance"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-space-850 px-3 py-1.5 text-xs font-medium text-starlight-200 transition-colors hover:border-gold-500/40 hover:bg-space-800 hover:text-gold-300"
                    >
                        <Dices className="size-3.5 text-gold-400" />
                        <span>Randomize</span>
                    </button>
                    {isDirty && (
                        <button
                            type="button"
                            onClick={handleRevert}
                            title="Revert to Saved"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-space-850 px-3 py-1.5 text-xs font-medium text-starlight-300 transition-colors hover:bg-space-800 hover:text-starlight-100"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Revert</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Layout: Left = Sticky Live Preview, Right = Customization Tabs */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left: Sticky Live Preview (Desktop) */}
                <div className="hidden lg:flex flex-col items-center justify-between rounded-2xl border border-gold-500/25 bg-space-950/60 p-6 text-center lg:col-span-4 !lg:sticky lg:top-4 lg:h-fit">
                    <div className="w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400/90">
                            Live Cadet Preview
                        </span>

                        {/* Avatar Frame with Gold Accent Glow */}
                        <div className="relative mx-auto my-6 flex size-44 sm:size-48 items-center justify-center rounded-full border-2 border-gold-500/40 bg-gradient-to-b from-space-850 to-space-900 p-0.5 shadow-gold ring-4 ring-gold-500/10 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewDataUri}
                                alt={`${studentName}'s avatar preview`}
                                className="size-full select-none object-cover rounded-full"
                            />
                        </div>

                        <h3 className="font-display text-base font-bold text-starlight-100">
                            {studentName}
                        </h3>
                        <p className="text-xs text-starlight-400">NST Student Cadet</p>
                    </div>

                    {/* Status & Save CTA */}
                    <div className="mt-6 w-full space-y-3">
                        {statusMessage.type === "success" && (
                            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-2 text-xs font-semibold text-emerald-300 animate-fade-in">
                                <Check className="size-4 shrink-0" />
                                <span>{statusMessage.text}</span>
                            </div>
                        )}

                        {statusMessage.type === "error" && (
                            <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-2 text-xs font-medium text-rose-300 animate-fade-in">
                                {statusMessage.text}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || !isDirty}
                                className={cn(
                                    "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-gold transition-all duration-200",
                                    isDirty
                                        ? "bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-space-950 hover:brightness-110 active:scale-[0.98]"
                                        : "cursor-not-allowed bg-space-850 text-starlight-400 border border-border/70"
                                )}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Saving Avatar...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-4" />
                                        <span>{isDirty ? "Save Avatar" : "Saved"}</span>
                                    </>
                                )}
                            </button>

                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    disabled={isSaving}
                                    className="w-full rounded-xl border border-border/70 bg-transparent py-2 text-xs font-medium text-starlight-300 transition-colors hover:bg-space-850 hover:text-starlight-100"
                                >
                                    Close Editor
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleResetDefault}
                                className="text-[11px] text-starlight-400 hover:text-gold-300 transition-colors underline-offset-2 hover:underline pt-1"
                            >
                                Reset to Default Cadet Look
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Customization Controls & Visual Options */}
                <div className="space-y-5 lg:col-span-8">
                    {/* Navigation Tab Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border/70 bg-space-950/70 p-1.5 no-scrollbar">
                        <TabButton
                            active={activeTab === "hair"}
                            onClick={() => setActiveTab("hair")}
                            icon={Sparkles}
                            label="Hair & Hats"
                        />
                        <TabButton
                            active={activeTab === "face"}
                            onClick={() => setActiveTab("face")}
                            icon={Smile}
                            label="Expression"
                        />
                        <TabButton
                            active={activeTab === "base"}
                            onClick={() => setActiveTab("base")}
                            icon={Sliders}
                            label="Skin Tone"
                        />
                        <TabButton
                            active={activeTab === "clothing"}
                            onClick={() => setActiveTab("clothing")}
                            icon={Shirt}
                            label="Outfits"
                        />
                        <TabButton
                            active={activeTab === "details"}
                            onClick={() => setActiveTab("details")}
                            icon={Glasses}
                            label="Accessories"
                        />
                    </div>

                    {/* Tab 1: Hair & Headwear */}
                    {activeTab === "hair" && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Hair Color Palette with Custom Color Picker */}
                            <ColorPickerSection
                                title="Hair Color"
                                currentColor={currentConfig.hairColor}
                                presets={HAIR_COLOR_OPTIONS}
                                onSelectColor={(hex) => updateConfig("hairColor", hex)}
                                defaultColor="2c1b18"
                            />

                            {/* Hat Color (conditional when headwear selected) */}
                            {hasHeadwear && (
                                <ColorPickerSection
                                    title="Headwear / Hat Color"
                                    currentColor={currentConfig.hatColor ?? "262e33"}
                                    presets={HAT_COLOR_OPTIONS}
                                    onSelectColor={(hex) => updateConfig("hatColor", hex)}
                                    defaultColor="262e33"
                                />
                            )}

                            {/* Hairstyle Groups with Visual Thumbnails */}
                            {TOP_OPTIONS.map((group) => (
                                <div key={group.category} className="space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                            {group.category}
                                        </h4>
                                        <span className="text-[10px] text-starlight-500 font-mono">
                                            {group.options.length} styles
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                        {group.options.map((option) => (
                                            <ThumbnailChoiceCard
                                                key={option.value}
                                                label={option.label}
                                                thumbnailUri={getTopThumbnail(
                                                    option.value,
                                                    currentConfig.hairColor
                                                )}
                                                selected={currentConfig.top === option.value}
                                                onClick={() => updateConfig("top", option.value)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab 2: Face & Expression */}
                    {activeTab === "face" && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Eye Styles with Visual Thumbnails */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                        <Eye className="size-3.5 text-gold-400" />
                                        Eye Expression
                                    </h4>
                                    <span className="text-[10px] text-starlight-500 font-mono">
                                        {EYES_OPTIONS.length} shapes
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                    {EYES_OPTIONS.map((option) => (
                                        <ThumbnailChoiceCard
                                            key={option.value}
                                            label={option.label}
                                            thumbnailUri={getEyesThumbnail(option.value)}
                                            selected={currentConfig.eyes === option.value}
                                            onClick={() => updateConfig("eyes", option.value)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Eyebrows with Visual Thumbnails */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                        Eyebrow Attitude
                                    </h4>
                                    <span className="text-[10px] text-starlight-500 font-mono">
                                        {EYEBROWS_OPTIONS.length} styles
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                    {EYEBROWS_OPTIONS.map((option) => (
                                        <ThumbnailChoiceCard
                                            key={option.value}
                                            label={option.label}
                                            thumbnailUri={getEyebrowsThumbnail(option.value)}
                                            selected={currentConfig.eyebrows === option.value}
                                            onClick={() => updateConfig("eyebrows", option.value)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Mouth Expressions with Visual Thumbnails */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                        <Smile className="size-3.5 text-gold-400" />
                                        Mouth Expression
                                    </h4>
                                    <span className="text-[10px] text-starlight-500 font-mono">
                                        {MOUTH_OPTIONS.length} expressions
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                    {MOUTH_OPTIONS.map((option) => (
                                        <ThumbnailChoiceCard
                                            key={option.value}
                                            label={option.label}
                                            thumbnailUri={getMouthThumbnail(option.value)}
                                            selected={currentConfig.mouth === option.value}
                                            onClick={() => updateConfig("mouth", option.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Skin Tone */}
                    {activeTab === "base" && (
                        <div className="space-y-6 animate-fade-in">
                            <ColorPickerSection
                                title="Skin Tone"
                                currentColor={currentConfig.skinColor}
                                presets={SKIN_COLOR_OPTIONS}
                                onSelectColor={(hex) => updateConfig("skinColor", hex)}
                                defaultColor="edb98a"
                            />

                            {/* Detailed Swatch Cards */}
                            <div className="rounded-xl border border-border/60 bg-space-950/40 p-4">
                                <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-gold-400">
                                    Preset Skin Tones
                                </label>
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                                    {SKIN_COLOR_OPTIONS.map((color) => {
                                        const isSelected =
                                            currentConfig.skinColor.toLowerCase() ===
                                            color.value.toLowerCase();
                                        return (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => updateConfig("skinColor", color.value)}
                                                className={cn(
                                                    "flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all",
                                                    isSelected
                                                        ? "border-gold-400 bg-gold-500/15 shadow-gold ring-1 ring-gold-400 font-semibold"
                                                        : "border-border/60 bg-space-850/60 hover:border-gold-500/30 hover:bg-space-850"
                                                )}
                                            >
                                                <span
                                                    className="size-7 shrink-0 rounded-full border border-black/20 shadow-xs"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                <div className="min-w-0">
                                                    <span className="block truncate text-xs font-medium text-starlight-100">
                                                        {color.label}
                                                    </span>
                                                    <span className="block text-[10px] text-starlight-400 font-mono">
                                                        {color.hex}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Clothing & Outfits */}
                    {activeTab === "clothing" && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Clothes Color with Custom Picker */}
                            <ColorPickerSection
                                title="Clothing Hue"
                                currentColor={currentConfig.clothesColor}
                                presets={CLOTHES_COLOR_OPTIONS}
                                onSelectColor={(hex) => updateConfig("clothesColor", hex)}
                                defaultColor="262e33"
                            />

                            {/* Clothing Styles with Visual Thumbnails */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                        Outfit & Style
                                    </h4>
                                    <span className="text-[10px] text-starlight-500 font-mono">
                                        {CLOTHING_OPTIONS.length} styles
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {CLOTHING_OPTIONS.map((option) => (
                                        <ThumbnailChoiceCard
                                            key={option.value}
                                            label={option.label}
                                            thumbnailUri={getClothingThumbnail(
                                                option.value,
                                                currentConfig.clothesColor
                                            )}
                                            selected={currentConfig.clothing === option.value}
                                            onClick={() => updateConfig("clothing", option.value)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Graphic Shirt Badges (conditional when graphicShirt is selected) */}
                            {isGraphicShirt && (
                                <div className="space-y-2.5 rounded-xl border border-gold-500/30 bg-space-950/50 p-4">
                                    <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-400">
                                            <Tag className="size-3.5" />
                                            T-Shirt Graphic Badge
                                        </h4>
                                        <span className="text-[10px] text-starlight-500 font-mono">
                                            {CLOTHING_GRAPHIC_OPTIONS.length} badges
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                        {CLOTHING_GRAPHIC_OPTIONS.map((option) => (
                                            <ThumbnailChoiceCard
                                                key={option.value}
                                                label={option.label}
                                                thumbnailUri={getGraphicThumbnail(option.value)}
                                                selected={
                                                    (currentConfig.clothingGraphic ?? "none") ===
                                                    option.value
                                                }
                                                onClick={() =>
                                                    updateConfig("clothingGraphic", option.value)
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 5: Accessories & Details */}
                    {activeTab === "details" && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Glasses / Eyewear */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                        <Glasses className="size-3.5 text-gold-400" />
                                        Eyewear & Accessories
                                    </h4>
                                    {currentConfig.accessories !== "none" && (
                                        <button
                                            type="button"
                                            onClick={() => updateConfig("accessories", "none")}
                                            className="text-[11px] text-starlight-400 hover:text-gold-300 transition-colors"
                                        >
                                            Remove Eyewear
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {ACCESSORY_OPTIONS.map((option) => (
                                        <ThumbnailChoiceCard
                                            key={option.value}
                                            label={option.label}
                                            thumbnailUri={getAccessoryThumbnail(
                                                option.value,
                                                currentConfig.accessoriesColor
                                            )}
                                            selected={currentConfig.accessories === option.value}
                                            onClick={() => updateConfig("accessories", option.value)}
                                        />
                                    ))}
                                </div>

                                {currentConfig.accessories !== "none" && (
                                    <ColorPickerSection
                                        title="Frame Color"
                                        currentColor={currentConfig.accessoriesColor}
                                        presets={ACCESSORIES_COLOR_OPTIONS}
                                        onSelectColor={(hex) =>
                                            updateConfig("accessoriesColor", hex)
                                        }
                                        defaultColor="262e33"
                                        className="mt-3"
                                    />
                                )}
                            </div>

                            {/* Facial Hair */}
                            <div className="space-y-3 pt-4 border-t border-border/60">
                                <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-starlight-400">
                                        <UserCheck className="size-3.5 text-gold-400" />
                                        Facial Hair & Grooming
                                    </h4>
                                    {currentConfig.facialHair !== "none" && (
                                        <button
                                            type="button"
                                            onClick={() => updateConfig("facialHair", "none")}
                                            className="text-[11px] text-starlight-400 hover:text-gold-300 transition-colors"
                                        >
                                            Clean Shaven
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {FACIAL_HAIR_OPTIONS.map((option) => (
                                        <ThumbnailChoiceCard
                                            key={option.value}
                                            label={option.label}
                                            thumbnailUri={getFacialHairThumbnail(
                                                option.value,
                                                currentConfig.facialHairColor
                                            )}
                                            selected={currentConfig.facialHair === option.value}
                                            onClick={() => updateConfig("facialHair", option.value)}
                                        />
                                    ))}
                                </div>

                                {currentConfig.facialHair !== "none" && (
                                    <ColorPickerSection
                                        title="Facial Hair Color"
                                        currentColor={currentConfig.facialHairColor}
                                        presets={HAIR_COLOR_OPTIONS}
                                        onSelectColor={(hex) =>
                                            updateConfig("facialHairColor", hex)
                                        }
                                        defaultColor="2c1b18"
                                        className="mt-3"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile Bottom Save Bar / Revert */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-border/60 lg:hidden">
                        {statusMessage.type === "success" && (
                            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-2 text-xs font-semibold text-emerald-300">
                                <Check className="size-4 shrink-0" />
                                <span>{statusMessage.text}</span>
                            </div>
                        )}
                        {statusMessage.type === "error" && (
                            <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-2 text-xs font-medium text-rose-300">
                                {statusMessage.text}
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || !isDirty}
                                className={cn(
                                    "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-gold transition-all",
                                    isDirty
                                        ? "bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-space-950 active:scale-95"
                                        : "bg-space-850 text-starlight-400 border border-border/70 cursor-not-allowed"
                                )}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-3.5" />
                                        <span>{isDirty ? "Save Avatar" : "Saved"}</span>
                                    </>
                                )}
                            </button>

                            {isDirty && (
                                <button
                                    type="button"
                                    onClick={handleRevert}
                                    className="rounded-xl border border-border/70 bg-space-850 px-3 py-2.5 text-xs font-medium text-starlight-300 hover:bg-space-800"
                                >
                                    <RotateCcw className="size-3.5" />
                                </button>
                            )}

                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="rounded-xl border border-border/70 bg-space-850 px-3 py-2.5 text-xs font-medium text-starlight-300 hover:bg-space-800"
                                >
                                    Close
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleResetDefault}
                            className="text-center text-[11px] text-starlight-400 hover:text-gold-300 transition-colors pt-1"
                        >
                            Reset to Default Cadet Look
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Subcomponents for AvatarEditor

function TabButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                active
                    ? "bg-gold-500/15 text-gold-300 border border-gold-500/35 shadow-gold font-semibold"
                    : "text-starlight-400 hover:bg-space-850 hover:text-starlight-200 border border-transparent"
            )}
        >
            <Icon className={cn("size-3.5", active ? "text-gold-400" : "text-starlight-400")} />
            <span>{label}</span>
        </button>
    );
}

interface ThumbnailChoiceCardProps {
    label: string;
    thumbnailUri: string;
    selected: boolean;
    onClick: () => void;
}

function ThumbnailChoiceCard({
    label,
    thumbnailUri,
    selected,
    onClick,
}: ThumbnailChoiceCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={cn(
                "group relative flex flex-col items-center justify-between rounded-xl border p-2 text-center transition-all duration-150 select-none",
                selected
                    ? "border-gold-400 bg-gold-500/15 text-gold-200 shadow-gold ring-2 ring-gold-400/50 font-semibold"
                    : "border-border/60 bg-space-850/60 text-starlight-300 hover:border-gold-500/30 hover:bg-space-850 hover:text-starlight-100"
            )}
        >
            <div className="relative mb-1.5 flex size-14 sm:size-16 items-center justify-center overflow-hidden rounded-lg bg-space-900/80 p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={thumbnailUri}
                    alt={label}
                    loading="lazy"
                    className="size-full select-none object-cover"
                />
                {selected && (
                    <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-gold-400 text-space-950 shadow-xs">
                        <Check className="size-2.5 stroke-[3]" />
                    </span>
                )}
            </div>
            <span className="w-full truncate text-[11px] leading-tight font-medium">
                {label}
            </span>
        </button>
    );
}

interface ColorPickerSectionProps<T extends string = string> {
    title: string;
    currentColor: string;
    presets: readonly ColorOption<T>[];
    onSelectColor: (hexWithoutHash: string) => void;
    defaultColor?: string;
    className?: string;
}

function ColorPickerSection<T extends string = string>({
    title,
    currentColor,
    presets,
    onSelectColor,
    defaultColor,
    className,
}: ColorPickerSectionProps<T>) {
    const isPreset = presets.some(
        (p) => p.value.toLowerCase() === currentColor.toLowerCase()
    );

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const clean = normalizeHexColor(e.target.value);
        if (clean) {
            onSelectColor(clean);
        }
    };

    return (
        <div className={cn("rounded-xl border border-border/60 bg-space-950/40 p-4", className)}>
            <div className="mb-2.5 flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-gold-400">
                    {title}
                </label>
                {!isPreset && defaultColor && (
                    <button
                        type="button"
                        onClick={() => onSelectColor(defaultColor)}
                        className="text-[10px] text-starlight-400 hover:text-gold-300 transition-colors underline-offset-2 hover:underline"
                    >
                        Reset to default preset
                    </button>
                )}
            </div>

            {/* Presets and Custom Color Picker */}
            <div className="flex flex-wrap items-center gap-2.5">
                {presets.map((color) => (
                    <ColorSwatch
                        key={color.value}
                        color={color}
                        selected={currentColor.toLowerCase() === color.value.toLowerCase()}
                        onClick={() => onSelectColor(color.value)}
                    />
                ))}

                {/* Custom Color Trigger */}
                <div className="relative group">
                    <div
                        className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all duration-150 cursor-pointer",
                            !isPreset
                                ? "border-gold-400 bg-gold-500/15 text-gold-300 ring-2 ring-gold-400/50 shadow-gold font-semibold"
                                : "border-border/60 bg-space-850/80 text-starlight-300 hover:border-gold-500/40 hover:text-starlight-100"
                        )}
                        title="Pick custom hex color"
                    >
                        <span
                            className="size-4 rounded-full border border-black/30 shrink-0 shadow-xs"
                            style={{ backgroundColor: `#${currentColor}` }}
                        />
                        <Palette className="size-3 text-gold-400" />
                        <span className="font-mono text-[11px]">
                            #{currentColor.toUpperCase()}
                        </span>
                        <input
                            type="color"
                            value={`#${currentColor}`}
                            onChange={handleCustomChange}
                            className="absolute inset-0 size-full cursor-pointer opacity-0"
                            aria-label={`Custom ${title} picker`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ColorSwatch<T extends string>({
    color,
    selected,
    onClick,
}: {
    color: { value: T; label: string; hex: string };
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={color.label}
            className={cn(
                "group relative size-8 shrink-0 rounded-full border border-black/30 transition-transform duration-150 focus:outline-hidden",
                selected
                    ? "scale-115 ring-2 ring-gold-400 ring-offset-2 ring-offset-space-950 shadow-gold"
                    : "hover:scale-105"
            )}
            style={{ backgroundColor: color.hex }}
        >
            {selected && (
                <Check className="mx-auto size-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            )}
            <span className="sr-only">{color.label}</span>
        </button>
    );
}
