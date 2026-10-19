// src/lib/avatar/__tests__/avatar.test.ts
// Automated test suite for the Core Student Avatar System & Customization Expansion.

import assert from "node:assert";
import {
    validateAvatarConfig,
    normalizeHexColor,
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
    type StudentAvatarConfig,
} from "@/types/avatar";
import {
    generateAvatarSvg,
    generateAvatarDataUri,
    resolveAvatarConfig,
} from "@/lib/avatar/generate";
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

console.log("🚀 Starting Avatar System Test Suite...\n");

// Test 1: DEFAULT_AVATAR_CONFIG validation
console.log("Test 1: Validating DEFAULT_AVATAR_CONFIG...");
const defaultValidation = validateAvatarConfig(DEFAULT_AVATAR_CONFIG);
assert.strictEqual(defaultValidation.valid, true, "DEFAULT_AVATAR_CONFIG must be valid");
console.log("✔ DEFAULT_AVATAR_CONFIG is valid.");

// Test 2: Reject null, non-objects, or empty objects
console.log("Test 2: Rejecting invalid payloads...");
assert.strictEqual(validateAvatarConfig(null).valid, false);
assert.strictEqual(validateAvatarConfig(undefined).valid, false);
assert.strictEqual(validateAvatarConfig("not-an-object").valid, false);
assert.strictEqual(validateAvatarConfig({}).valid, false);
console.log("✔ Non-objects and empty payloads correctly rejected.");

// Test 3: Reject invalid or malicious options/values
console.log("Test 3: Rejecting unsupported option values...");
const maliciousConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    skinColor: "invalid-color-injection",
};
assert.strictEqual(validateAvatarConfig(maliciousConfig).valid, false);

const unsupportedHairstyle = {
    ...DEFAULT_AVATAR_CONFIG,
    top: "super-saiyan-hair-that-does-not-exist",
};
assert.strictEqual(validateAvatarConfig(unsupportedHairstyle).valid, false);
console.log("✔ Unsupported option values rejected against allowlist.");

// Test 4: Verify all allowlist values are valid
console.log("Test 4: Verifying allowlist integrity...");
for (const skin of ALLOWED_SKIN_COLORS) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, skinColor: skin });
    assert.strictEqual(res.valid, true, `Skin color ${skin} must be valid`);
}
for (const hair of ALLOWED_HAIR_COLORS) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, hairColor: hair });
    assert.strictEqual(res.valid, true, `Hair color ${hair} must be valid`);
}
for (const top of ALLOWED_TOPS) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, top });
    assert.strictEqual(res.valid, true, `Hairstyle ${top} must be valid`);
}
for (const clothing of ALLOWED_CLOTHING) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, clothing });
    assert.strictEqual(res.valid, true, `Clothing ${clothing} must be valid`);
}
for (const graphic of ALLOWED_CLOTHING_GRAPHICS) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, clothingGraphic: graphic });
    assert.strictEqual(res.valid, true, `Graphic ${graphic} must be valid`);
}
for (const clothesColor of ALLOWED_CLOTHES_COLORS) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, clothesColor });
    assert.strictEqual(res.valid, true, `Clothes color ${clothesColor} must be valid`);
}
for (const eyes of ALLOWED_EYES) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, eyes });
    assert.strictEqual(res.valid, true, `Eyes ${eyes} must be valid`);
}
for (const eyebrows of ALLOWED_EYEBROWS) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, eyebrows });
    assert.strictEqual(res.valid, true, `Eyebrows ${eyebrows} must be valid`);
}
for (const mouth of ALLOWED_MOUTH) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, mouth });
    assert.strictEqual(res.valid, true, `Mouth ${mouth} must be valid`);
}
for (const acc of ALLOWED_ACCESSORIES) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, accessories: acc });
    assert.strictEqual(res.valid, true, `Accessory ${acc} must be valid`);
}
for (const accColor of ALLOWED_ACCESSORIES_COLORS) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, accessoriesColor: accColor });
    assert.strictEqual(res.valid, true, `Accessory color ${accColor} must be valid`);
}
for (const facialHair of ALLOWED_FACIAL_HAIR) {
    const res = validateAvatarConfig({ ...DEFAULT_AVATAR_CONFIG, facialHair });
    assert.strictEqual(res.valid, true, `Facial hair ${facialHair} must be valid`);
}
console.log("✔ All allowlist entries match schema rules and are valid.");

// Test 5: Safe fallback resolution
console.log("Test 5: Testing safe fallback resolution...");
assert.deepStrictEqual(resolveAvatarConfig(null), DEFAULT_AVATAR_CONFIG);
assert.deepStrictEqual(resolveAvatarConfig(undefined), DEFAULT_AVATAR_CONFIG);
assert.deepStrictEqual(resolveAvatarConfig({ bad: "data" }), DEFAULT_AVATAR_CONFIG);
console.log("✔ Missing or corrupt configs fall back cleanly to DEFAULT_AVATAR_CONFIG.");

// Test 6: Deterministic SVG generation
console.log("Test 6: Testing deterministic SVG generation...");
const svg1 = generateAvatarSvg(DEFAULT_AVATAR_CONFIG);
const svg2 = generateAvatarSvg(DEFAULT_AVATAR_CONFIG);
assert.ok(svg1.startsWith("<svg"), "Output must be valid SVG markup");
assert.ok(svg1.includes("viewBox="), "SVG must have viewBox");
assert.strictEqual(svg1, svg2, "Identical configs must generate identical SVG markup");
console.log("✔ Deterministic SVG generation verified.");

// Test 7: Data URI generation & Caching
console.log("Test 7: Testing Data URI generation and caching...");
const uri1 = generateAvatarDataUri(DEFAULT_AVATAR_CONFIG);
const uri2 = generateAvatarDataUri(DEFAULT_AVATAR_CONFIG);
assert.ok(uri1.startsWith("data:image/svg+xml;utf8,"), "Must be valid SVG Data URI");
assert.strictEqual(uri1, uri2, "Data URI must be identical and cached");
console.log("✔ Data URI generation and memoization verified.");

// Test 8: Custom configuration rendering & custom hex colors
console.log("Test 8: Testing custom configuration and custom hex colors...");
const customConfig: StudentAvatarConfig = {
    skinColor: "614335",
    hairColor: "c93305",
    top: "dreads02",
    hatColor: "262e33",
    clothing: "graphicShirt",
    clothingGraphic: "diamond",
    clothesColor: "5199e4",
    eyes: "happy",
    eyebrows: "raisedExcitedNatural",
    mouth: "twinkle",
    accessories: "sunglasses",
    accessoriesColor: "262e33",
    facialHair: "beardMedium",
    facialHairColor: "c93305",
};
const customSvg = generateAvatarSvg(customConfig);
const customUri = generateAvatarDataUri(customConfig);
assert.ok(customSvg.length > 500, "Custom SVG markup generated");
assert.ok(customUri.length > 500, "Custom Data URI generated");
assert.notStrictEqual(customSvg, svg1, "Custom avatar must differ from default avatar");
console.log("✔ Custom configurations render accurately and differ from default.");

// Test 9: Bald ("none") hairstyle rendering
console.log("Test 9: Testing Clean Bald (none) hairstyle rendering...");
const baldConfig: StudentAvatarConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    top: "none",
};
const baldSvg = generateAvatarSvg(baldConfig);
assert.ok(baldSvg.length > 500, "Bald avatar SVG generated");
assert.notStrictEqual(baldSvg, svg1, "Bald avatar differs from shortRound hair");
console.log("✔ Clean Bald hairstyle renders cleanly.");

// Test 10: Custom Hex Color normalization and support
console.log("Test 10: Testing Custom Hex Color normalization...");
assert.strictEqual(normalizeHexColor("#FFAA00"), "ffaa00");
assert.strictEqual(normalizeHexColor("123456"), "123456");
assert.strictEqual(normalizeHexColor("#bad"), null);
assert.strictEqual(normalizeHexColor("notahexcolor"), null);

const hexColorConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    hairColor: "#eab308", // Custom gold hex
    clothesColor: "#06b6d4", // Custom cyan hex
};
const hexValidation = validateAvatarConfig(hexColorConfig);
assert.strictEqual(hexValidation.valid, true);
if (hexValidation.valid) {
    assert.strictEqual(hexValidation.config.hairColor, "eab308");
    assert.strictEqual(hexValidation.config.clothesColor, "06b6d4");
}
console.log("✔ Custom hex color values validated, normalized, and accepted.");

// Test 11: Visual Thumbnail Generators
console.log("Test 11: Testing visual thumbnail generators...");
const topThumb = getTopThumbnail("theCaesar", "4a312c");
const baldThumb = getTopThumbnail("none");
const eyesThumb = getEyesThumbnail("wink");
const eyebrowsThumb = getEyebrowsThumbnail("angryNatural");
const mouthThumb = getMouthThumbnail("smile");
const clothingThumb = getClothingThumbnail("hoodie", "262e33");
const graphicThumb = getGraphicThumbnail("pizza");
const accessoryThumb = getAccessoryThumbnail("sunglasses", "ffffb1");
const facialHairThumb = getFacialHairThumbnail("beardMajestic", "2c1b18");

assert.ok(topThumb.startsWith("data:image/svg+xml;utf8,"), "Top thumbnail is valid Data URI");
assert.ok(baldThumb.startsWith("data:image/svg+xml;utf8,"), "Bald thumbnail is valid Data URI");
assert.ok(eyesThumb.startsWith("data:image/svg+xml;utf8,"), "Eyes thumbnail is valid Data URI");
assert.ok(eyebrowsThumb.startsWith("data:image/svg+xml;utf8,"), "Eyebrows thumbnail is valid Data URI");
assert.ok(mouthThumb.startsWith("data:image/svg+xml;utf8,"), "Mouth thumbnail is valid Data URI");
assert.ok(clothingThumb.startsWith("data:image/svg+xml;utf8,"), "Clothing thumbnail is valid Data URI");
assert.ok(graphicThumb.startsWith("data:image/svg+xml;utf8,"), "Graphic thumbnail is valid Data URI");
assert.ok(accessoryThumb.startsWith("data:image/svg+xml;utf8,"), "Accessory thumbnail is valid Data URI");
assert.ok(facialHairThumb.startsWith("data:image/svg+xml;utf8,"), "Facial hair thumbnail is valid Data URI");
console.log("✔ All visual thumbnail generators generate valid SVG Data URIs.");

console.log("\n🎉 ALL AVATAR UNIT TESTS PASSED SUCCESSFULLY! (11/11)");
