// src/lib/profile/validation.ts
// Pure validators shared by the client forms (instant feedback) and the
// Server Actions (the actual enforcement). Never import server-only code
// here - this file is bundled into client components too.

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 80;

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt (used by Supabase Auth) silently ignores everything past 72 bytes
export const PASSWORD_MAX_LENGTH = 72;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

// Collapses repeated whitespace so "  Ahmed   Youssef " is stored as
// "Ahmed Youssef".
export function normalizeName(raw: string): string {
    return raw.trim().replace(/\s+/g, " ");
}

export function validateName(raw: string): string | null {
    const name = normalizeName(raw);

    if (name.length < NAME_MIN_LENGTH) {
        return `Name must be at least ${NAME_MIN_LENGTH} characters.`;
    }
    if (name.length > NAME_MAX_LENGTH) {
        return `Name must be at most ${NAME_MAX_LENGTH} characters.`;
    }
    return null;
}

export type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export interface PasswordChangeInput {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export function validatePasswordChange(
    input: PasswordChangeInput
): FieldErrors<PasswordField> {
    const errors: FieldErrors<PasswordField> = {};

    if (!input.currentPassword) {
        errors.currentPassword = "Enter your current password.";
    }

    if (input.newPassword.length < PASSWORD_MIN_LENGTH) {
        errors.newPassword = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    } else if (input.newPassword.length > PASSWORD_MAX_LENGTH) {
        errors.newPassword = `Use at most ${PASSWORD_MAX_LENGTH} characters.`;
    } else if (input.newPassword === input.currentPassword) {
        errors.newPassword = "Your new password must be different from the current one.";
    }

    if (!errors.newPassword && input.confirmPassword !== input.newPassword) {
        errors.confirmPassword = "Passwords don't match.";
    }

    return errors;
}
