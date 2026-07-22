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

// ============================================
// BATCH / GROUP MANAGEMENT
// ============================================

export interface InstructorOption {
    id: string;
    name: string;
    email: string;
}

export interface GroupWithInstructors {
    id: string;
    name: string;
    batchId: string;
    studentCount: number;
    instructors: InstructorOption[];
}

export interface BatchWithGroups {
    id: string;
    name: string;
    groups: GroupWithInstructors[];
}

export interface CreateBatchInput {
    name: string;
}

export interface UpdateBatchInput {
    id: string;
    name: string;
}

export interface CreateGroupInput {
    name: string;
    batchId: string; // fixed at creation time, never changes afterwards
}

export interface UpdateGroupInput {
    id: string;
    name: string; // only the name is editable - batchId is immutable
}

export interface AssignInstructorInput {
    instructorId: string;
    groupId: string;
}

export interface UnassignInstructorInput {
    instructorId: string;
    groupId: string;
}