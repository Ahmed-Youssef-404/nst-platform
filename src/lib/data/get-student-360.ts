// src/lib/data/get-student-360.ts
// Authoritative data fetcher for the Student 360° Profile.
// Surfaces comprehensive student intelligence across academic progress,
// ST transactions, manual adjustments, attendance, feedback, and rankings.
//
// Role-safe:
//   - SuperAdmin receives full administrative intelligence.
//   - Instructor access is strictly validated against InstructorGroup assignments.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getBalanceStatus } from "@/lib/st-economy/balance-status";
import type { StudentAvatarConfig } from "@/types/avatar";
import type { BalanceStatus, STReasonCode, STTransactionKind } from "@/types/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ============================================================
// Types for Student 360 Profile
// ============================================================

export interface Student360Overview {
    id: string; // student code
    name: string;
    email: string;
    createdAt: Date;
    avatarConfig: StudentAvatarConfig | null;

    group: {
        id: string;
        name: string;
        type: "BEGINNER" | "INTERMEDIATE";
        batchId: string;
        batchName: string;
    };

    academicContext: {
        currentLevelName: string | null;
        currentLevelNumber: number | null;
        currentWeekName: string | null;
        totalLevelsOrWeeks: number;
    };

    balance: {
        authoritativeBalance: number;
        avgSt: number;
        beginnerSt: number | null;
        currentLevelSt: number | null;
        balanceStatus: BalanceStatus;
        track: "BEGINNER" | "INTERMEDIATE";
    };

    ranking: {
        currentRank: number;
        totalPeers: number;
        metricLabel: string;
        metricScore: number;
        rankingScope: string;
        peers: Array<{
            id: string;
            name: string;
            rank: number;
            score: number;
            isCurrentStudent: boolean;
            avatarConfig: StudentAvatarConfig | null;
        }>;
    };

    progressSummary: {
        totalTasksAvailable: number;
        totalTasksSubmitted: number;
        totalTasksGraded: number;
        completionPercentage: number;
    };

    attendanceSummary: {
        supported: boolean;
        attendedSessions: number;
        missedSessions: number;
        totalRecordedSessions: number;
        attendancePercentage: number;
        feedbackCount: number;
        avgFeedbackRating: number | null;
    };
}

export interface Student360STTransaction {
    id: string;
    type: STTransactionKind;
    reason: STReasonCode;
    amount: number;
    createdAt: Date;
    resultingBalanceSnapshot: number | null;
    levelName: string | null;
    levelNumber: number | null;
    weekName: string | null;
    relatedEntityId: string | null;
    relatedEntityName: string | null;
    relatedEntityType: "TASK" | "SESSION" | "HINT" | "STORE_ITEM" | "WEEK" | "LEVEL" | "UNKNOWN" | null;
    actorId: string | null;
    actorName: string | null;
    actorEmail: string | null;
    note: string | null;
    wasHalvedDueToLateResource: boolean;
}

export interface Student360InstructorAdjustment {
    id: string;
    transactionId: string;
    direction: "ADD" | "DEDUCT";
    amount: number;
    createdAt: Date;
    actorId: string;
    actorName: string;
    actorEmail: string;
    note: string | null;
    groupName: string;
    resultingBalance: number | null;
}

export interface Student360TaskProgress {
    taskId: string;
    taskTitle: string;
    taskType: "INTERNAL" | "EXTERNAL";
    isBonus: boolean;
    deadline: Date;
    allowedSubmissionMode: string | null;
    sessionOrWeekName: string;
    sessionStartTime?: Date | null;

    submission: {
        id: string;
        mode: string;
        status: "DRAFT" | "SUBMITTED";
        fileUrl: string | null;
        externalLink: string | null;
        textContent: string | null;
        submittedAt: Date;
        isLocked: boolean;

        // Intermediate grading
        understandingScore?: number | null;
        approachScore?: number | null;
        correctnessScore?: number | null;
        implementationScore?: number | null;
        instructorComment?: string | null;
        gradedAt?: Date | null;
        gradedByName?: string | null;

        // Beginner grading (TaskGrade)
        taskGradeId?: string | null;
        totalPoints?: number | null;
        finalizedAt?: Date | null;
        markedInvalid?: boolean;
        fieldScores?: Array<{
            id: string;
            fieldName: string;
            awardedPoints: number;
            maxPoints: number;
        }>;
    } | null;

    hints: {
        totalHintsCount: number;
        unlockedHintsCount: number;
        totalCostPaid: number;
    };
}

export interface Student360WeekResourceProgress {
    weekId: string;
    weekName: string;
    requiredFileLabel: string;
    startDate: Date;
    endDate: Date;
    resourceSubmission: {
        id: string;
        fileUrl: string | null;
        status: "PENDING" | "ACCEPTED" | "REJECTED";
        submittedAt: Date | null;
        lockedAt: Date | null;
    } | null;
}

export interface Student360AttendanceRecord {
    id: string;
    sessionId: string;
    sessionTitle: string;
    sessionStartTime: Date;
    levelName: string;
    status: "PRESENT" | "ABSENT";
    recordedByName: string | null;
    recordedAt: Date;
    feedback: {
        rating: number;
        comment: string | null;
        createdAt: Date;
    } | null;
}

export interface Student360TimelineEvent {
    id: string;
    type:
        | "TASK_SUBMISSION"
        | "GRADE_FINALIZED"
        | "ST_REWARD"
        | "ST_PENALTY"
        | "INSTRUCTOR_ADJUSTMENT"
        | "ATTENDANCE"
        | "HINT_UNLOCK"
        | "STORE_PURCHASE"
        | "WEEK_RESOURCE";
    title: string;
    description: string;
    timestamp: Date;
    badgeLabel?: string;
    badgeVariant?: "gold" | "success" | "danger" | "info" | "neutral";
    metadata?: Record<string, string | number | boolean | null>;
}

export interface Student360StorePurchase {
    id: string;
    itemId: string;
    itemName: string;
    cost: number;
    purchasedAt: Date;
    imageUrl: string | null;
    isEquipped: boolean;
}

export interface Student360ProfileData {
    overview: Student360Overview;
    transactions: Student360STTransaction[];
    instructorAdjustments: Student360InstructorAdjustment[];
    taskProgress: Student360TaskProgress[];
    weekResources?: Student360WeekResourceProgress[];
    attendanceRecords: Student360AttendanceRecord[];
    timeline: Student360TimelineEvent[];
    storePurchases: Student360StorePurchase[];
}

// ============================================================
// Helper denseRank
// ============================================================

function denseRank<T>(
    items: T[],
    getValue: (item: T) => number
): { item: T; rank: number }[] {
    const sorted = [...items].sort((a, b) => getValue(b) - getValue(a));
    let rank = 0;
    let previousValue: number | null = null;

    return sorted.map((item) => {
        const value = getValue(item);
        if (previousValue === null || value !== previousValue) {
            rank += 1;
            previousValue = value;
        }
        return { item, rank };
    });
}

// ============================================================
// Main Fetcher
// ============================================================

export async function getStudent360(
    studentId: string,
    options?: {
        instructorId?: string; // If provided, strictly enforces instructor assignment
    }
): Promise<Student360ProfileData | null> {
    // 1. Fetch Student with primary relations
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            group: {
                include: {
                    batch: true,
                    levels: {
                        orderBy: { levelNumber: "asc" },
                        include: {
                            sessions: {
                                orderBy: { startTime: "asc" },
                            },
                        },
                    },
                    weeks: {
                        orderBy: { startDate: "asc" },
                    },
                },
            },
            levelStBalances: {
                include: {
                    level: true,
                },
            },
            sessionFeedbacks: {
                include: {
                    session: true,
                },
            },
            storeInventory: {
                include: {
                    storeItem: true,
                },
                orderBy: { purchasedAt: "desc" },
            },
        },
    });

    if (!student) {
        return null;
    }

    // 2. Instructor Authorization Check
    if (options?.instructorId) {
        const assignment = await prisma.instructorGroup.findUnique({
            where: {
                instructorId_groupId: {
                    instructorId: options.instructorId,
                    groupId: student.groupId,
                },
            },
        });

        if (!assignment) {
            // Instructor does not have access to this student's group
            return null;
        }
    }

    const group = student.group;
    const isBeginner = group.type === "BEGINNER";
    const avatarConfig = (student.avatarConfig as unknown as StudentAvatarConfig) ?? null;

    // 3. Authoritative Balance
    let authoritativeBalance = 50;
    let currentLevelSt: number | null = null;
    let currentLevelName: string | null = null;
    let currentLevelNumber: number | null = null;
    let currentWeekName: string | null = null;

    if (isBeginner) {
        authoritativeBalance = student.beginnerSt ?? 50;
        const now = new Date();
        const activeWeek =
            group.weeks.find((w) => now >= w.startDate && now <= w.endDate) ??
            group.weeks[group.weeks.length - 1];
        currentWeekName = activeWeek?.name ?? null;
    } else {
        const activeLevel = group.levels.find((l) => l.isActive);
        if (activeLevel) {
            currentLevelName = activeLevel.name;
            currentLevelNumber = activeLevel.levelNumber;
            const balanceRow = student.levelStBalances.find((b) => b.levelId === activeLevel.id);
            currentLevelSt = balanceRow ? balanceRow.balance : 50;
            authoritativeBalance = currentLevelSt;
        } else {
            authoritativeBalance = student.avgSt;
        }
    }

    const balanceStatus = getBalanceStatus(
        authoritativeBalance,
        student.avgSt
    );

    // 4. Ranking
    let currentRank = 1;
    let totalPeers = 1;
    let metricLabel = isBeginner ? "Beginner ST Balance" : "Active Level ST Balance";
    let metricScore = authoritativeBalance;
    let rankingScope = `${group.name} (${isBeginner ? "Beginner Track" : "Intermediate Track"})`;
    let peerRankings: Student360Overview["ranking"]["peers"] = [];

    const groupStudents = await prisma.student.findMany({
        where: { groupId: group.id },
        select: {
            id: true,
            name: true,
            avgSt: true,
            beginnerSt: true,
            avatarConfig: true,
            levelStBalances: {
                where: { level: { isActive: true } },
                select: { balance: true },
            },
        },
    });

    totalPeers = groupStudents.length;

    if (isBeginner) {
        const ranked = denseRank(groupStudents, (s) => s.beginnerSt ?? 50);
        currentRank = ranked.find((r) => r.item.id === student.id)?.rank ?? 1;
        peerRankings = ranked.map((r) => ({
            id: r.item.id,
            name: r.item.name,
            rank: r.rank,
            score: r.item.beginnerSt ?? 50,
            isCurrentStudent: r.item.id === student.id,
            avatarConfig: (r.item.avatarConfig as unknown as StudentAvatarConfig) ?? null,
        }));
    } else {
        const ranked = denseRank(
            groupStudents,
            (s) => s.levelStBalances[0]?.balance ?? 50
        );
        currentRank = ranked.find((r) => r.item.id === student.id)?.rank ?? 1;
        peerRankings = ranked.map((r) => ({
            id: r.item.id,
            name: r.item.name,
            rank: r.rank,
            score: r.item.levelStBalances[0]?.balance ?? 50,
            isCurrentStudent: r.item.id === student.id,
            avatarConfig: (r.item.avatarConfig as unknown as StudentAvatarConfig) ?? null,
        }));
    }

    // 5. ST Transactions & Entity Resolution
    const rawTransactions = await prisma.sTTransaction.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
    });

    const actorIds = Array.from(
        new Set(rawTransactions.map((t) => t.actorId).filter(Boolean) as string[])
    );
    const relatedEntityIds = Array.from(
        new Set(rawTransactions.map((t) => t.relatedEntityId).filter(Boolean) as string[])
    );

    const [instructors, relatedTasks, relatedSessions, relatedHints, relatedStoreItems, relatedWeeks, relatedLevels] =
        await Promise.all([
            actorIds.length > 0
                ? prisma.instructor.findMany({
                      where: { id: { in: actorIds } },
                      select: { id: true, name: true, email: true },
                  })
                : [],
            relatedEntityIds.length > 0
                ? prisma.task.findMany({
                      where: { id: { in: relatedEntityIds } },
                      select: { id: true, title: true },
                  })
                : [],
            relatedEntityIds.length > 0
                ? prisma.session.findMany({
                      where: { id: { in: relatedEntityIds } },
                      select: { id: true, title: true },
                  })
                : [],
            relatedEntityIds.length > 0
                ? prisma.hint.findMany({
                      where: { id: { in: relatedEntityIds } },
                      select: { id: true, order: true, task: { select: { title: true } } },
                  })
                : [],
            relatedEntityIds.length > 0
                ? prisma.storeItem.findMany({
                      where: { id: { in: relatedEntityIds } },
                      select: { id: true, name: true },
                  })
                : [],
            relatedEntityIds.length > 0
                ? prisma.week.findMany({
                      where: { id: { in: relatedEntityIds } },
                      select: { id: true, name: true },
                  })
                : [],
            relatedEntityIds.length > 0
                ? prisma.level.findMany({
                      where: { id: { in: relatedEntityIds } },
                      select: { id: true, name: true, levelNumber: true },
                  })
                : [],
        ]);

    const instructorMap = new Map(instructors.map((i) => [i.id, i]));
    const taskMap = new Map(relatedTasks.map((t) => [t.id, t.title]));
    const sessionMap = new Map(relatedSessions.map((s) => [s.id, s.title]));
    const hintMap = new Map(
        relatedHints.map((h) => [h.id, `Hint #${h.order} (${h.task.title})`])
    );
    const storeItemMap = new Map(relatedStoreItems.map((s) => [s.id, s.name]));
    const weekMap = new Map(
        [...group.weeks, ...relatedWeeks].map((w) => [w.id, w.name])
    );
    const levelMap = new Map(
        [...group.levels, ...relatedLevels].map((l) => [l.id, l])
    );

    const transactions: Student360STTransaction[] = rawTransactions.map((tx) => {
        let relatedEntityName: string | null = null;
        let relatedEntityType: Student360STTransaction["relatedEntityType"] = null;

        if (tx.relatedEntityId) {
            if (taskMap.has(tx.relatedEntityId)) {
                relatedEntityName = taskMap.get(tx.relatedEntityId)!;
                relatedEntityType = "TASK";
            } else if (sessionMap.has(tx.relatedEntityId)) {
                relatedEntityName = sessionMap.get(tx.relatedEntityId)!;
                relatedEntityType = "SESSION";
            } else if (hintMap.has(tx.relatedEntityId)) {
                relatedEntityName = hintMap.get(tx.relatedEntityId)!;
                relatedEntityType = "HINT";
            } else if (storeItemMap.has(tx.relatedEntityId)) {
                relatedEntityName = storeItemMap.get(tx.relatedEntityId)!;
                relatedEntityType = "STORE_ITEM";
            } else if (weekMap.has(tx.relatedEntityId)) {
                relatedEntityName = weekMap.get(tx.relatedEntityId)!;
                relatedEntityType = "WEEK";
            } else if (levelMap.has(tx.relatedEntityId)) {
                const lvl = levelMap.get(tx.relatedEntityId)!;
                relatedEntityName = `Level ${lvl.levelNumber}: ${lvl.name}`;
                relatedEntityType = "LEVEL";
            } else {
                relatedEntityName = tx.relatedEntityId;
                relatedEntityType = "UNKNOWN";
            }
        }

        const actor = tx.actorId ? instructorMap.get(tx.actorId) : null;
        const levelObj = tx.levelId ? levelMap.get(tx.levelId) : null;
        const weekName = tx.weekId ? weekMap.get(tx.weekId) ?? null : null;

        const resultingBalanceSnapshot = isBeginner
            ? tx.beginnerStBalance ?? null
            : tx.levelStBalance ?? tx.avgStBalance ?? null;

        return {
            id: tx.id,
            type: tx.type,
            reason: tx.reason,
            amount: tx.amount,
            createdAt: tx.createdAt,
            resultingBalanceSnapshot,
            levelName: levelObj ? levelObj.name : null,
            levelNumber: levelObj ? levelObj.levelNumber : null,
            weekName,
            relatedEntityId: tx.relatedEntityId,
            relatedEntityName,
            relatedEntityType,
            actorId: tx.actorId,
            actorName: actor?.name ?? null,
            actorEmail: actor?.email ?? null,
            note: tx.note,
            wasHalvedDueToLateResource: tx.wasHalvedDueToLateResource,
        };
    });

    // 6. Dedicated Instructor Adjustments
    const instructorAdjustments: Student360InstructorAdjustment[] = transactions
        .filter((tx) => tx.reason === "INSTRUCTOR_ADJUSTMENT" && tx.actorId)
        .map((tx) => ({
            id: tx.id,
            transactionId: tx.id,
            direction: tx.type === "REWARD" ? "ADD" : "DEDUCT",
            amount: tx.amount,
            createdAt: tx.createdAt,
            actorId: tx.actorId!,
            actorName: tx.actorName || "Instructor",
            actorEmail: tx.actorEmail || "",
            note: tx.note,
            groupName: group.name,
            resultingBalance: tx.resultingBalanceSnapshot,
        }));

    // 7. Academic Progress & Grading
    let taskProgress: Student360TaskProgress[] = [];
    let weekResources: Student360WeekResourceProgress[] = [];

    // Query grading instructors to resolve names
    const allGraders = await prisma.instructor.findMany({
        select: { id: true, name: true },
    });
    const graderMap = new Map(allGraders.map((g) => [g.id, g.name]));

    if (isBeginner) {
        // Query beginner tasks
        const beginnerWeeksWithTasks = await prisma.week.findMany({
            where: { groupId: group.id },
            orderBy: { startDate: "asc" },
            include: {
                resourceSubmissions: {
                    where: { studentId },
                },
                tasks: {
                    include: {
                        rubricFields: {
                            orderBy: { order: "asc" },
                        },
                        submissions: {
                            where: { studentId },
                            include: {
                                taskGrade: {
                                    include: {
                                        fieldScores: {
                                            include: { rubricField: true },
                                        },
                                    },
                                },
                            },
                        },
                        hints: {
                            include: {
                                hintUnlocks: { where: { studentId } },
                            },
                        },
                    },
                },
            },
        });

        weekResources = beginnerWeeksWithTasks.map((w) => {
            const res = w.resourceSubmissions[0] ?? null;
            return {
                weekId: w.id,
                weekName: w.name,
                requiredFileLabel: w.requiredFileLabel,
                startDate: w.startDate,
                endDate: w.endDate,
                resourceSubmission: res
                    ? {
                          id: res.id,
                          fileUrl: res.fileUrl,
                          status: res.status,
                          submittedAt: res.submittedAt,
                          lockedAt: res.lockedAt,
                      }
                    : null,
            };
        });

        for (const week of beginnerWeeksWithTasks) {
            for (const task of week.tasks) {
                const sub = task.submissions[0] ?? null;
                const grade = sub?.taskGrade ?? null;
                const hintsUnlocked = task.hints.filter((h) => h.hintUnlocks.length > 0);
                const totalCostPaid = hintsUnlocked.reduce(
                    (acc, h) => acc + (h.hintUnlocks[0]?.costPaid ?? 0),
                    0
                );

                taskProgress.push({
                    taskId: task.id,
                    taskTitle: task.title,
                    taskType: task.type,
                    isBonus: task.isBonus,
                    deadline: task.deadline,
                    allowedSubmissionMode: task.allowedSubmissionMode,
                    sessionOrWeekName: week.name,

                    submission: sub
                        ? {
                              id: sub.id,
                              mode: sub.mode,
                              status: sub.status,
                              fileUrl: sub.fileUrl,
                              externalLink: sub.externalLink,
                              textContent: sub.textContent,
                              submittedAt: sub.submittedAt,
                              isLocked: sub.isLocked,

                              taskGradeId: grade?.id ?? null,
                              totalPoints: grade?.totalPoints ?? null,
                              finalizedAt: grade?.finalizedAt ?? null,
                              markedInvalid: grade?.markedInvalid ?? false,
                              gradedByName: grade ? graderMap.get(grade.gradedBy) || "Instructor" : null,
                              fieldScores:
                                  grade?.fieldScores?.map((fs) => ({
                                      id: fs.id,
                                      fieldName: fs.rubricField.fieldName,
                                      awardedPoints: fs.awardedPoints,
                                      maxPoints: fs.rubricField.maxPoints,
                                  })) ?? [],
                          }
                        : null,

                    hints: {
                        totalHintsCount: task.hints.length,
                        unlockedHintsCount: hintsUnlocked.length,
                        totalCostPaid,
                    },
                });
            }
        }
    } else {
        // Query intermediate tasks
        const intermediateLevelsWithTasks = await prisma.level.findMany({
            where: { groupId: group.id },
            orderBy: { levelNumber: "asc" },
            include: {
                sessions: {
                    orderBy: { startTime: "asc" },
                    include: {
                        tasks: {
                            include: {
                                submissions: {
                                    where: { studentId },
                                },
                                hints: {
                                    include: {
                                        hintUnlocks: { where: { studentId } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        for (const level of intermediateLevelsWithTasks) {
            for (const session of level.sessions) {
                for (const task of session.tasks) {
                    const sub = task.submissions[0] ?? null;
                    const hintsUnlocked = task.hints.filter((h) => h.hintUnlocks.length > 0);
                    const totalCostPaid = hintsUnlocked.reduce(
                        (acc, h) => acc + (h.hintUnlocks[0]?.costPaid ?? 0),
                        0
                    );

                    taskProgress.push({
                        taskId: task.id,
                        taskTitle: task.title,
                        taskType: task.type,
                        isBonus: task.isBonus,
                        deadline: task.deadline,
                        allowedSubmissionMode: task.allowedSubmissionMode,
                        sessionOrWeekName: `${session.title} (Level ${level.levelNumber})`,
                        sessionStartTime: session.startTime,

                        submission: sub
                            ? {
                                  id: sub.id,
                                  mode: sub.mode,
                                  status: "SUBMITTED",
                                  fileUrl: sub.fileUrl,
                                  externalLink: sub.externalLink,
                                  textContent: sub.textContent,
                                  submittedAt: sub.submittedAt,
                                  isLocked: sub.isLocked,

                                  understandingScore: sub.understandingScore,
                                  approachScore: sub.approachScore,
                                  correctnessScore: sub.correctnessScore,
                                  implementationScore: sub.implementationScore,
                                  instructorComment: sub.instructorComment,
                                  gradedAt: sub.gradedAt,
                                  gradedByName: sub.gradedBy ? graderMap.get(sub.gradedBy) || "Instructor" : null,
                              }
                            : null,

                        hints: {
                            totalHintsCount: task.hints.length,
                            unlockedHintsCount: hintsUnlocked.length,
                            totalCostPaid,
                        },
                    });
                }
            }
        }
    }

    // Progress summary metrics
    const totalTasksAvailable = taskProgress.length;
    const totalTasksSubmitted = taskProgress.filter(
        (t) => t.submission && (isBeginner ? t.submission.status === "SUBMITTED" : true)
    ).length;
    const totalTasksGraded = taskProgress.filter((t) => {
        if (!t.submission) return false;
        if (isBeginner) return t.submission.finalizedAt !== null && t.submission.finalizedAt !== undefined;
        return t.submission.gradedAt !== null && t.submission.gradedAt !== undefined;
    }).length;

    const completionPercentage =
        totalTasksAvailable > 0
            ? Math.round((totalTasksSubmitted / totalTasksAvailable) * 100)
            : 0;

    // 8. Attendance & Session History (Intermediate)
    let attendanceRecords: Student360AttendanceRecord[] = [];
    let attendedSessions = 0;
    let missedSessions = 0;
    let feedbackCount = 0;
    let avgFeedbackRating: number | null = null;

    if (!isBeginner) {
        const rawAttendance = await prisma.attendance.findMany({
            where: { studentId },
            include: {
                session: {
                    include: { level: true },
                },
            },
            orderBy: { session: { startTime: "desc" } },
        });

        const feedbackBySessionId = new Map(
            student.sessionFeedbacks.map((f) => [f.sessionId, f])
        );

        attendanceRecords = rawAttendance.map((att) => {
            const fb = feedbackBySessionId.get(att.sessionId) ?? null;
            if (att.status === "PRESENT") attendedSessions += 1;
            if (att.status === "ABSENT") missedSessions += 1;

            return {
                id: att.id,
                sessionId: att.sessionId,
                sessionTitle: att.session.title,
                sessionStartTime: att.session.startTime,
                levelName: `Level ${att.session.level.levelNumber}: ${att.session.level.name}`,
                status: att.status,
                recordedByName: att.recordedBy ? graderMap.get(att.recordedBy) || "Instructor" : null,
                recordedAt: att.recordedAt,
                feedback: fb
                    ? {
                          rating: fb.rating,
                          comment: fb.comment,
                          createdAt: fb.createdAt,
                      }
                    : null,
            };
        });

        feedbackCount = student.sessionFeedbacks.length;
        if (feedbackCount > 0) {
            const sum = student.sessionFeedbacks.reduce((acc, f) => acc + f.rating, 0);
            avgFeedbackRating = Math.round((sum / feedbackCount) * 10) / 10;
        }
    }

    const totalRecordedSessions = attendedSessions + missedSessions;
    const attendancePercentage =
        totalRecordedSessions > 0
            ? Math.round((attendedSessions / totalRecordedSessions) * 100)
            : 0;

    // 9. Store Purchases
    const storePurchases: Student360StorePurchase[] = student.storeInventory.map((inv) => ({
        id: inv.id,
        itemId: inv.storeItemId,
        itemName: inv.storeItem.name,
        cost: inv.storeItem.cost,
        purchasedAt: inv.purchasedAt,
        imageUrl: inv.storeItem.imageUrl,
        isEquipped: inv.isEquipped,
    }));

    // 10. Normalized Chronological Activity Timeline
    const timeline: Student360TimelineEvent[] = [];

    // Add ST Transactions
    for (const tx of transactions) {
        const isReward = tx.type === "REWARD";
        const isAdj = tx.reason === "INSTRUCTOR_ADJUSTMENT";
        timeline.push({
            id: `st-${tx.id}`,
            type: isAdj ? "INSTRUCTOR_ADJUSTMENT" : isReward ? "ST_REWARD" : "ST_PENALTY",
            title: isAdj
                ? `Instructor ${isReward ? "Bonus" : "Penalty"}: ${isReward ? "+" : "-"}${tx.amount} ST`
                : `${tx.reason.replace(/_/g, " ")}: ${isReward ? "+" : "-"}${tx.amount} ST`,
            description: tx.note || (tx.relatedEntityName ? `Related to ${tx.relatedEntityName}` : ""),
            timestamp: tx.createdAt,
            badgeLabel: `${isReward ? "+" : "-"}${tx.amount} ST`,
            badgeVariant: isReward ? "gold" : "danger",
            metadata: {
                reason: tx.reason,
                actor: tx.actorName,
                snapshot: tx.resultingBalanceSnapshot,
            },
        });
    }

    // Add Task Submissions
    for (const task of taskProgress) {
        if (task.submission) {
            timeline.push({
                id: `sub-${task.submission.id}`,
                type: "TASK_SUBMISSION",
                title: `Task Submitted: ${task.taskTitle}`,
                description: `Mode: ${task.submission.mode} (${task.submission.status})`,
                timestamp: task.submission.submittedAt,
                badgeLabel: task.submission.status,
                badgeVariant: task.submission.status === "SUBMITTED" ? "success" : "neutral",
            });

            // Add Graded milestone
            const isGraded = isBeginner
                ? !!task.submission.finalizedAt
                : !!task.submission.gradedAt;
            const gradedTimestamp = isBeginner
                ? task.submission.finalizedAt!
                : task.submission.gradedAt!;

            if (isGraded && gradedTimestamp) {
                const points = isBeginner
                    ? `${task.submission.totalPoints ?? 0} pts`
                    : `${(task.submission.understandingScore ?? 0) +
                          (task.submission.approachScore ?? 0) +
                          (task.submission.correctnessScore ?? 0) +
                          (task.submission.implementationScore ?? 0)}/10`;

                timeline.push({
                    id: `grade-${task.submission.id}`,
                    type: "GRADE_FINALIZED",
                    title: `Grade Finalized: ${task.taskTitle}`,
                    description: task.submission.instructorComment
                        ? `"${task.submission.instructorComment}" — by ${task.submission.gradedByName || "Instructor"}`
                        : `Evaluated by ${task.submission.gradedByName || "Instructor"}`,
                    timestamp: gradedTimestamp,
                    badgeLabel: points,
                    badgeVariant: "gold",
                });
            }
        }
    }

    // Add Attendance
    for (const att of attendanceRecords) {
        timeline.push({
            id: `att-${att.id}`,
            type: "ATTENDANCE",
            title: `Session Attendance: ${att.sessionTitle}`,
            description: `Marked ${att.status} by ${att.recordedByName || "Instructor"}`,
            timestamp: att.recordedAt,
            badgeLabel: att.status,
            badgeVariant: att.status === "PRESENT" ? "success" : "danger",
        });
    }

    // Add Store Purchases
    for (const item of storePurchases) {
        timeline.push({
            id: `store-${item.id}`,
            type: "STORE_PURCHASE",
            title: `Store Purchase: ${item.itemName}`,
            description: `Acquired for ${item.cost} ST`,
            timestamp: item.purchasedAt,
            badgeLabel: `-${item.cost} ST`,
            badgeVariant: "info",
        });
    }

    // Sort timeline newest first
    timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
        overview: {
            id: student.id,
            name: student.name,
            email: student.email,
            createdAt: student.createdAt,
            avatarConfig,

            group: {
                id: group.id,
                name: group.name,
                type: group.type,
                batchId: group.batch.id,
                batchName: group.batch.name,
            },

            academicContext: {
                currentLevelName,
                currentLevelNumber,
                currentWeekName,
                totalLevelsOrWeeks: isBeginner ? group.weeks.length : group.levels.length,
            },

            balance: {
                authoritativeBalance,
                avgSt: student.avgSt,
                beginnerSt: student.beginnerSt,
                currentLevelSt,
                balanceStatus,
                track: group.type,
            },

            ranking: {
                currentRank,
                totalPeers,
                metricLabel,
                metricScore,
                rankingScope,
                peers: peerRankings.slice(0, 5), // top competitors around or leading
            },

            progressSummary: {
                totalTasksAvailable,
                totalTasksSubmitted,
                totalTasksGraded,
                completionPercentage,
            },

            attendanceSummary: {
                supported: !isBeginner,
                attendedSessions,
                missedSessions,
                totalRecordedSessions,
                attendancePercentage,
                feedbackCount,
                avgFeedbackRating,
            },
        },
        transactions,
        instructorAdjustments,
        taskProgress,
        weekResources,
        attendanceRecords,
        timeline,
        storePurchases,
    };
}
