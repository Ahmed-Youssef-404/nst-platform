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

// ============================================
// ST ECONOMY
// ============================================
// These string unions mirror the Prisma enums STTransactionType / STReason.
// Kept as plain string types here (not imported from @/generated/prisma)
// so this file has no dependency on the generated client.

export type STTransactionKind = "REWARD" | "PENALTY";

export type STReasonCode =
    | "ATTENDANCE"
    | "SESSION_ENGAGEMENT"
    | "SUBMIT_BEFORE_DEADLINE"
    | "BONUS_TASK_SOLVED"
    | "FIRST_SOLVER"
    | "FINISH_ALL_TASKS"
    | "RUBRIC_GRADING"
    | "WEEKLY_MISSION"
    | "HINT_UNLOCK"
    | "MISSED_SESSION"
    | "TASK_NOT_SUBMITTED"
    | "STORE_PURCHASE"
    | "MANUAL_ADJUSTMENT"
    | "LEVEL_RESET";

// Input to the one central function allowed to move ST balances.
// amount must always be a positive integer - sign comes from `type`.
export interface ApplySTChangeInput {
    studentId: string;
    levelId: string; // the Level the student was in when this happened
    type: STTransactionKind;
    reason: STReasonCode;
    amount: number; // always positive
    relatedEntityId?: string | null; // taskId / hintId / sessionId / storeItemId / etc.
}

export interface STTransactionResult {
    id: string;
    studentId: string;
    levelId: string;
    type: STTransactionKind;
    reason: STReasonCode;
    amount: number;
    relatedEntityId: string | null;
    levelStBalance: number;
    totalStBalance: number;
    createdAt: Date;
}

export type BalanceZone = "normal" | "warning" | "danger";

export interface BalanceStatus {
    levelSt: number;
    totalSt: number;
    zone: BalanceZone;
    warningThreshold: number;
}

// ---- Instructor-driven event inputs ----

export interface RecordAttendanceInput {
    studentId: string;
    sessionId: string;
    status: "PRESENT" | "ABSENT";
    recordedBy: string; // instructorId
}

export interface GradeSubmissionInput {
    submissionId: string;
    understandingScore: number; // 0-2
    approachScore: number; // 0-3
    correctnessScore: number; // 0-3
    implementationScore: number; // 0-2
    instructorComment?: string;
    gradedBy: string; // instructorId
    isFirstSolver?: boolean; // instructor marks this explicitly at grading time
}

export interface RecordSessionEngagementInput {
    studentId: string;
    sessionId: string;
    recordedBy: string; // instructorId
}

// ---- Hint unlock ----

export interface UnlockHintInput {
    studentId: string;
    hintId: string;
}

// ---- Deadline-triggered reconciliation ----

export interface ReconcileStudentInput {
    studentId: string;
}

// ============================================
// SESSION / TASK / HINT MANAGEMENT
// ============================================
// These string unions mirror the Prisma enums TaskType / SubmissionMode.
// Kept as plain string types here (not imported from @/generated/prisma)
// so this file has no dependency on the generated client.

export type TaskTypeCode = "INTERNAL" | "EXTERNAL";

export type SubmissionModeCode = "FILE" | "LINK" | "TEXT";

export interface CreateHintInput {
    content: string;
    cost: number;
}

export interface CreateTaskInput {
    title: string;
    description: string;
    type: TaskTypeCode;
    deadline: Date;
    isBonus: boolean;
    // null = الطالب يختار بحرّية. يجب أن يكون null دائمًا لو type = EXTERNAL.
    allowedSubmissionMode?: SubmissionModeCode | null;
    hints: [CreateHintInput, CreateHintInput, CreateHintInput]; // بالظبط 3
}

export interface CreateSessionInput {
    levelId: string;
    title: string;
    startTime: Date;
    durationMinutes: number;
    recordingLink?: string | null;
    tasks: CreateTaskInput[]; // ممكن تكون []
    createdBy: string; // instructorId (من requireRole/getCurrentUser)
}

export interface SessionWithTasks {
    id: string;
    levelId: string;
    title: string;
    startTime: Date;
    durationMinutes: number;
    recordingLink: string | null;
    tasks: {
        id: string;
        title: string;
        description: string;
        type: TaskTypeCode;
        deadline: Date;
        isBonus: boolean;
        allowedSubmissionMode: SubmissionModeCode | null;
        hints: { id: string; content: string; cost: number; order: number }[];
    }[];
}

// Only the fields that remain editable while a Session is still upcoming.
export interface UpdateSessionInput {
    sessionId: string;
    instructorId: string; // must be assigned to the Session's Group
    title?: string;
    startTime?: Date;
    durationMinutes?: number;
    recordingLink?: string | null;
}

// ============================================
// SUBMISSION
// ============================================

// One of these three must be provided, matching `mode`.
export interface CreateOrUpdateSubmissionInput {
    studentId: string;
    taskId: string;
    mode: SubmissionModeCode;
    fileUrl?: string | null; // Supabase Storage path, set after upload
    externalLink?: string | null;
    textContent?: string | null;
}

export interface SubmissionResult {
    id: string;
    studentId: string;
    taskId: string;
    mode: SubmissionModeCode;
    fileUrl: string | null;
    externalLink: string | null;
    textContent: string | null;
    submittedAt: Date;
    isLocked: boolean;
}

// Allowed file constraints for FILE-mode submissions (Supabase Storage).
export const SUBMISSION_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const SUBMISSION_ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
] as const;

// ============================================
// LEVEL MANAGEMENT
// ============================================

export interface LevelSummary {
    id: string;
    name: string;
    description: string | null;
    levelNumber: number;
    startDate: Date;
}

export interface GroupWithActiveLevel {
    id: string;
    name: string;
    batchId: string;
    activeLevel: LevelSummary | null;
}

export interface BatchWithGroupsAndLevels {
    id: string;
    name: string;
    groups: GroupWithActiveLevel[];
}

// Creates one Level row per Group in groupIds, all sharing the same
// name/description/levelNumber. Each targeted Group's previous active
// Level (if any) is deactivated as part of the same operation.
export interface CreateLevelInput {
    name: string;
    description?: string | null;
    levelNumber: number;
    groupIds: string[]; // at least one
}

export interface CreateLevelResult {
    id: string;
    groupId: string;
    name: string;
    levelNumber: number;
    startDate: Date;
}

// ============================================
// FEEDBACK
// ============================================
// Student -> Telegram only. No DB table by design (client decision) -
// see src/lib/telegram/send-feedback.ts. Not persisted anywhere in the
// app; if the Telegram send fails, the feedback is simply lost and the
// student is told to retry.

export type FeedbackTypeCode = "PROBLEM" | "SUGGESTION" | "COMPLAINT" | "OTHER";

export interface SubmitFeedbackInput {
    type: FeedbackTypeCode;
    message: string;
}