// src/lib/format-date.ts
// Centralized date formatting so every environment (localhost, Vercel, any
// server timezone) renders dates identically. Never rely on the runtime's
// default locale/timezone (e.g. `date.toLocaleString(undefined, ...)`),
// since that changes based on where the code executes.

const APP_LOCALE = "en-GB"; // e.g. "25 Jul 2026, 9:00 PM" style
const APP_TIMEZONE = "Africa/Cairo";

export function formatDateTime(date: Date): string {
    return date.toLocaleString(APP_LOCALE, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: APP_TIMEZONE,
        hour12: true
    });
}