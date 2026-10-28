// src/lib/super-admin/student-sort.ts
// Pure helpers for the Super Admin "All Students" table: the values the table
// displays for ST balance / track, and the sorting built on top of them.
// Rendering and sorting both read through these helpers so what an admin sees
// in a column is always exactly what that column sorts by.

import type { SuperAdminStudentSummary } from "@/lib/data/get-super-admin-overview";

export type StudentSortKey = "name" | "stBalance" | "track";
export type SortDirection = "asc" | "desc";

export interface StudentSortState {
    key: StudentSortKey;
    direction: SortDirection;
}

export type SortableStudent = Pick<
    SuperAdminStudentSummary,
    "id" | "name" | "avgSt" | "beginnerSt" | "groupType"
>;

/** Track labels shown in the table (and used as the track sort key). */
export const STUDENT_TRACK_LABELS: Record<
    SuperAdminStudentSummary["groupType"],
    string
> = {
    BEGINNER: "Beginner Track",
    INTERMEDIATE: "Intermediate Track",
};

/**
 * The ST value displayed for a student: the single cumulative balance for
 * Beginner students (defaults to the starting 50 when not set yet) and the
 * cross-level average for Intermediate students. Returns null only if the
 * value is not a finite number, so callers can handle it safely.
 */
export function getStudentStBalance(student: SortableStudent): number | null {
    const value =
        student.groupType === "BEGINNER"
            ? student.beginnerSt ?? 50
            : student.avgSt;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** The track label displayed for a student, or null if the track is unknown. */
export function getStudentTrackLabel(student: SortableStudent): string | null {
    return STUDENT_TRACK_LABELS[student.groupType] ?? null;
}

// Case- and accent-insensitive, locale-aware, with natural number ordering
// ("Student 2" before "Student 10"). "base" sensitivity makes "ahmed" and
// "Ahmed" compare as equal instead of splitting by capitalization.
const textCollator = new Intl.Collator(undefined, {
    sensitivity: "base",
    numeric: true,
});

function getStudentName(student: SortableStudent): string | null {
    const name = typeof student.name === "string" ? student.name.trim() : "";
    return name === "" ? null : name;
}

function compareText(a: string | null, b: string | null): number {
    return textCollator.compare(a ?? "", b ?? "");
}

/**
 * Compares two possibly-missing values. Missing values (null) always sort to
 * the end regardless of direction, so they never crowd the top of the table
 * when an admin flips the order. Returns undefined when both values exist and
 * the caller should compare them itself.
 */
function compareMissing<T>(a: T | null, b: T | null): number | undefined {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return undefined;
}

function comparePrimary(
    a: SortableStudent,
    b: SortableStudent,
    key: StudentSortKey,
    direction: SortDirection
): number {
    const sign = direction === "asc" ? 1 : -1;

    if (key === "stBalance") {
        const av = getStudentStBalance(a);
        const bv = getStudentStBalance(b);
        const missing = compareMissing(av, bv);
        if (missing !== undefined) return missing;
        // Numeric comparison (never string): 100 sorts above 20.
        return ((av as number) - (bv as number)) * sign;
    }

    const av = key === "name" ? getStudentName(a) : getStudentTrackLabel(a);
    const bv = key === "name" ? getStudentName(b) : getStudentTrackLabel(b);
    const missing = compareMissing(av, bv);
    if (missing !== undefined) return missing;
    return compareText(av, bv) * sign;
}

/**
 * Returns a new array sorted by the given column and direction. The input is
 * never mutated. Ties fall back to name (always A→Z) and then student code,
 * so the order is fully deterministic regardless of the chosen direction.
 */
export function sortStudents<T extends SortableStudent>(
    students: readonly T[],
    key: StudentSortKey,
    direction: SortDirection
): T[] {
    return [...students].sort((a, b) => {
        const primary = comparePrimary(a, b, key, direction);
        if (primary !== 0) return primary;

        if (key !== "name") {
            const byName = compareMissing(getStudentName(a), getStudentName(b));
            const nameResult =
                byName ?? compareText(getStudentName(a), getStudentName(b));
            if (nameResult !== 0) return nameResult;
        }

        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}
