// src/lib/avatar/options.ts
// Visual options, categories, and human-friendly labels for the Avatar Editor UI.

import type {
    SkinColor,
    HairColor,
    Top,
    Clothing,
    ClothingGraphic,
    ClothesColor,
    Eyes,
    Eyebrows,
    Mouth,
    Accessory,
    AccessoriesColor,
    FacialHair,
} from "@/types/avatar";

export interface ColorOption<T extends string = string> {
    value: T;
    label: string;
    hex: string;
}

export interface ChoiceOption<T extends string> {
    value: T;
    label: string;
    description?: string;
}

export const SKIN_COLOR_OPTIONS: ColorOption<SkinColor>[] = [
    { value: "ffdbb4", label: "Fair", hex: "#ffdbb4" },
    { value: "edb98a", label: "Warm Pale", hex: "#edb98a" },
    { value: "f8d25c", label: "Golden", hex: "#f8d25c" },
    { value: "fd9841", label: "Tan", hex: "#fd9841" },
    { value: "d08b5b", label: "Caramel", hex: "#d08b5b" },
    { value: "ae5d29", label: "Bronze", hex: "#ae5d29" },
    { value: "614335", label: "Deep Chestnut", hex: "#614335" },
];

export const HAIR_COLOR_OPTIONS: ColorOption<HairColor>[] = [
    { value: "b58143", label: "Honey Brown", hex: "#b58143" },
    { value: "d6b370", label: "Golden Blonde", hex: "#d6b370" },
    { value: "ecdcbf", label: "Platinum", hex: "#ecdcbf" },
    { value: "c93305", label: "Crimson Red", hex: "#c93305" },
    { value: "a55728", label: "Auburn", hex: "#a55728" },
    { value: "724133", label: "Chestnut", hex: "#724133" },
    { value: "4a312c", label: "Dark Brown", hex: "#4a312c" },
    { value: "2c1b18", label: "Midnight Black", hex: "#2c1b18" },
    { value: "f59797", label: "Pastel Rose", hex: "#f59797" },
    { value: "e8e1e1", label: "Cyber Silver", hex: "#e8e1e1" },
];

export const TOP_OPTIONS: {
    category: string;
    options: ChoiceOption<Top>[];
}[] = [
        {
            category: "Minimal & Bald",
            options: [
                { value: "none", label: "Clean Bald" },
            ],
        },
        {
            category: "Short & Clean",
            options: [
                { value: "sides", label: "Buzz Sides" },
                { value: "theCaesarAndSidePart", label: "Caesar Part" },
                { value: "theCaesar", label: "Caesar" },
                { value: "dreads01", label: "Short Dreads" },
                { value: "shortRound", label: "Short Round" },
                { value: "shortFlat", label: "Short Flat" },
                { value: "shortCurly", label: "Short Curly" },
                { value: "shortWaved", label: "Short Waved" },
                { value: "shavedSides", label: "Undercut" },
                { value: "shaggy", label: "Shaggy" },
                { value: "shaggyMullet", label: "Modern Shag" },
            ],
        },
        {
            category: "Medium & Long",
            options: [
                { value: "frizzle", label: "Frizz Wave" },
                { value: "dreads02", label: "Braided Dreads" },
                { value: "dreads", label: "Long Dreads" },
                { value: "curly", label: "Curly Cascade" },
                { value: "bun", label: "Top Bun" },
                { value: "curvy", label: "Wavy Medium" },
                { value: "fro", label: "Afro" },
                { value: "froBand", label: "Afro Band" },
                { value: "bigHair", label: "Voluminous" },
                { value: "longButNotTooLong", label: "Shoulder Flow" },
                { value: "miaWallace", label: "Sharp Bangs" },
                { value: "bob", label: "Classic Bob" },
                { value: "straight02", label: "Straight Long" },
                { value: "straight01", label: "Straight Flow" },
                { value: "straightAndStrand", label: "Strand Accent" },
                { value: "frida", label: "Floral Frida" },
            ],
        },
        {
            category: "Headwear & Wraps",
            options: [
                { value: "winterHat1", label: "Winter Beanie" },
                { value: "hijab", label: "Hijab" },
                { value: "turban", label: "Turban" },
                { value: "winterHat02", label: "Ribbed Beanie" },
                { value: "winterHat03", label: "Pompom Beanie" },
                { value: "winterHat04", label: "Knit Cap" },
                { value: "hat", label: "Casual Cap" },
            ],
        },
    ];

export const HEADWEAR_TOPS: readonly Top[] = [
    "hat",
    "hijab",
    "turban",
    "winterHat1",
    "winterHat02",
    "winterHat03",
    "winterHat04",
];

export function isHeadwearTop(top: Top): boolean {
    return (HEADWEAR_TOPS as readonly string[]).includes(top);
}

export const CLOTHING_OPTIONS: ChoiceOption<Clothing>[] = [
    { value: "shirtScoopNeck", label: "Scoopneck T-Shirt" },
    { value: "overall", label: "Overalls" },
    { value: "shirtVNeck", label: "V-Neck T-Shirt" },
    { value: "shirtCrewNeck", label: "Crewneck T-Shirt" },
    { value: "collarAndSweater", label: "Collar & Sweater" },
    { value: "blazerAndShirt", label: "Blazer & Shirt" },
    { value: "blazerAndSweater", label: "Blazer & Knit" },
    { value: "hoodie", label: "Tech Hoodie" },
    // { value: "graphicShirt", label: "Graphic Tee" },
];

export const CLOTHING_GRAPHIC_OPTIONS: ChoiceOption<ClothingGraphic>[] = [
    { value: "none", label: "Plain Shirt" },
    { value: "diamond", label: "Star Diamond" },
    { value: "skull", label: "Cyber Skull" },
    { value: "skullOutline", label: "Outline Skull" },
    { value: "pizza", label: "Hacker Pizza" },
    { value: "bear", label: "Code Bear" },
    { value: "bat", label: "Night Bat" },
    { value: "deer", label: "Nordic Deer" },
    { value: "resist", label: "Resist Fist" },
    { value: "hola", label: "Hola Badge" },
    { value: "cumbia", label: "Cumbia" },
];

export const CLOTHES_COLOR_OPTIONS: ColorOption<ClothesColor>[] = [
    { value: "262e33", label: "Space Obsidian", hex: "#262e33" },
    { value: "3c4f5c", label: "Slate Navy", hex: "#3c4f5c" },
    { value: "e6e6e6", label: "Moon Dust", hex: "#e6e6e6" },
    { value: "25557c", label: "Deep Cobalt", hex: "#25557c" },
    { value: "5199e4", label: "Starlight Blue", hex: "#5199e4" },
    { value: "65c9ff", label: "Cyan Aura", hex: "#65c9ff" },
    { value: "b1e2ff", label: "Ice Blue", hex: "#b1e2ff" },
    { value: "a7ffc4", label: "Mint Neon", hex: "#a7ffc4" },
    { value: "ffffb1", label: "Solar Gold", hex: "#ffffb1" },
    { value: "ffafb9", label: "Blush Coral", hex: "#ffafb9" },
    { value: "ff488e", label: "Electric Pink", hex: "#ff488e" },
    { value: "ff5c5c", label: "Flame Amber", hex: "#ff5c5c" },
];

export const HAT_COLOR_OPTIONS = CLOTHES_COLOR_OPTIONS;

export const EYES_OPTIONS: ChoiceOption<Eyes>[] = [
    { value: "default", label: "Attentive" },
    { value: "surprised", label: "Wide Curious" },
    { value: "eyeRoll", label: "Playful Roll" },
    { value: "side", label: "Glance Side" },
    { value: "cry", label: "Emotional" },
    { value: "hearts", label: "Stellar Hearts" },
    { value: "xDizzy", label: "Dizzy / KO" },
    { value: "wink", label: "Friendly Wink" },
    { value: "happy", label: "Happy Spark" },
    { value: "closed", label: "Calm Zen" },
    { value: "winkWacky", label: "Wacky Wink" },
    { value: "squint", label: "Deep Focus" },
];

export const EYEBROWS_OPTIONS: ChoiceOption<Eyebrows>[] = [
    { value: "default", label: "Defined" },
    { value: "flatNatural", label: "Straight Line" },
    { value: "upDown", label: "Asymmetric" },
    { value: "upDownNatural", label: "Curious Raised" },
    { value: "sadConcerned", label: "Thoughtful" },
    { value: "sadConcernedNatural", label: "Concerned" },
    { value: "frownNatural", label: "Intense Focus" },
    { value: "angry", label: "Fierce" },
    { value: "angryNatural", label: "Determined" },
    { value: "raisedExcited", label: "Wide Excited" },
    { value: "raisedExcitedNatural", label: "Excited" },
    { value: "defaultNatural", label: "Natural Calm" },
    // { value: "unibrowNatural", label: "Unibrow" },
];

export const MOUTH_OPTIONS: ChoiceOption<Mouth>[] = [
    { value: "default", label: "Composed" },
    { value: "serious", label: "Focused / Serious" },
    { value: "sad", label: "Melancholic" },
    { value: "disbelief", label: "Skeptical" },
    { value: "concerned", label: "Thinking" },
    { value: "screamOpen", label: "Surprised" },
    { value: "grimace", label: "Debug Grimace" },
    { value: "tongue", label: "Playful" },
    { value: "eating", label: "Snacking" },
    { value: "twinkle", label: "Confident Grin" },
    { value: "smile", label: "Warm Smile" },
    // { value: "vomit", label: "Exhausted" },
];

export const ACCESSORY_OPTIONS: ChoiceOption<Accessory>[] = [
    { value: "none", label: "None" },
    { value: "prescription01", label: "Standard Frames" },
    { value: "prescription02", label: "Square Glasses" },
    { value: "round", label: "Round Glasses" },
    { value: "kurt", label: "Retro Oval" },
    { value: "sunglasses", label: "Dark Shades" },
    { value: "wayfarers", label: "Wayfarer Glasses" },
    { value: "eyepatch", label: "Cyber Eyepatch" },
];

export const ACCESSORIES_COLOR_OPTIONS: ColorOption<AccessoriesColor>[] = [
    { value: "262e33", label: "Black Obsidian", hex: "#262e33" },
    { value: "5199e4", label: "Blue Sapphire", hex: "#5199e4" },
    { value: "65c9ff", label: "Cyan Glow", hex: "#65c9ff" },
    { value: "ffffb1", label: "Gold Frame", hex: "#ffffb1" },
    { value: "ffdeb5", label: "Champagne", hex: "#ffdeb5" },
    { value: "ff5c5c", label: "Crimson Red", hex: "#ff5c5c" },
    { value: "ffffff", label: "White Opal", hex: "#ffffff" },
    { value: "929598", label: "Gunmetal", hex: "#929598" },
];

export const FACIAL_HAIR_OPTIONS: ChoiceOption<FacialHair>[] = [
    { value: "none", label: "Clean Shaven" },
    { value: "beardMajestic", label: "Majestic Beard" },
    { value: "beardMedium", label: "Trimmed Beard" },
    { value: "beardLight", label: "Light Stubble" },
    { value: "moustacheFancy", label: "Fancy Moustache" },
    { value: "moustacheMagnum", label: "Magnum Moustache" },
];
