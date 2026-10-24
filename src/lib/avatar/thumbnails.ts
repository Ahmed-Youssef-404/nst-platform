// src/lib/avatar/thumbnails.ts
// Efficient, memoized visual thumbnail generators for Avatar customization options.
// Each generator applies focused viewBox cropping so options emphasize the specific
// feature (hair, eyes, eyebrows, mouth, clothing, accessories, facial hair) rather
// than displaying identical full-character miniatures.

import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import type {
    Top,
    Eyes,
    Eyebrows,
    Mouth,
    Clothing,
    ClothingGraphic,
    Accessory,
    FacialHair,
} from "@/types/avatar";

const topCache = new Map<string, string>();
const eyesCache = new Map<string, string>();
const eyebrowsCache = new Map<string, string>();
const mouthCache = new Map<string, string>();
const clothingCache = new Map<string, string>();
const graphicCache = new Map<string, string>();
const accessoryCache = new Map<string, string>();
const facialHairCache = new Map<string, string>();

/**
 * Converts a generated avatar SVG to a focused Data URI by replacing
 * the default 280x280 viewBox with a feature-targeted crop rectangle.
 */
function toCroppedDataUri(avatar: ReturnType<typeof createAvatar>, viewBox: string): string {
    const rawSvg = avatar.toString();
    const croppedSvg = rawSvg.replace(/viewBox="[^"]+"/, `viewBox="${viewBox}"`);
    return `data:image/svg+xml;utf8,${encodeURIComponent(croppedSvg)}`;
}

/**
 * Visual thumbnail for hairstyle / headwear.
 * Focuses on the head and hair region (viewBox: 15 0 250 200).
 */
export function getTopThumbnail(top: Top, hairColor = "4a312c"): string {
    const key = `${top}-${hairColor}`;
    const cached = topCache.get(key);
    if (cached) return cached;

    const isBald = top === "none";
    const avatar = createAvatar(avataaars, {
        top: isBald ? undefined : [top as Exclude<Top, "none">],
        topProbability: isBald ? 0 : 100,
        hairColor: [hairColor],
        hatColor: ["262e33"],
        skinColor: ["edb98a"],
        clothing: ["shirtCrewNeck"],
        clothesColor: ["262e33"],
        eyes: ["default"],
        eyebrows: ["defaultNatural"],
        mouth: ["default"],
        accessoriesProbability: 0,
        facialHairProbability: 0,
    });

    const uri = toCroppedDataUri(avatar, "15 0 250 200");
    topCache.set(key, uri);
    return uri;
}

/**
 * Visual thumbnail for eye styles.
 * Zooms directly onto the eye expression (viewBox: 45 80 190 75).
 */
export function getEyesThumbnail(eyes: Eyes): string {
    const cached = eyesCache.get(eyes);
    if (cached) return cached;

    const avatar = createAvatar(avataaars, {
        top: ["shortRound"],
        hairColor: ["2c1b18"],
        skinColor: ["edb98a"],
        clothing: ["shirtCrewNeck"],
        clothesColor: ["262e33"],
        eyes: [eyes],
        eyebrows: ["defaultNatural"],
        mouth: ["default"],
        accessoriesProbability: 0,
        facialHairProbability: 0,
    });

    const uri = toCroppedDataUri(avatar, "45 80 190 75");
    eyesCache.set(eyes, uri);
    return uri;
}

/**
 * Visual thumbnail for eyebrow styles.
 * Zooms directly onto the eyebrow attitude (viewBox: 45 65 190 65).
 */
export function getEyebrowsThumbnail(eyebrows: Eyebrows): string {
    const cached = eyebrowsCache.get(eyebrows);
    if (cached) return cached;

    const avatar = createAvatar(avataaars, {
        top: ["shortRound"],
        hairColor: ["2c1b18"],
        skinColor: ["edb98a"],
        clothing: ["shirtCrewNeck"],
        clothesColor: ["262e33"],
        eyes: ["default"],
        eyebrows: [eyebrows],
        mouth: ["default"],
        accessoriesProbability: 0,
        facialHairProbability: 0,
    });

    const uri = toCroppedDataUri(avatar, "45 65 190 65");
    eyebrowsCache.set(eyebrows, uri);
    return uri;
}

/**
 * Visual thumbnail for mouth expressions.
 * Zooms directly onto the mouth shape and expression (viewBox: 65 140 150 75).
 */
export function getMouthThumbnail(mouth: Mouth): string {
    const cached = mouthCache.get(mouth);
    if (cached) return cached;

    const avatar = createAvatar(avataaars, {
        top: ["shortRound"],
        hairColor: ["2c1b18"],
        skinColor: ["edb98a"],
        clothing: ["shirtCrewNeck"],
        clothesColor: ["262e33"],
        eyes: ["default"],
        eyebrows: ["defaultNatural"],
        mouth: [mouth],
        accessoriesProbability: 0,
        facialHairProbability: 0,
    });

    const uri = toCroppedDataUri(avatar, "65 140 150 75");
    mouthCache.set(mouth, uri);
    return uri;
}

/**
 * Visual thumbnail for clothing styles.
 * Focuses directly on the collar, neckline, and torso (viewBox: 30 165 220 115).
 */
export function getClothingThumbnail(clothing: Clothing, clothesColor = "262e33"): string {
    const key = `${clothing}-${clothesColor}`;
    const cached = clothingCache.get(key);
    if (cached) return cached;

    const avatar = createAvatar(avataaars, {
        top: ["shortRound"],
        hairColor: ["2c1b18"],
        skinColor: ["edb98a"],
        clothing: [clothing],
        clothesColor: [clothesColor],
        clothingGraphic: clothing === "graphicShirt" ? ["diamond"] : undefined,
        eyes: ["default"],
        eyebrows: ["defaultNatural"],
        mouth: ["default"],
        accessoriesProbability: 0,
        facialHairProbability: 0,
    });

    const uri = toCroppedDataUri(avatar, "30 165 220 115");
    clothingCache.set(key, uri);
    return uri;
}

/**
 * Visual thumbnail for graphic shirt badges.
 * Zooms directly onto the chest badge graphic (viewBox: 60 180 160 95).
 */
export function getGraphicThumbnail(graphic: ClothingGraphic): string {
    const cached = graphicCache.get(graphic);
    if (cached) return cached;

    const hasGraphic = graphic !== "none";
    const avatar = createAvatar(avataaars, {
        top: ["shortRound"],
        hairColor: ["2c1b18"],
        skinColor: ["edb98a"],
        clothing: ["graphicShirt"],
        clothesColor: ["262e33"],
        clothingGraphic: hasGraphic ? [graphic as Exclude<ClothingGraphic, "none">] : undefined,
        eyes: ["default"],
        eyebrows: ["defaultNatural"],
        mouth: ["default"],
        accessoriesProbability: 0,
        facialHairProbability: 0,
    });

    const uri = toCroppedDataUri(avatar, "60 180 160 95");
    graphicCache.set(graphic, uri);
    return uri;
}

/**
 * Visual thumbnail for glasses and eyewear.
 * Zooms onto the face glasses and bridge area (viewBox: 40 75 200 85).
 */
export function getAccessoryThumbnail(accessory: Accessory, accessoriesColor = "262e33"): string {
    const key = `${accessory}-${accessoriesColor}`;
    const cached = accessoryCache.get(key);
    if (cached) return cached;

    const isNone = accessory === "none";
    const avatar = createAvatar(avataaars, {
        top: ["shortRound"],
        hairColor: ["2c1b18"],
        skinColor: ["edb98a"],
        clothing: ["shirtCrewNeck"],
        clothesColor: ["262e33"],
        eyes: ["default"],
        eyebrows: ["defaultNatural"],
        mouth: ["default"],
        accessories: isNone ? undefined : [accessory as Exclude<Accessory, "none">],
        accessoriesProbability: isNone ? 0 : 100,
        accessoriesColor: [accessoriesColor],
        facialHairProbability: 0,
    });

    const uri = toCroppedDataUri(avatar, "40 75 200 85");
    accessoryCache.set(key, uri);
    return uri;
}

/**
 * Visual thumbnail for facial hair styles.
 * Zooms onto the jaw, chin, and upper lip (viewBox: 50 135 180 105).
 */
export function getFacialHairThumbnail(facialHair: FacialHair, facialHairColor = "2c1b18"): string {
    const key = `${facialHair}-${facialHairColor}`;
    const cached = facialHairCache.get(key);
    if (cached) return cached;

    const isNone = facialHair === "none";
    const avatar = createAvatar(avataaars, {
        top: ["shortRound"],
        hairColor: ["2c1b18"],
        skinColor: ["edb98a"],
        clothing: ["shirtCrewNeck"],
        clothesColor: ["262e33"],
        eyes: ["default"],
        eyebrows: ["defaultNatural"],
        mouth: ["default"],
        accessoriesProbability: 0,
        facialHair: isNone ? undefined : [facialHair as Exclude<FacialHair, "none">],
        facialHairProbability: isNone ? 0 : 100,
        facialHairColor: [facialHairColor],
    });

    const uri = toCroppedDataUri(avatar, "50 135 180 105");
    facialHairCache.set(key, uri);
    return uri;
}
