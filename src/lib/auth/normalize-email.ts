// src/lib/auth/normalize-email.ts
// Single source of truth for email normalization across the platform.
//
// Pure functions only - no server-only imports - so this file is safe to
// import from Server Actions, API code, scripts AND "use client" components
// (same convention as src/lib/profile/validation.ts).
//
// Why this exists: Supabase Auth stores emails lowercased, while the Prisma
// tables (students / instructors / super_admins) stored whatever casing was
// typed. getCurrentStudentId() bridges Auth -> students by email, so a
// "Student@Gmail.com" row never matched the Auth email and caused a
// redirect loop. Every email that is written, looked up, or compared must go
// through normalizeEmail().

/**
 * Trims surrounding whitespace and lowercases the whole address.
 *
 * Call it at submit time / on the server - NEVER inside an onChange handler
 * (users must be able to type in any casing).
 *
 * Normalization is NOT validation: use isValidEmail() separately.
 */
export function normalizeEmail(email: string): string {
    return String(email ?? "").trim().toLowerCase();
}

/**
 * Pragmatic format check (one "@", non-empty local part, dotted domain, no
 * spaces). Intentionally lenient - Supabase Auth remains the final authority.
 * Expects an already-normalized value, but is whitespace-safe on its own.
 */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? "").trim());
}

/** Case/whitespace-insensitive equality for two emails. */
export function emailsMatch(a: string, b: string): boolean {
    return normalizeEmail(a) === normalizeEmail(b);
}
