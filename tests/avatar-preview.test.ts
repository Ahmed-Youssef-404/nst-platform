// tests/avatar-preview.test.ts
// Test suite for the Global Student Avatar Preview feature.

import assert from "node:assert/strict";
import {
    openAvatarPreview,
    closeAvatarPreview,
    getAvatarPreviewSnapshot,
} from "../src/lib/avatar/avatar-preview-store";
import { generateAvatarDataUri } from "../src/lib/avatar/generate";
import { getInitials } from "../src/lib/profile/initials";
import { DEFAULT_AVATAR_CONFIG, type StudentAvatarConfig } from "../src/types/avatar";

console.log("=================================================");
console.log("RUNNING NST GLOBAL STUDENT AVATAR PREVIEW TEST SUITE");
console.log("=================================================\n");

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        console.error(`  ✗ ${name}`);
        console.error(err);
    }
}

// Group 1: Avatar Preview Store State & Lifecycle
console.log("--- Group 1: Avatar Preview Store State & Lifecycle ---");

test("Initial state is closed with safe defaults", () => {
    closeAvatarPreview();
    const snapshot = getAvatarPreviewSnapshot();
    assert.strictEqual(snapshot.isOpen, false);
});

test("openAvatarPreview opens modal with student payload", () => {
    const mockConfig: StudentAvatarConfig = {
        ...DEFAULT_AVATAR_CONFIG,
        top: "shortFlat",
    };

    openAvatarPreview({
        name: "Youssef Ahmed",
        avatarConfig: mockConfig,
        src: "data:image/svg+xml;utf8,<svg></svg>",
        fallbackInitials: "YA",
    });

    const snapshot = getAvatarPreviewSnapshot();
    assert.strictEqual(snapshot.isOpen, true);
    assert.strictEqual(snapshot.name, "Youssef Ahmed");
    assert.deepStrictEqual(snapshot.avatarConfig, mockConfig);
    assert.strictEqual(snapshot.src, "data:image/svg+xml;utf8,<svg></svg>");
    assert.strictEqual(snapshot.fallbackInitials, "YA");
});

test("closeAvatarPreview closes modal and preserves state transition", () => {
    closeAvatarPreview();
    const snapshot = getAvatarPreviewSnapshot();
    assert.strictEqual(snapshot.isOpen, false);
});

test("Opening with different student avatars sequentially updates state correctly", () => {
    openAvatarPreview({
        name: "Cadet Alpha",
        avatarConfig: DEFAULT_AVATAR_CONFIG,
    });
    let snapshot = getAvatarPreviewSnapshot();
    assert.strictEqual(snapshot.isOpen, true);
    assert.strictEqual(snapshot.name, "Cadet Alpha");

    openAvatarPreview({
        name: "Cadet Beta",
        fallbackInitials: "CB",
    });
    snapshot = getAvatarPreviewSnapshot();
    assert.strictEqual(snapshot.isOpen, true);
    assert.strictEqual(snapshot.name, "Cadet Beta");
    assert.strictEqual(snapshot.avatarConfig, null);
    assert.strictEqual(snapshot.fallbackInitials, "CB");

    closeAvatarPreview();
});

// Group 2: Edge Cases & Resiliency
console.log("\n--- Group 2: Edge Cases & Resiliency ---");

test("Handles missing student name gracefully", () => {
    openAvatarPreview({
        avatarConfig: null,
    });
    const snapshot = getAvatarPreviewSnapshot();
    assert.strictEqual(snapshot.isOpen, true);
    assert.strictEqual(snapshot.name, undefined);

    const initials = getInitials(snapshot.name || "", snapshot.fallbackInitials || "ST");
    assert.strictEqual(initials, "ST");
    closeAvatarPreview();
});

test("Handles custom image URLs without avatarConfig", () => {
    openAvatarPreview({
        name: "Custom Cadet",
        src: "https://example.com/avatar.png",
    });
    const snapshot = getAvatarPreviewSnapshot();
    assert.strictEqual(snapshot.isOpen, true);
    assert.strictEqual(snapshot.src, "https://example.com/avatar.png");
    assert.strictEqual(snapshot.avatarConfig, null);
    closeAvatarPreview();
});

test("generateAvatarDataUri works with null or undefined configs", () => {
    const uriNull = generateAvatarDataUri(null);
    assert.ok(uriNull.startsWith("data:image/svg+xml"));

    const uriUndefined = generateAvatarDataUri(undefined);
    assert.ok(uriUndefined.startsWith("data:image/svg+xml"));
});

test("getInitials formats single-name, multi-name, and empty names correctly", () => {
    assert.strictEqual(getInitials("Ahmed", "ST"), "A");
    assert.strictEqual(getInitials("Ahmed Youssef", "ST"), "AY");
    assert.strictEqual(getInitials("Ahmed Youssef Ali", "ST"), "AY");
    assert.strictEqual(getInitials("   ", "ST"), "ST");
    assert.strictEqual(getInitials("", "NST"), "NST");
});

console.log("\n=================================================");
console.log(`TEST RESULTS: ${passedTests}/${totalTests} tests passed.`);
console.log("=================================================\n");

if (passedTests !== totalTests) {
    process.exit(1);
}
