// src/lib/avatar/thumbnails.ts
// Efficient, memoized visual thumbnail generators for Avatar customization options.

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
 * Visual thumbnail for hairstyle / headwear.
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
        size: 72,
    });

    const uri = avatar.toDataUri();
    topCache.set(key, uri);
    return uri;
}

/**
 * Visual thumbnail for eye styles.
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
        size: 72,
    });

    const uri = avatar.toDataUri();
    eyesCache.set(eyes, uri);
    return uri;
}

/**
 * Visual thumbnail for eyebrow styles.
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
        size: 72,
    });

    const uri = avatar.toDataUri();
    eyebrowsCache.set(eyebrows, uri);
    return uri;
}

/**
 * Visual thumbnail for mouth expressions.
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
        size: 72,
    });

    const uri = avatar.toDataUri();
    mouthCache.set(mouth, uri);
    return uri;
}

/**
 * Visual thumbnail for clothing styles.
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
        size: 72,
    });

    const uri = avatar.toDataUri();
    clothingCache.set(key, uri);
    return uri;
}

/**
 * Visual thumbnail for graphic shirt badges.
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
        size: 72,
    });

    const uri = avatar.toDataUri();
    graphicCache.set(graphic, uri);
    return uri;
}

/**
 * Visual thumbnail for glasses and eyewear.
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
        size: 72,
    });

    const uri = avatar.toDataUri();
    accessoryCache.set(key, uri);
    return uri;
}

/**
 * Visual thumbnail for facial hair styles.
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
        size: 72,
    });

    const uri = avatar.toDataUri();
    facialHairCache.set(key, uri);
    return uri;
}
