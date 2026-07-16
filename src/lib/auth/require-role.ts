// src/lib/auth/require-role.ts
// Guard function used at the top of protected Server Actions
// Throws if the current user doesn't have the required role

import { UserRole } from "@/types/types";

import { getCurrentUser } from "./get-current-user";

export async function requireRole(allowedRoles: UserRole[]) {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Not authenticated. Please log in.");
    }

    if (!allowedRoles.includes(user.role)) {
        throw new Error(
            `Access denied. This action requires one of: ${allowedRoles.join(", ")}`
        );
    }

    return user;
}