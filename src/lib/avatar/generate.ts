// src/lib/avatar/generate.ts
// Local, deterministic SVG and Data URI generator using DiceBear Avataaars.
// Provides in-memory memoization/caching to avoid repetitive SVG generation.

import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import {
    type StudentAvatarConfig,
    type Top,
    type ClothingGraphic,
    DEFAULT_AVATAR_CONFIG,
    validateAvatarConfig,
} from "@/types/avatar";

// In-memory cache for generated Data URIs (bounded to prevent memory growth)
const MAX_CACHE_SIZE = 500;
const dataUriCache = new Map<string, string>();
const svgStringCache = new Map<string, string>();

function getCacheKey(config: StudentAvatarConfig): string {
    return JSON.stringify(config);
}

function addToCache(cache: Map<string, string>, key: string, value: string) {
    if (cache.size >= MAX_CACHE_SIZE) {
        // Evict oldest entry
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, value);
}

/**
 * Resolves a safe avatar configuration:
 * - If valid, returns the config
 * - If null, undefined, or invalid, falls back safely to DEFAULT_AVATAR_CONFIG
 */
export function resolveAvatarConfig(
    config: unknown
): StudentAvatarConfig {
    if (!config) return DEFAULT_AVATAR_CONFIG;
    const validated = validateAvatarConfig(config);
    return validated.valid ? validated.config : DEFAULT_AVATAR_CONFIG;
}

function buildDicebearOptions(config: StudentAvatarConfig) {
    const isBald = config.top === "none";
    const isGraphicShirt = config.clothing === "graphicShirt";
    const hasGraphic = isGraphicShirt && config.clothingGraphic && config.clothingGraphic !== "none";

    return {
        skinColor: [config.skinColor],
        hairColor: [config.hairColor],
        top: isBald ? undefined : [config.top as Exclude<Top, "none">],
        topProbability: isBald ? 0 : 100,
        hatColor: config.hatColor ? [config.hatColor] : undefined,
        clothing: [config.clothing],
        clothesColor: [config.clothesColor],
        clothingGraphic: hasGraphic ? [config.clothingGraphic as Exclude<ClothingGraphic, "none">] : undefined,
        eyes: [config.eyes],
        eyebrows: [config.eyebrows],
        mouth: [config.mouth],
        accessories: config.accessories === "none" ? [] : [config.accessories],
        accessoriesProbability: config.accessories === "none" ? 0 : 100,
        accessoriesColor: [config.accessoriesColor],
        facialHair: config.facialHair === "none" ? [] : [config.facialHair],
        facialHairProbability: config.facialHair === "none" ? 0 : 100,
        facialHairColor: [config.facialHairColor],
        style: ["default"] as ("circle" | "default")[],
    };
}

/**
 * Generates raw SVG markup for a given avatar config.
 * Deterministic and local.
 */
export function generateAvatarSvg(config: unknown): string {
    const safeConfig = resolveAvatarConfig(config);
    const key = getCacheKey(safeConfig);

    const cached = svgStringCache.get(key);
    if (cached) return cached;

    try {
        const options = buildDicebearOptions(safeConfig);
        const avatar = createAvatar(avataaars, options);
        const svg = avatar.toString();
        addToCache(svgStringCache, key, svg);
        return svg;
    } catch {
        // Safe fallback in case of unexpected generation error
        const fallbackOptions = buildDicebearOptions(DEFAULT_AVATAR_CONFIG);
        return createAvatar(avataaars, fallbackOptions).toString();
    }
}

/**
 * Generates a data URI (data:image/svg+xml;utf8,...) for a given avatar config.
 * Safe for direct use as img src.
 */
export function generateAvatarDataUri(config: unknown): string {
    const safeConfig = resolveAvatarConfig(config);
    const key = getCacheKey(safeConfig);

    const cached = dataUriCache.get(key);
    if (cached) return cached;

    try {
        const options = buildDicebearOptions(safeConfig);
        const avatar = createAvatar(avataaars, options);
        const dataUri = avatar.toDataUri();
        addToCache(dataUriCache, key, dataUri);
        return dataUri;
    } catch {
        // Safe fallback in case of unexpected generation error
        const fallbackOptions = buildDicebearOptions(DEFAULT_AVATAR_CONFIG);
        return createAvatar(avataaars, fallbackOptions).toDataUri();
    }
}
