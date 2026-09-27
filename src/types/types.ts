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
//
// Discriminated on `track` so every call site is forced to be explicit
// about which student type it's writing for - INTERMEDIATE (levelId,
// writes LevelStBalance + recomputes Student.avgSt) or BEGINNER (weekId,
// writes Student.beginnerSt directly - one running number, no per-Level
// balance table equivalent). This mirrors the schema's own "levelId xor
// weekId" rule on STTransaction (see schema.prisma comment above
// STTransaction), just enforced at the TypeScript level too so a caller
// can never forget to pick a track.
export type ApplySTChangeInput =
    | {
          track: "INTERMEDIATE";
          studentId: string;
          levelId: string; // the Level the student was in when this happened
          type: STTransactionKind;
          reason: STReasonCode;
          amount: number; // always positive
          relatedEntityId?: string | null; // taskId / hintId / sessionId / storeItemId / etc.
      }
    | {
          track: "BEGINNER";
          studentId: string;
          weekId: string; // the Week the student was in when this happened
          type: STTransactionKind;
          reason: STReasonCode;
          amount: number; // always positive
          relatedEntityId?: string | null;
          wasHalvedDueToLateResource?: boolean; // BEGINNER-only halving flag
      };

export type STTransactionResult =
    | {
          track: "INTERMEDIATE";
          id: string;
          studentId: string;
          levelId: string;
          type: STTransactionKind;
          reason: STReasonCode;
          amount: number;
          relatedEntityId: string | null;
          levelStBalance: number;
          avgStBalance: number;
          createdAt: Date;
      }
    | {
          track: "BEGINNER";
          id: string;
          studentId: string;
          weekId: string;
          type: STTransactionKind;
          reason: STReasonCode;
          amount: number;
          relatedEntityId: string | null;
          beginnerStBalance: number;
          wasHalvedDueToLateResource: boolean;
          createdAt: Date;
      };

export type BalanceZone = "normal" | "warning" | "danger";

export interface BalanceStatus {
    levelSt: number;
    avgSt: number;
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
// WEEK MANAGEMENT (BEGINNER track)
// ============================================
// A Week is an Instructor-defined date range (not a literal calendar week)
// that belongs to a Group of type BEGINNER. Tasks belong to the Week
// directly (no Session). Task.deadline is never entered by the Instructor:
// it is always Week.endDate (set automatically by the server).
// Editing rules (agreed with owner): everything about Tasks/Hints is open
// until Week.startDate, and fully locked after it. After startDate only
// name, requiredFileLabel and playlistUrl can still change.

export interface CreateWeekInput {
    groupId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    playlistUrl: string;
    requiredFileLabel: string;
    createdBy: string; // instructorId (from requireRole)
}

// Before startDate: all fields. After startDate: only name,
// requiredFileLabel, playlistUrl (startDate/endDate are rejected).
export interface UpdateWeekInput {
    weekId: string;
    instructorId: string; // must be assigned to the Week's Group
    name?: string;
    startDate?: Date;
    endDate?: Date;
    playlistUrl?: string;
    requiredFileLabel?: string;
}

// A BEGINNER Task's rubric fields are free-form (unlike INTERMEDIATE's
// fixed 4 columns) and are defined by the Instructor at Task-creation
// time, not at grading time. Unlimited field count; maxPoints across all
// fields of one Task MUST sum to exactly 15 (validated in code, not a DB
// constraint). Same fields apply to every student graded on that Task.
// Editable any number of times before Week.startDate, exactly like every
// other Task field; fully locked afterwards, same as the rest of the Task.
export interface TaskRubricFieldInput {
    fieldName: string;
    maxPoints: number;
}

// 0-3 hints per BEGINNER Task (Instructor sets each cost).
export interface WeekTaskInput {
    title: string;
    description: string;
    type: TaskTypeCode;
    isBonus: boolean;
    allowedSubmissionMode?: SubmissionModeCode | null;
    hints: CreateHintInput[]; // 0-3
    rubricFields: TaskRubricFieldInput[]; // maxPoints must sum to exactly 15
}

export interface AddTaskToWeekInput extends WeekTaskInput {
    weekId: string;
    instructorId: string;
}

export interface UpdateWeekTaskInput extends WeekTaskInput {
    taskId: string;
    instructorId: string;
}

export interface DeleteWeekTaskInput {
    taskId: string;
    instructorId: string;
}

export interface WeekWithTasks {
    id: string;
    groupId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    playlistUrl: string;
    requiredFileLabel: string;
    tasks: {
        id: string;
        title: string;
        description: string;
        type: TaskTypeCode;
        deadline: Date;
        isBonus: boolean;
        allowedSubmissionMode: SubmissionModeCode | null;
        hints: { id: string; content: string; cost: number; order: number }[];
        rubricFields: {
            id: string;
            fieldName: string;
            maxPoints: number;
            order: number;
        }[];
    }[];
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
// ============================================
// WEEK SUBMISSIONS (BEGINNER track - Student side)
// ============================================
// A Student works inside a Week (startDate <= now < endDate):
//   - saves a DRAFT per Task any number of times (Submission.status = DRAFT)
//   - uploads the Week's ONE required file (WeekResourceSubmission)
//   - can lock the WHOLE Week manually, but only after the file exists.
//     Locking sends every Task that has a DRAFT (-> SUBMITTED); Tasks with
//     no DRAFT count as not submitted (no grade). No edits afterwards.
// If the Student never locks, DRAFTs are converted to SUBMITTED lazily by
// the Instructor's grading flow once Week.endDate has passed (no cron).

export type SubmissionStatusCode = "DRAFT" | "SUBMITTED";
export type WeekResourceStatusCode = "PENDING" | "ACCEPTED" | "REJECTED";

export interface SaveDraftSubmissionInput {
    studentId: string;
    taskId: string;
    mode: SubmissionModeCode;
    fileUrl?: string | null; // Supabase Storage path, set after upload
    externalLink?: string | null;
    textContent?: string | null;
}

export interface DraftSubmissionResult {
    id: string;
    studentId: string;
    taskId: string;
    mode: SubmissionModeCode;
    fileUrl: string | null;
    externalLink: string | null;
    textContent: string | null;
    status: SubmissionStatusCode;
    submittedAt: Date;
}

export interface UploadWeekResourceInput {
    studentId: string;
    weekId: string;
    fileUrl: string; // Supabase Storage path, set after upload
}

export interface WeekResourceResult {
    id: string;
    studentId: string;
    weekId: string;
    fileUrl: string | null;
    status: WeekResourceStatusCode;
    submittedAt: Date | null;
    lockedAt: Date | null;
}

export interface LockWeekInput {
    studentId: string;
    weekId: string;
}

export interface LockWeekResult {
    weekId: string;
    lockedAt: Date;
    submittedTaskIds: string[]; // Tasks whose DRAFT was sent (-> SUBMITTED)
    skippedTaskIds: string[]; // INTERNAL Tasks with no DRAFT (won't be graded)
}

// ============================================
// WEEK GRADING (BEGINNER track - Instructor side)
// ============================================
// Draft/finalize model: TaskGrade rows are written/edited freely
// (finalizedAt stays null) via saveDraftGrade. Nothing is scored or paid
// out until the Instructor's single finalizeWeekGrading call for a given
// student+Week, which atomically finalizes every TaskGrade in the batch
// AND writes every resulting STTransaction component. Before that, draft
// grading has zero ST effect.
//
// Per-Task scoring (identical formula for BEGINNER and INTERMEDIATE):
//   rubric total (sum of awarded TaskGradeField points, max 15)
//   + 5 if Task.isBonus
//   + 5 if this student was the first manual-lock solver for the Task
//   + 10 per Week if every Task in the Week has a submission
//   - 10 if a Task has no submission at all, or the Instructor explicitly
//     marks the student's solution invalid/unsubmitted (no rubric points
//     in that case)
// The whole positive sum (rubric+bonus+first-solver+finish-all) is halved
// if the Week's required file was not ACCEPTED at finalize time; the -10
// penalty is never halved.

export interface SaveDraftGradeInput {
    submissionId: string;
    gradedBy: string; // instructorId
    fieldScores: { rubricFieldId: string; awardedPoints: number }[]; // each awardedPoints <= that field's maxPoints
    // Explicit toggle: true = instructor is marking this student's
    // solution invalid/unsubmitted (EXTERNAL "didn't submit on the
    // external platform" or INTERNAL "present but rejected"). When true,
    // fieldScores is ignored (no rubric points) and this Task counts
    // toward the -10 penalty at finalize time.
    markedInvalid: boolean;
}

export interface DraftGradeResult {
    id: string; // TaskGrade id
    submissionId: string;
    gradedBy: string;
    finalizedAt: null;
    fieldScores: { rubricFieldId: string; awardedPoints: number }[];
    markedInvalid: boolean;
}

// Read-only suggestion, never auto-applied - the Instructor must
// explicitly confirm via finalizeWeekGrading's `firstSolverTaskIds`.
export interface FirstSolverSuggestionInput {
    weekId: string;
}

export interface FirstSolverSuggestion {
    taskId: string;
    taskTitle: string;
    // studentId of the earliest manual-lock submitter for this Task, or
    // null if no student has manually locked with a submission for it yet
    // (auto-submitted-at-endDate submissions are never eligible).
    suggestedStudentId: string | null;
    suggestedStudentName: string | null;
    submittedAt: Date | null;
}

export interface FinalizeWeekGradingInput {
    studentId: string;
    weekId: string;
    gradedBy: string; // instructorId
    // Instructor's explicit confirmation of which Tasks this student
    // should receive the +5 first-solver bonus for (from
    // FirstSolverSuggestion, after review - never auto-applied).
    firstSolverTaskIds: string[];
}

export interface FinalizeWeekGradingResult {
    studentId: string;
    weekId: string;
    finalizedAt: Date;
    wasHalvedDueToLateResource: boolean;
    taskResults: {
        taskId: string;
        rubricPoints: number | null; // null if markedInvalid/not submitted
        bonusPoints: number;
        firstSolverPoints: number;
        penaltyPoints: number; // 0 or 10, sign applied separately
    }[];
    finishAllBonusApplied: boolean;
    totalStDelta: number; // net ST change actually applied (post-halving)
    beginnerStBalance: number; // Student.beginnerSt after this finalize
}