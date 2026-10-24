// src/types/avatar.ts
// Strict types and allowlists for the Student Avatar System (DiceBear Avataaars).
// All allowed options and values match the verified @dicebear/avataaars schema.

export const ALLOWED_SKIN_COLORS = [
    "ffdbb4",
    "edb98a",
    "f8d25c",
    "fd9841",
    "d08b5b",
    "ae5d29",
    "614335",
] as const;
export type SkinColor = (typeof ALLOWED_SKIN_COLORS)[number];

export const ALLOWED_HAIR_COLORS = [
    "2c1b18",
    "4a312c",
    "724133",
    "a55728",
    "b58143",
    "d6b370",
    "ecdcbf",
    "c93305",
    "f59797",
    "e8e1e1",
] as const;
export type HairColor = (typeof ALLOWED_HAIR_COLORS)[number];

export const ALLOWED_TOPS = [
    // Bald / Minimal
    "none",
    // Clean & Short
    "shortRound",
    "shortFlat",
    "shortCurly",
    "shortWaved",
    "theCaesar",
    "theCaesarAndSidePart",
    "sides",
    "shavedSides",
    "shaggy",
    "shaggyMullet",
    // Medium, Long & Textured
    "bob",
    "bun",
    "curly",
    "curvy",
    "dreads",
    "dreads01",
    "dreads02",
    "fro",
    "froBand",
    "frizzle",
    "longButNotTooLong",
    "miaWallace",
    "straight01",
    "straight02",
    "straightAndStrand",
    "bigHair",
    "frida",
    // Headwear & Wraps
    "hat",
    "hijab",
    "turban",
    "winterHat1",
    "winterHat02",
    "winterHat03",
    "winterHat04",
] as const;
export type Top = (typeof ALLOWED_TOPS)[number];

export const ALLOWED_CLOTHING = [
    "hoodie",
    "graphicShirt",
    "shirtCrewNeck",
    "shirtScoopNeck",
    "shirtVNeck",
    "collarAndSweater",
    "blazerAndShirt",
    "blazerAndSweater",
    "overall",
] as const;
export type Clothing = (typeof ALLOWED_CLOTHING)[number];

export const ALLOWED_CLOTHING_GRAPHICS = [
    "none",
    "bat",
    "bear",
    "cumbia",
    "deer",
    "diamond",
    "hola",
    "pizza",
    "resist",
    "skull",
    "skullOutline",
] as const;
export type ClothingGraphic = (typeof ALLOWED_CLOTHING_GRAPHICS)[number];

export const ALLOWED_CLOTHES_COLORS = [
    "262e33",
    "65c9ff",
    "5199e4",
    "25557c",
    "e6e6e6",
    "929598",
    "3c4f5c",
    "b1e2ff",
    "a7ffc4",
    "ffafb9",
    "ffffb1",
    "ff488e",
    "ff5c5c",
    "ffffff",
] as const;
export type ClothesColor = (typeof ALLOWED_CLOTHES_COLORS)[number];

export const ALLOWED_EYES = [
    "default",
    "happy",
    "surprised",
    "squint",
    "wink",
    "side",
    "closed",
    "eyeRoll",
    "winkWacky",
    "hearts",
    "cry",
    "xDizzy",
] as const;
export type Eyes = (typeof ALLOWED_EYES)[number];

export const ALLOWED_EYEBROWS = [
    "default",
    "defaultNatural",
    "flatNatural",
    "upDownNatural",
    "raisedExcitedNatural",
    "frownNatural",
    "angryNatural",
    "sadConcernedNatural",
    "unibrowNatural",
    "angry",
    "raisedExcited",
    "sadConcerned",
    "upDown",
] as const;
export type Eyebrows = (typeof ALLOWED_EYEBROWS)[number];

export const ALLOWED_MOUTH = [
    "default",
    "smile",
    "twinkle",
    "serious",
    "tongue",
    "concerned",
    "disbelief",
    "eating",
    "grimace",
    "sad",
    "screamOpen",
    "vomit",
] as const;
export type Mouth = (typeof ALLOWED_MOUTH)[number];

export const ALLOWED_ACCESSORIES = [
    "none",
    "prescription01",
    "prescription02",
    "round",
    "sunglasses",
    "wayfarers",
    "kurt",
    "eyepatch",
] as const;
export type Accessory = (typeof ALLOWED_ACCESSORIES)[number];

export const ALLOWED_ACCESSORIES_COLORS = [
    "262e33",
    "65c9ff",
    "5199e4",
    "25557c",
    "e6e6e6",
    "929598",
    "3c4f5c",
    "b1e2ff",
    "a7ffc4",
    "ffdeb5",
    "ffafb9",
    "ffffb1",
    "ff488e",
    "ff5c5c",
    "ffffff",
] as const;
export type AccessoriesColor = (typeof ALLOWED_ACCESSORIES_COLORS)[number];

export const ALLOWED_FACIAL_HAIR = [
    "none",
    "beardLight",
    "beardMedium",
    "beardMajestic",
    "moustacheFancy",
    "moustacheMagnum",
] as const;
export type FacialHair = (typeof ALLOWED_FACIAL_HAIR)[number];

export interface StudentAvatarConfig {
    skinColor: string;
    hairColor: string;
    top: Top;
    hatColor?: string;
    clothing: Clothing;
    clothesColor: string;
    clothingGraphic?: ClothingGraphic;
    eyes: Eyes;
    eyebrows: Eyebrows;
    mouth: Mouth;
    accessories: Accessory;
    accessoriesColor: string;
    facialHair: FacialHair;
    facialHairColor: string;
}

// Clean, gender-neutral default cadet avatar
export const DEFAULT_AVATAR_CONFIG: StudentAvatarConfig = {
    skinColor: "edb98a",
    hairColor: "b58143",
    top: "none",
    hatColor: "262e33",
    clothing: "shirtScoopNeck",
    clothesColor: "262e33",
    clothingGraphic: "none",
    eyes: "default",
    eyebrows: "default",
    mouth: "default",
    accessories: "none",
    accessoriesColor: "262e33",
    facialHair: "none",
    facialHairColor: "b58143",
};

export function isValidValue<T extends string>(value: unknown, allowedList: readonly T[]): value is T {
    return typeof value === "string" && allowedList.includes(value as T);
}

/**
 * Normalizes a hex color string:
 * - Strips leading '#'
 * - Converts to lower-case
 * - Validates 6-character hex format
 * Returns normalized string or null if invalid.
 */
export function normalizeHexColor(input: unknown): string | null {
    if (typeof input !== "string") return null;
    const clean = input.trim().replace(/^#/, "").toLowerCase();
    return /^[0-9a-f]{6}$/.test(clean) ? clean : null;
}

export function isValidColor(value: unknown, allowedPresets: readonly string[]): boolean {
    if (typeof value !== "string") return false;
    const normalized = normalizeHexColor(value);
    if (!normalized) return false;
    return allowedPresets.includes(normalized) || /^[0-9a-f]{6}$/.test(normalized);
}

export function validateAvatarConfig(input: unknown): {
    valid: true;
    config: StudentAvatarConfig;
} | {
    valid: false;
    error: string;
} {
    if (!input || typeof input !== "object") {
        return { valid: false, error: "Avatar configuration must be an object." };
    }

    const obj = input as Record<string, unknown>;

    // Validate skinColor (preset or valid 6-character hex)
    const normalizedSkin = normalizeHexColor(obj.skinColor);
    if (!normalizedSkin) {
        return { valid: false, error: "Invalid skin color." };
    }

    // Validate hairColor (preset or valid 6-character hex)
    const normalizedHair = normalizeHexColor(obj.hairColor);
    if (!normalizedHair) {
        return { valid: false, error: "Invalid hair color." };
    }

    // Validate top
    if (!isValidValue(obj.top, ALLOWED_TOPS)) {
        return { valid: false, error: "Invalid hairstyle." };
    }

    // Validate clothing
    if (!isValidValue(obj.clothing, ALLOWED_CLOTHING)) {
        return { valid: false, error: "Invalid clothing style." };
    }

    // Validate clothesColor (preset or valid 6-character hex)
    const normalizedClothesColor = normalizeHexColor(obj.clothesColor);
    if (!normalizedClothesColor) {
        return { valid: false, error: "Invalid clothing color." };
    }

    // Validate eyes
    if (!isValidValue(obj.eyes, ALLOWED_EYES)) {
        return { valid: false, error: "Invalid eye shape." };
    }

    // Validate eyebrows
    if (!isValidValue(obj.eyebrows, ALLOWED_EYEBROWS)) {
        return { valid: false, error: "Invalid eyebrow shape." };
    }

    // Validate mouth
    if (!isValidValue(obj.mouth, ALLOWED_MOUTH)) {
        return { valid: false, error: "Invalid mouth expression." };
    }

    // Validate accessories
    if (!isValidValue(obj.accessories, ALLOWED_ACCESSORIES)) {
        return { valid: false, error: "Invalid accessories option." };
    }

    // Validate accessoriesColor (preset or valid 6-character hex)
    const normalizedAccessoriesColor = normalizeHexColor(obj.accessoriesColor);
    if (!normalizedAccessoriesColor) {
        return { valid: false, error: "Invalid accessories color." };
    }

    // Validate facialHair
    if (!isValidValue(obj.facialHair, ALLOWED_FACIAL_HAIR)) {
        return { valid: false, error: "Invalid facial hair option." };
    }

    // Validate facialHairColor (preset or valid 6-character hex)
    const normalizedFacialHairColor = normalizeHexColor(obj.facialHairColor);
    if (!normalizedFacialHairColor) {
        return { valid: false, error: "Invalid facial hair color." };
    }

    // Optional / backward-compatible fields:
    const normalizedHatColor = obj.hatColor ? normalizeHexColor(obj.hatColor) ?? "262e33" : "262e33";
    const validatedGraphic: ClothingGraphic = isValidValue(obj.clothingGraphic, ALLOWED_CLOTHING_GRAPHICS)
        ? obj.clothingGraphic
        : "none";

    return {
        valid: true,
        config: {
            skinColor: normalizedSkin,
            hairColor: normalizedHair,
            top: obj.top,
            hatColor: normalizedHatColor,
            clothing: obj.clothing,
            clothesColor: normalizedClothesColor,
            clothingGraphic: validatedGraphic,
            eyes: obj.eyes,
            eyebrows: obj.eyebrows,
            mouth: obj.mouth,
            accessories: obj.accessories,
            accessoriesColor: normalizedAccessoriesColor,
            facialHair: obj.facialHair,
            facialHairColor: normalizedFacialHairColor,
        },
    };
}
