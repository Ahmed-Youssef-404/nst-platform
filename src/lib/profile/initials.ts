// src/lib/profile/initials.ts
// Initials fallback for the profile avatar (no avatar image exists in the
// data model, so initials are the only avatar). Same rule the sidebars use.

export function getInitials(name: string, fallback: string): string {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || fallback
    );
}
