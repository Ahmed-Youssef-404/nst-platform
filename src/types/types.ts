// src/types/types.ts
// Centralized type definitions for the app

export type UserRole = "super_admin" | "instructor" | "student";

export interface CurrentUser {
    id: string;
    email: string;
    role: UserRole;
}

export interface CreateInstructorInput {
    email: string;
    password: string;
    name: string;
}

export interface CreateStudentInput {
    id: string; // Student's login code - also used as their password (e.g. "NST-1001")
    email: string;
    name: string;
    groupId: string;
}