// src/lib/avatar/catalog.ts
// Authoritative catalog definitions, pricing tiers, and item-specific color rules
// for the Student Avatar System and ST Store integration.

import { normalizeHexColor } from "@/types/avatar";
import {
    HAIR_COLOR_OPTIONS,
    CLOTHES_COLOR_OPTIONS,
    HAT_COLOR_OPTIONS,
    ACCESSORIES_COLOR_OPTIONS,
} from "@/lib/avatar/options";

export type ItemRarity = "COMMON" | "RARE" | "EPIC";

export type AvatarCategory = "hair" | "face" | "base" | "clothing" | "details";

export type AvatarSlotName =
    | "top"
    | "clothing"
    | "clothingGraphic"
    | "accessories"
    | "facialHair"
    | "eyes"
    | "eyebrows"
    | "mouth"
    | "skinColor";

export interface CatalogColorOption {
    hex: string;
    label: string;
    isFree: boolean;
    cost: number;
}

export interface CatalogItem {
    id: string; // e.g. "top:theCaesar", "clothing:hoodie"
    slot: AvatarSlotName;
    value: string; // DiceBear Avataaars value
    name: string;
    description?: string;
    category: AvatarCategory;
    isFree: boolean;
    cost: number;
    rarity: ItemRarity;
    isColorable: boolean;
    // Item-specific predefined colors:
    colorOptions?: CatalogColorOption[];
    customColorPrice: number; // Cost for selecting a custom color picker hex for this item
}

// -----------------------------------------------------------------------------
// Predefined Default Colors per Colorable Slot
// Each colorable item has 3–4 free colors by default, with additional colors priced at 10–15 ST.
// -----------------------------------------------------------------------------

export const DEFAULT_HAIR_FREE_HEXES = new Set(["2c1b18", "4a312c", "724133", "a55728"]);
export const DEFAULT_CLOTHES_FREE_HEXES = new Set(["262e33", "3c4f5c", "929598", "e6e6e6"]);
export const DEFAULT_ACCESSORIES_FREE_HEXES = new Set(["262e33", "929598", "ffffff"]);

export const CUSTOM_COLOR_PRICE = 25; // ST price for selecting a custom color picker hex

function buildHairColorOptions(): CatalogColorOption[] {
    return HAIR_COLOR_OPTIONS.map((c) => {
        const hex = c.value.toLowerCase();
        const isFree = DEFAULT_HAIR_FREE_HEXES.has(hex);
        return {
            hex,
            label: c.label,
            isFree,
            cost: isFree ? 0 : 15,
        };
    });
}

function buildHatColorOptions(): CatalogColorOption[] {
    return HAT_COLOR_OPTIONS.map((c) => {
        const hex = c.value.toLowerCase();
        const isFree = DEFAULT_CLOTHES_FREE_HEXES.has(hex);
        return {
            hex,
            label: c.label,
            isFree,
            cost: isFree ? 0 : 15,
        };
    });
}

function buildClothesColorOptions(): CatalogColorOption[] {
    return CLOTHES_COLOR_OPTIONS.map((c) => {
        const hex = c.value.toLowerCase();
        const isFree = DEFAULT_CLOTHES_FREE_HEXES.has(hex);
        return {
            hex,
            label: c.label,
            isFree,
            cost: isFree ? 0 : 15,
        };
    });
}

function buildAccessoryColorOptions(): CatalogColorOption[] {
    return ACCESSORIES_COLOR_OPTIONS.map((c) => {
        const hex = c.value.toLowerCase();
        const isFree = DEFAULT_ACCESSORIES_FREE_HEXES.has(hex);
        return {
            hex,
            label: c.label,
            isFree,
            cost: isFree ? 0 : 15,
        };
    });
}

function buildFacialHairColorOptions(): CatalogColorOption[] {
    return HAIR_COLOR_OPTIONS.map((c) => {
        const hex = c.value.toLowerCase();
        const isFree = DEFAULT_HAIR_FREE_HEXES.has(hex);
        return {
            hex,
            label: c.label,
            isFree,
            cost: isFree ? 0 : 15,
        };
    });
}

// -----------------------------------------------------------------------------
// Catalog Items Definitions
// -----------------------------------------------------------------------------

export const AVATAR_CATALOG: CatalogItem[] = [
    // ---------------- Tops: Minimal & Bald ----------------
    {
        id: "top:none",
        slot: "top",
        value: "none",
        name: "Clean Bald",
        category: "hair",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: false,
        customColorPrice: 0,
    },

    // ---------------- Tops: Short & Clean ----------------
    {
        id: "top:theCaesar",
        slot: "top",
        value: "theCaesar",
        name: "Caesar",
        category: "hair",
        isFree: false,
        cost: 10,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:sides",
        slot: "top",
        value: "sides",
        name: "Buzz Sides",
        category: "hair",
        isFree: false,
        cost: 10,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:theCaesarAndSidePart",
        slot: "top",
        value: "theCaesarAndSidePart",
        name: "Caesar Part",
        category: "hair",
        isFree: false,
        cost: 20,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:dreads01",
        slot: "top",
        value: "dreads01",
        name: "Short Dreads",
        category: "hair",
        isFree: false,
        cost: 25,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:shortRound",
        slot: "top",
        value: "shortRound",
        name: "Short Round",
        category: "hair",
        isFree: false,
        cost: 35,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:shortFlat",
        slot: "top",
        value: "shortFlat",
        name: "Short Flat",
        category: "hair",
        isFree: false,
        cost: 40,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:shortCurly",
        slot: "top",
        value: "shortCurly",
        name: "Short Curly",
        category: "hair",
        isFree: false,
        cost: 45,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:shortWaved",
        slot: "top",
        value: "shortWaved",
        name: "Short Waved",
        category: "hair",
        isFree: false,
        cost: 45,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:shavedSides",
        slot: "top",
        value: "shavedSides",
        name: "Undercut",
        category: "hair",
        isFree: false,
        cost: 20,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:shaggy",
        slot: "top",
        value: "shaggy",
        name: "Shaggy",
        category: "hair",
        isFree: false,
        cost: 25,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:shaggyMullet",
        slot: "top",
        value: "shaggyMullet",
        name: "Modern Shag",
        category: "hair",
        isFree: false,
        cost: 40,
        rarity: "EPIC",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    // ---------------- Tops: Medium, Long & Textured ----------------
    {
        id: "top:bob",
        slot: "top",
        value: "bob",
        name: "Classic Bob",
        category: "hair",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:bun",
        slot: "top",
        value: "bun",
        name: "Top Bun",
        category: "hair",
        isFree: false,
        cost: 15,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:frizzle",
        slot: "top",
        value: "frizzle",
        name: "Frizz Wave",
        category: "hair",
        isFree: false,
        cost: 20,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:curly",
        slot: "top",
        value: "curly",
        name: "Curly Cascade",
        category: "hair",
        isFree: false,
        cost: 25,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:curvy",
        slot: "top",
        value: "curvy",
        name: "Wavy Medium",
        category: "hair",
        isFree: false,
        cost: 25,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:dreads",
        slot: "top",
        value: "dreads",
        name: "Long Dreads",
        category: "hair",
        isFree: false,
        cost: 25,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:dreads02",
        slot: "top",
        value: "dreads02",
        name: "Braided Dreads",
        category: "hair",
        isFree: false,
        cost: 25,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:fro",
        slot: "top",
        value: "fro",
        name: "Afro",
        category: "hair",
        isFree: false,
        cost: 30,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:froBand",
        slot: "top",
        value: "froBand",
        name: "Afro Band",
        category: "hair",
        isFree: false,
        cost: 30,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:longButNotTooLong",
        slot: "top",
        value: "longButNotTooLong",
        name: "Shoulder Flow",
        category: "hair",
        isFree: false,
        cost: 30,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:miaWallace",
        slot: "top",
        value: "miaWallace",
        name: "Sharp Bangs",
        category: "hair",
        isFree: false,
        cost: 35,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:straight02",
        slot: "top",
        value: "straight02",
        name: "Straight Long",
        category: "hair",
        isFree: false,
        cost: 40,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:straight01",
        slot: "top",
        value: "straight01",
        name: "Straight Flow",
        category: "hair",
        isFree: false,
        cost: 45,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:straightAndStrand",
        slot: "top",
        value: "straightAndStrand",
        name: "Strand Accent",
        category: "hair",
        isFree: false,
        cost: 45,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:bigHair",
        slot: "top",
        value: "bigHair",
        name: "Voluminous",
        category: "hair",
        isFree: false,
        cost: 80,
        rarity: "EPIC",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:frida",
        slot: "top",
        value: "frida",
        name: "Floral Frida",
        category: "hair",
        isFree: false,
        cost: 85,
        rarity: "EPIC",
        isColorable: true,
        colorOptions: buildHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },

    // ---------------- Tops: Headwear & Wraps ----------------
    {
        id: "top:hijab",
        slot: "top",
        value: "hijab",
        name: "Hijab",
        category: "hair",
        isFree: false,
        cost: 35,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHatColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:turban",
        slot: "top",
        value: "turban",
        name: "Turban",
        category: "hair",
        isFree: false,
        cost: 50,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHatColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:winterHat1",
        slot: "top",
        value: "winterHat1",
        name: "Winter Beanie",
        category: "hair",
        isFree: false,
        cost: 55,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHatColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:winterHat02",
        slot: "top",
        value: "winterHat02",
        name: "Ribbed Beanie",
        category: "hair",
        isFree: false,
        cost: 70,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildHatColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:hat",
        slot: "top",
        value: "hat",
        name: "Casual Cap",
        category: "hair",
        isFree: false,
        cost: 80,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildHatColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:winterHat03",
        slot: "top",
        value: "winterHat03",
        name: "Pompom Beanie",
        category: "hair",
        isFree: false,
        cost: 80,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildHatColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "top:winterHat04",
        slot: "top",
        value: "winterHat04",
        name: "Knit Cap",
        category: "hair",
        isFree: false,
        cost: 85,
        rarity: "EPIC",
        isColorable: true,
        colorOptions: buildHatColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },

    // ---------------- Outfits: Clothing ----------------
    {
        id: "clothing:shirtScoopNeck",
        slot: "clothing",
        value: "shirtScoopNeck",
        name: "Scoopneck T-Shirt",
        category: "clothing",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildClothesColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "clothing:shirtCrewNeck",
        slot: "clothing",
        value: "shirtCrewNeck",
        name: "Crewneck T-Shirt",
        category: "clothing",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildClothesColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "clothing:shirtVNeck",
        slot: "clothing",
        value: "shirtVNeck",
        name: "V-Neck T-Shirt",
        category: "clothing",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildClothesColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "clothing:hoodie",
        slot: "clothing",
        value: "hoodie",
        name: "Tech Hoodie",
        category: "clothing",
        isFree: false,
        cost: 25,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildClothesColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "clothing:graphicShirt",
        slot: "clothing",
        value: "graphicShirt",
        name: "Graphic Tee",
        category: "clothing",
        isFree: false,
        cost: 25,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildClothesColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "clothing:collarAndSweater",
        slot: "clothing",
        value: "collarAndSweater",
        name: "Collar & Sweater",
        category: "clothing",
        isFree: false,
        cost: 45,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildClothesColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "clothing:blazerAndShirt",
        slot: "clothing",
        value: "blazerAndShirt",
        name: "Blazer & Shirt",
        category: "clothing",
        isFree: false,
        cost: 50,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildClothesColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "clothing:blazerAndSweater",
        slot: "clothing",
        value: "blazerAndSweater",
        name: "Blazer & Knit",
        category: "clothing",
        isFree: false,
        cost: 75,
        rarity: "EPIC",
        isColorable: true,
        colorOptions: buildClothesColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "clothing:overall",
        slot: "clothing",
        value: "overall",
        name: "Overalls",
        category: "clothing",
        isFree: false,
        cost: 75,
        rarity: "EPIC",
        isColorable: true,
        colorOptions: buildClothesColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },

    // ---------------- Graphic Badges (when graphicShirt is equipped) ----------------
    {
        id: "clothingGraphic:none",
        slot: "clothingGraphic",
        value: "none",
        name: "Plain Shirt",
        category: "clothing",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "clothingGraphic:diamond",
        slot: "clothingGraphic",
        value: "diamond",
        name: "Star Diamond",
        category: "clothing",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "clothingGraphic:pizza",
        slot: "clothingGraphic",
        value: "pizza",
        name: "Hacker Pizza",
        category: "clothing",
        isFree: false,
        cost: 15,
        rarity: "COMMON",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "clothingGraphic:bear",
        slot: "clothingGraphic",
        value: "bear",
        name: "Code Bear",
        category: "clothing",
        isFree: false,
        cost: 15,
        rarity: "COMMON",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "clothingGraphic:bat",
        slot: "clothingGraphic",
        value: "bat",
        name: "Night Bat",
        category: "clothing",
        isFree: false,
        cost: 15,
        rarity: "COMMON",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "clothingGraphic:skull",
        slot: "clothingGraphic",
        value: "skull",
        name: "Cyber Skull",
        category: "clothing",
        isFree: false,
        cost: 35,
        rarity: "RARE",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "clothingGraphic:skullOutline",
        slot: "clothingGraphic",
        value: "skullOutline",
        name: "Outline Skull",
        category: "clothing",
        isFree: false,
        cost: 35,
        rarity: "RARE",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "clothingGraphic:deer",
        slot: "clothingGraphic",
        value: "deer",
        name: "Nordic Deer",
        category: "clothing",
        isFree: false,
        cost: 35,
        rarity: "RARE",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "clothingGraphic:resist",
        slot: "clothingGraphic",
        value: "resist",
        name: "Resist Fist",
        category: "clothing",
        isFree: false,
        cost: 35,
        rarity: "RARE",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "clothingGraphic:hola",
        slot: "clothingGraphic",
        value: "hola",
        name: "Hola Badge",
        category: "clothing",
        isFree: false,
        cost: 70,
        rarity: "EPIC",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "clothingGraphic:cumbia",
        slot: "clothingGraphic",
        value: "cumbia",
        name: "Cumbia",
        category: "clothing",
        isFree: false,
        cost: 70,
        rarity: "EPIC",
        isColorable: false,
        customColorPrice: 0,
    },

    // ---------------- Accessories: Eyewear ----------------
    {
        id: "accessories:none",
        slot: "accessories",
        value: "none",
        name: "None",
        category: "details",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "accessories:prescription01",
        slot: "accessories",
        value: "prescription01",
        name: "Standard Frames",
        category: "details",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildAccessoryColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "accessories:prescription02",
        slot: "accessories",
        value: "prescription02",
        name: "Square Glasses",
        category: "details",
        isFree: false,
        cost: 20,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildAccessoryColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "accessories:round",
        slot: "accessories",
        value: "round",
        name: "Round Glasses",
        category: "details",
        isFree: false,
        cost: 20,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildAccessoryColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "accessories:sunglasses",
        slot: "accessories",
        value: "sunglasses",
        name: "Dark Shades",
        category: "details",
        isFree: false,
        cost: 40,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildAccessoryColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "accessories:wayfarers",
        slot: "accessories",
        value: "wayfarers",
        name: "Wayfarer Glasses",
        category: "details",
        isFree: false,
        cost: 45,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildAccessoryColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "accessories:kurt",
        slot: "accessories",
        value: "kurt",
        name: "Retro Oval",
        category: "details",
        isFree: false,
        cost: 45,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildAccessoryColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "accessories:eyepatch",
        slot: "accessories",
        value: "eyepatch",
        name: "Cyber Eyepatch",
        category: "details",
        isFree: false,
        cost: 80,
        rarity: "EPIC",
        isColorable: true,
        colorOptions: buildAccessoryColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },

    // ---------------- Facial Hair ----------------
    {
        id: "facialHair:none",
        slot: "facialHair",
        value: "none",
        name: "Clean Shaven",
        category: "details",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: false,
        customColorPrice: 0,
    },
    {
        id: "facialHair:beardLight",
        slot: "facialHair",
        value: "beardLight",
        name: "Light Stubble",
        category: "details",
        isFree: true,
        cost: 0,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildFacialHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "facialHair:beardMedium",
        slot: "facialHair",
        value: "beardMedium",
        name: "Trimmed Beard",
        category: "details",
        isFree: false,
        cost: 25,
        rarity: "COMMON",
        isColorable: true,
        colorOptions: buildFacialHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "facialHair:beardMajestic",
        slot: "facialHair",
        value: "beardMajestic",
        name: "Majestic Beard",
        category: "details",
        isFree: false,
        cost: 50,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildFacialHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "facialHair:moustacheFancy",
        slot: "facialHair",
        value: "moustacheFancy",
        name: "Fancy Moustache",
        category: "details",
        isFree: false,
        cost: 45,
        rarity: "RARE",
        isColorable: true,
        colorOptions: buildFacialHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
    {
        id: "facialHair:moustacheMagnum",
        slot: "facialHair",
        value: "moustacheMagnum",
        name: "Magnum Moustache",
        category: "details",
        isFree: false,
        cost: 75,
        rarity: "EPIC",
        isColorable: true,
        colorOptions: buildFacialHairColorOptions(),
        customColorPrice: CUSTOM_COLOR_PRICE,
    },
];

// Quick index maps for O(1) lookups
const catalogByIdMap = new Map<string, CatalogItem>(
    AVATAR_CATALOG.map((item) => [item.id, item])
);

const catalogBySlotValueMap = new Map<string, CatalogItem>(
    AVATAR_CATALOG.map((item) => [`${item.slot}:${item.value}`, item])
);

/**
 * Resolves a catalog item by its ID (e.g. "top:theCaesar").
 */
export function getCatalogItemById(id: string): CatalogItem | undefined {
    return catalogByIdMap.get(id);
}

/**
 * Resolves a catalog item by slot and value (e.g. slot: "top", value: "theCaesar").
 */
export function getCatalogItemBySlotValue(
    slot: AvatarSlotName,
    value: string
): CatalogItem | undefined {
    return catalogBySlotValueMap.get(`${slot}:${value}`);
}

/**
 * Checks whether an item value is inherently free.
 * If not in catalog (e.g. expressions or presets), defaults to free.
 */
export function isItemInherentFree(slot: AvatarSlotName, value: string): boolean {
    const item = getCatalogItemBySlotValue(slot, value);
    if (!item) {
        // Expressions (eyes, eyebrows, mouth) or unspecified items are inherently free
        return true;
    }
    return item.isFree;
}

/**
 * Checks whether a color is inherently free for a given item.
 */
export function isColorInherentFreeForItem(
    itemId: string,
    colorHex: string
): boolean {
    const normalized = normalizeHexColor(colorHex);
    if (!normalized) return false;

    const item = getCatalogItemById(itemId);
    if (!item || !item.isColorable || !item.colorOptions) {
        return false;
    }

    const match = item.colorOptions.find(
        (opt) => opt.hex.toLowerCase() === normalized.toLowerCase()
    );

    return Boolean(match?.isFree);
}

/**
 * Computes authoritative price for an item.
 */
export function getAuthoritativeItemPrice(itemId: string): number {
    const item = getCatalogItemById(itemId);
    if (!item) return 0;
    return item.isFree ? 0 : item.cost;
}

/**
 * Computes authoritative price for an item color.
 */
export function getAuthoritativeColorPrice(
    itemId: string,
    colorHex: string,
    isCustom = false
): number {
    const normalized = normalizeHexColor(colorHex);
    if (!normalized) return 0;

    const item = getCatalogItemById(itemId);
    if (!item || !item.isColorable) return 0;

    if (isCustom) {
        return item.customColorPrice || CUSTOM_COLOR_PRICE;
    }

    const match = item.colorOptions?.find(
        (opt) => opt.hex.toLowerCase() === normalized.toLowerCase()
    );

    if (!match) {
        // If not in predefined options, it's considered a custom color
        return item.customColorPrice || CUSTOM_COLOR_PRICE;
    }

    return match.isFree ? 0 : match.cost;
}
