// src/lib/weeks/validate-drive-url.ts
//
// Validates and normalizes Google Drive / Google Docs sharing URLs for the
// Beginner track weekly resource deliverable.
//
// Rules:
// 1. Must be a well-formed HTTPS URL.
// 2. Reject unsafe schemes (javascript:, data:, file:, etc.) and plain http.
// 3. Allowed hostnames: drive.google.com and docs.google.com (and official subdomains).
// 4. Reject credential injection (no username or password in URL).
// 5. Must have a recognized resource path (file, folder, doc, spreadsheet, slide, or open?id=...).
// 6. Return a normalized URL string.

export interface DriveUrlValidationResult {
    valid: boolean;
    normalizedUrl?: string;
    error?: string;
}

const ALLOWED_HOSTS = new Set([
    "drive.google.com",
    "docs.google.com",
]);

export function validateGoogleDriveUrl(rawUrl: string): DriveUrlValidationResult {
    const trimmed = rawUrl?.trim();
    if (!trimmed) {
        return {
            valid: false,
            error: "Google Drive link cannot be empty.",
        };
    }

    let parsed: URL;
    try {
        parsed = new URL(trimmed);
    } catch {
        return {
            valid: false,
            error: "The provided link is not a valid URL.",
        };
    }

    // Scheme must be strictly HTTPS
    if (parsed.protocol !== "https:") {
        return {
            valid: false,
            error: "Google Drive link must use a secure HTTPS connection.",
        };
    }

    // No credentials allowed in URL
    if (parsed.username || parsed.password) {
        return {
            valid: false,
            error: "Google Drive link cannot contain embedded credentials.",
        };
    }

    // Standard port only (no custom port allowed)
    if (parsed.port && parsed.port !== "443") {
        return {
            valid: false,
            error: "Google Drive link cannot specify an alternative port.",
        };
    }

    // Check hostname
    const hostname = parsed.hostname.toLowerCase();
    const isAllowedHost =
        ALLOWED_HOSTS.has(hostname) ||
        hostname.endsWith(".drive.google.com") ||
        hostname.endsWith(".docs.google.com");

    if (!isAllowedHost) {
        return {
            valid: false,
            error: "Link must be from drive.google.com or docs.google.com.",
        };
    }

    // Path check: must point to a specific file, document, or folder
    const pathname = parsed.pathname.toLowerCase();
    const hasSearchId = parsed.searchParams.has("id");

    const isValidDrivePath =
        pathname.startsWith("/file/d/") ||
        pathname.startsWith("/drive/") ||
        pathname.startsWith("/open") ||
        pathname.startsWith("/document/d/") ||
        pathname.startsWith("/spreadsheets/d/") ||
        pathname.startsWith("/presentation/d/") ||
        pathname.startsWith("/forms/d/");

    if (!isValidDrivePath && !hasSearchId) {
        return {
            valid: false,
            error: "Link must point to a specific Google Drive file, folder, or document.",
        };
    }

    return {
        valid: true,
        normalizedUrl: parsed.toString(),
    };
}
