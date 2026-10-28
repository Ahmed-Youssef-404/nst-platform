// src/lib/super-admin/__tests__/student-sort.test.ts
// Test suite for the Super Admin "All Students" table sorting helpers.
// Run with: npx tsx src/lib/super-admin/__tests__/student-sort.test.ts

import assert from "node:assert";
import {
    STUDENT_TRACK_LABELS,
    getStudentStBalance,
    getStudentTrackLabel,
    sortStudents,
    type SortableStudent,
} from "@/lib/super-admin/student-sort";

type Student = SortableStudent;

function student(overrides: Partial<Student> & { id: string }): Student {
    return {
        name: "Student",
        avgSt: 50,
        beginnerSt: null,
        groupType: "INTERMEDIATE",
        ...overrides,
    };
}

const ids = (list: Student[]) => list.map((s) => s.id);

console.log("🚀 Starting Student Table Sort Test Suite...\n");

// ---------------------------------------------------------------------------
// Displayed values
// ---------------------------------------------------------------------------
console.log("Test 1: Displayed ST balance matches the table's rules...");
assert.strictEqual(getStudentStBalance(student({ id: "a", avgSt: 72 })), 72);
assert.strictEqual(
    getStudentStBalance(student({ id: "b", groupType: "BEGINNER", beginnerSt: 130, avgSt: 50 })),
    130,
    "Beginner students use beginnerSt, not avgSt"
);
assert.strictEqual(
    getStudentStBalance(student({ id: "c", groupType: "BEGINNER", beginnerSt: null, avgSt: 999 })),
    50,
    "Beginner with no balance yet defaults to the starting 50 (as displayed)"
);
assert.strictEqual(
    getStudentStBalance(student({ id: "d", avgSt: 0 })),
    0,
    "Zero is a real balance, not a missing one"
);
assert.strictEqual(
    getStudentStBalance(student({ id: "e", avgSt: Number.NaN })),
    null,
    "Non-finite values are treated as missing"
);
assert.strictEqual(
    getStudentStBalance({ ...student({ id: "f" }), avgSt: undefined as unknown as number }),
    null,
    "undefined is treated as missing"
);
console.log("✔ ST balance display logic verified.");

console.log("Test 2: Track labels match what the table displays...");
assert.strictEqual(getStudentTrackLabel(student({ id: "a", groupType: "BEGINNER" })), "Beginner Track");
assert.strictEqual(getStudentTrackLabel(student({ id: "b", groupType: "INTERMEDIATE" })), "Intermediate Track");
assert.strictEqual(STUDENT_TRACK_LABELS.BEGINNER, "Beginner Track");
assert.strictEqual(STUDENT_TRACK_LABELS.INTERMEDIATE, "Intermediate Track");
assert.strictEqual(
    getStudentTrackLabel({ ...student({ id: "c" }), groupType: undefined as unknown as "BEGINNER" }),
    null,
    "Unknown track is treated as missing"
);
console.log("✔ Track labels verified.");

// ---------------------------------------------------------------------------
// Name sorting
// ---------------------------------------------------------------------------
console.log("Test 3: Name sorting is alphabetical and case-insensitive...");
const names = [
    student({ id: "1", name: "zeinab" }),
    student({ id: "2", name: "Ahmed" }),
    student({ id: "3", name: "mona" }),
    student({ id: "4", name: "Bassem" }),
    student({ id: "5", name: "ali" }),
];
assert.deepStrictEqual(
    sortStudents(names, "name", "asc").map((s) => s.name),
    ["Ahmed", "ali", "Bassem", "mona", "zeinab"],
    "Lowercase and uppercase names interleave alphabetically (no uppercase-first split)"
);
assert.deepStrictEqual(
    sortStudents(names, "name", "desc").map((s) => s.name),
    ["zeinab", "mona", "Bassem", "ali", "Ahmed"],
    "Descending is the exact reverse"
);
console.log("✔ Name sorting verified in both directions.");

console.log("Test 4: Names use natural number ordering...");
const numbered = [
    student({ id: "1", name: "Student 10" }),
    student({ id: "2", name: "Student 2" }),
    student({ id: "3", name: "Student 1" }),
];
assert.deepStrictEqual(
    sortStudents(numbered, "name", "asc").map((s) => s.name),
    ["Student 1", "Student 2", "Student 10"]
);
console.log("✔ Natural ordering verified.");

console.log("Test 5: Missing / blank names are handled safely and sort last in both directions...");
const withMissing = [
    student({ id: "1", name: "Mona" }),
    student({ id: "2", name: "" }),
    student({ id: "3", name: "Ahmed" }),
    student({ id: "4", name: "   " }),
    { ...student({ id: "5" }), name: undefined as unknown as string },
];
const missingAsc = sortStudents(withMissing, "name", "asc");
const missingDesc = sortStudents(withMissing, "name", "desc");
assert.deepStrictEqual(ids(missingAsc).slice(0, 2), ["3", "1"]);
assert.deepStrictEqual(ids(missingDesc).slice(0, 2), ["1", "3"]);
assert.deepStrictEqual([...ids(missingAsc).slice(2)].sort(), ["2", "4", "5"], "Blank names trail (asc)");
assert.deepStrictEqual([...ids(missingDesc).slice(2)].sort(), ["2", "4", "5"], "Blank names trail (desc)");
console.log("✔ Missing names never throw and always trail.");

// ---------------------------------------------------------------------------
// ST balance sorting
// ---------------------------------------------------------------------------
console.log("Test 6: ST balance sorts numerically, not as strings...");
const balances = [
    student({ id: "a", avgSt: 100 }),
    student({ id: "b", avgSt: 20 }),
    student({ id: "c", avgSt: 3 }),
    student({ id: "d", avgSt: 1000 }),
    student({ id: "e", avgSt: 75 }),
];
assert.deepStrictEqual(
    sortStudents(balances, "stBalance", "asc").map((s) => getStudentStBalance(s)),
    [3, 20, 75, 100, 1000],
    "A string sort would give 100, 1000, 20, 3, 75"
);
assert.deepStrictEqual(
    sortStudents(balances, "stBalance", "desc").map((s) => getStudentStBalance(s)),
    [1000, 100, 75, 20, 3]
);
console.log("✔ Numeric ST sorting verified in both directions.");

console.log("Test 7: ST sorting uses the displayed value across tracks, handles zero & missing...");
const mixed = [
    student({ id: "int-80", avgSt: 80 }),
    student({ id: "beg-130", groupType: "BEGINNER", beginnerSt: 130, avgSt: 50 }),
    student({ id: "beg-null", groupType: "BEGINNER", beginnerSt: null, avgSt: 999 }), // displays 50
    student({ id: "zero", avgSt: 0 }),
    student({ id: "nan", avgSt: Number.NaN }),
    student({ id: "neg", avgSt: -15 }),
];
assert.deepStrictEqual(ids(sortStudents(mixed, "stBalance", "asc")), [
    "neg", "zero", "beg-null", "int-80", "beg-130", "nan",
]);
assert.deepStrictEqual(ids(sortStudents(mixed, "stBalance", "desc")), [
    "beg-130", "int-80", "beg-null", "zero", "neg", "nan",
]);
console.log("✔ Mixed tracks, zero, negative, and missing balances verified (missing always last).");

// ---------------------------------------------------------------------------
// Track sorting
// ---------------------------------------------------------------------------
console.log("Test 8: Track sorts alphabetically in both directions with a stable name tie-break...");
const tracks = [
    student({ id: "1", name: "Zed", groupType: "INTERMEDIATE" }),
    student({ id: "2", name: "Yara", groupType: "BEGINNER" }),
    student({ id: "3", name: "Adam", groupType: "INTERMEDIATE" }),
    student({ id: "4", name: "Nour", groupType: "BEGINNER" }),
];
assert.deepStrictEqual(
    ids(sortStudents(tracks, "track", "asc")),
    ["4", "2", "3", "1"],
    "Beginner first; within a track, names stay A→Z"
);
assert.deepStrictEqual(
    ids(sortStudents(tracks, "track", "desc")),
    ["3", "1", "4", "2"],
    "Intermediate first; within a track, names still A→Z"
);
console.log("✔ Track sorting verified in both directions.");

console.log("Test 9: Missing track sorts last in both directions...");
const withBadTrack = [
    student({ id: "1", name: "Mona", groupType: "INTERMEDIATE" }),
    { ...student({ id: "2", name: "Ghost" }), groupType: undefined as unknown as "BEGINNER" },
    student({ id: "3", name: "Ali", groupType: "BEGINNER" }),
];
assert.deepStrictEqual(ids(sortStudents(withBadTrack, "track", "asc")), ["3", "1", "2"]);
assert.deepStrictEqual(ids(sortStudents(withBadTrack, "track", "desc")), ["1", "3", "2"]);
console.log("✔ Missing track handling verified.");

// ---------------------------------------------------------------------------
// General guarantees
// ---------------------------------------------------------------------------
console.log("Test 10: Sorting never mutates the input array or its items...");
const original = [
    student({ id: "1", name: "Zed", avgSt: 5 }),
    student({ id: "2", name: "Adam", avgSt: 500 }),
    student({ id: "3", name: "Mona", avgSt: 50 }),
];
const snapshot = JSON.stringify(original);
const sorted = sortStudents(original, "stBalance", "desc");
assert.notStrictEqual(sorted, original, "Returns a new array");
assert.strictEqual(JSON.stringify(original), snapshot, "Original order and ST balances are untouched");
assert.deepStrictEqual(sortStudents([], "name", "asc"), [], "Empty input is safe");
console.log("✔ Input data is never mutated.");

console.log("Test 11: Ties are fully deterministic (name, then student code)...");
const ties = [
    student({ id: "NST-1003", name: "Sara", avgSt: 60 }),
    student({ id: "NST-1001", name: "Sara", avgSt: 60 }),
    student({ id: "NST-1002", name: "Adam", avgSt: 60 }),
];
assert.deepStrictEqual(ids(sortStudents(ties, "stBalance", "asc")), ["NST-1002", "NST-1001", "NST-1003"]);
assert.deepStrictEqual(ids(sortStudents(ties, "stBalance", "desc")), ["NST-1002", "NST-1001", "NST-1003"]);
assert.deepStrictEqual(ids(sortStudents(ties, "name", "asc")), ["NST-1002", "NST-1001", "NST-1003"]);
console.log("✔ Tie-breaking verified.");

console.log("\n🎉 ALL STUDENT SORT TESTS PASSED SUCCESSFULLY! (11/11)");
