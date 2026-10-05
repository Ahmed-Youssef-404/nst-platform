// src/lib/data/get-levels-intelligence.ts
// Comprehensive data fetcher for the /super-admin/levels Intelligence Center.
// Loads all Batches → Groups → Levels (active + history) with aggregated
// student, instructor, session, task, submission and ST stats.
//
// Design principles:
//   - Single Prisma call tree (no N+1 loops).
//   - All aggregation happens in JS after one large fetch; the dataset is
//     bounded by the platform size (hundreds of students, not millions).
//   - Groups own their Levels; each Level belongs to exactly one Group.
//   - "Intermediate" groups use Levels/Sessions/Tasks. "Beginner" groups
//     use Weeks/Tasks directly (no Level). We surface both tracks here.
//   - Every field gracefully handles null / empty arrays.

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ============================================================
// Shape definitions
// ============================================================

export interface LevelsIntelligenceStudentRow {
    id: string; // student code, e.g. "NST-1001"
    name: string;
    email: string;
    avgSt: number;
    beginnerSt: number | null;
    createdAt: Date;
    // Derived from active level balance
    currentLevelSt: number | null; // null if no active level / no balance row
    // Submission aggregates
    totalSubmissions: number;
    gradedSubmissions: number;
    ungradedSubmissions: number;
    // Task aggregates (scoped to their group's active level)
    tasksAvailable: number;
    tasksSubmitted: number;
}

export interface LevelsIntelligenceInstructorRow {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    assignedGroupIds: string[]; // all groups this instructor is assigned to
    totalGroupsCount: number;
}

export interface LevelsIntelligenceLevelRow {
    id: string;
    name: string;
    description: string | null;
    levelNumber: number;
    startDate: Date;
    isActive: boolean;
    sessionsCount: number;
    tasksCount: number;
    submissionsCount: number;
    gradedSubmissionsCount: number;
    studentCount: number; // students that have a LevelStBalance for this level
    avgBalance: number | null; // average LevelStBalance.balance across all students
}

export interface LevelsIntelligenceGroupRow {
    id: string;
    name: string;
    batchId: string;
    batchName: string;
    type: "BEGINNER" | "INTERMEDIATE";
    createdAt: Date;

    // Instructor info
    instructors: LevelsIntelligenceInstructorRow[];

    // Student counts
    studentCount: number;

    // Active level (INTERMEDIATE only)
    activeLevel: LevelsIntelligenceLevelRow | null;

    // All levels history (INTERMEDIATE; oldest first)
    allLevels: LevelsIntelligenceLevelRow[];

    // Students list
    students: LevelsIntelligenceStudentRow[];

    // Derived stats
    stats: {
        totalTasks: number;
        totalSubmissions: number;
        gradedSubmissions: number;
        avgStudentSt: number | null; // average of avgSt across all students
        totalLevels: number;
        completedLevels: number; // isActive = false
    };
}

export interface LevelsIntelligenceBatchRow {
    id: string;
    name: string;
    createdAt: Date;
    groups: LevelsIntelligenceGroupRow[];
    // Derived
    studentCount: number;
    groupCount: number;
    intermediateGroupCount: number;
    beginnerGroupCount: number;
}

export interface LevelsIntelligenceData {
    // Top-level aggregates across the entire platform
    globalStats: {
        totalBatches: number;
        totalGroups: number;
        totalStudents: number;
        totalInstructors: number;
        intermediateGroups: number;
        beginnerGroups: number;
        totalActiveLevels: number;
        totalLevelsEver: number;
        totalSessions: number;
        totalTasks: number;
        totalSubmissions: number;
        gradedSubmissions: number;
        avgStudentSt: number | null;
    };
    batches: LevelsIntelligenceBatchRow[];
    // Flat list of all instructors (for quick lookups / filters)
    allInstructors: LevelsIntelligenceInstructorRow[];
}

// ============================================================
// Fetcher
// ============================================================

export async function getLevelsIntelligence(): Promise<LevelsIntelligenceData> {
    // One large nested Prisma query – avoids N+1 by loading everything in a
    // single round-trip and aggregating in memory.
    const [batches, allInstructorsRaw] = await Promise.all([
        prisma.batch.findMany({
            orderBy: { name: "asc" },
            include: {
                groups: {
                    orderBy: { name: "asc" },
                    include: {
                        students: {
                            orderBy: { name: "asc" },
                            include: {
                                levelStBalances: {
                                    select: {
                                        levelId: true,
                                        balance: true,
                                    },
                                },
                                submissions: {
                                    select: {
                                        id: true,
                                        taskId: true,
                                        gradedAt: true,
                                        submittedAt: true,
                                    },
                                },
                            },
                        },
                        instructorGroups: {
                            include: {
                                instructor: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        createdAt: true,
                                    },
                                },
                            },
                        },
                        levels: {
                            orderBy: { levelNumber: "asc" },
                            include: {
                                sessions: {
                                    select: {
                                        id: true,
                                        tasks: {
                                            select: {
                                                id: true,
                                                submissions: {
                                                    select: {
                                                        id: true,
                                                        gradedAt: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                levelStBalances: {
                                    select: {
                                        studentId: true,
                                        balance: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),
        prisma.instructor.findMany({
            orderBy: { name: "asc" },
            include: {
                instructorGroups: {
                    select: { groupId: true },
                },
            },
        }),
    ]);

    // ---- Build allInstructors flat list ----
    const allInstructors: LevelsIntelligenceInstructorRow[] = allInstructorsRaw.map(
        (ins) => ({
            id: ins.id,
            name: ins.name,
            email: ins.email,
            createdAt: ins.createdAt,
            assignedGroupIds: ins.instructorGroups.map((ig) => ig.groupId),
            totalGroupsCount: ins.instructorGroups.length,
        })
    );

    // ---- Global counters ----
    let globalTotalStudents = 0;
    let globalTotalSessions = 0;
    let globalTotalTasks = 0;
    let globalTotalSubmissions = 0;
    let globalGradedSubmissions = 0;
    let globalTotalActiveLevels = 0;
    let globalTotalLevelsEver = 0;
    let globalIntermediateGroups = 0;
    let globalBeginnerGroups = 0;
    const allStudentAvgSts: number[] = [];

    // ---- Build batch rows ----
    const batchRows: LevelsIntelligenceBatchRow[] = batches.map((batch) => {
        const groupRows: LevelsIntelligenceGroupRow[] = batch.groups.map((group) => {
            // ---- Instructors for this group ----
            const groupInstructors: LevelsIntelligenceInstructorRow[] =
                group.instructorGroups.map((ig) => ({
                    id: ig.instructor.id,
                    name: ig.instructor.name,
                    email: ig.instructor.email,
                    createdAt: ig.instructor.createdAt,
                    assignedGroupIds: [], // full list available via allInstructors
                    totalGroupsCount: 0,
                }));

            // ---- Level rows ----
            const levelRows: LevelsIntelligenceLevelRow[] = group.levels.map((level) => {
                let levelTasksCount = 0;
                let levelSubmissionsCount = 0;
                let levelGradedSubmissionsCount = 0;

                for (const session of level.sessions) {
                    globalTotalSessions++;
                    for (const task of session.tasks) {
                        levelTasksCount++;
                        globalTotalTasks++;
                        for (const sub of task.submissions) {
                            levelSubmissionsCount++;
                            globalTotalSubmissions++;
                            if (sub.gradedAt) {
                                levelGradedSubmissionsCount++;
                                globalGradedSubmissions++;
                            }
                        }
                    }
                }

                const balances = level.levelStBalances.map((b) => b.balance);
                const avgBalance =
                    balances.length > 0
                        ? Math.round(balances.reduce((a, b) => a + b, 0) / balances.length)
                        : null;

                if (level.isActive) globalTotalActiveLevels++;
                globalTotalLevelsEver++;

                return {
                    id: level.id,
                    name: level.name,
                    description: level.description,
                    levelNumber: level.levelNumber,
                    startDate: level.startDate,
                    isActive: level.isActive,
                    sessionsCount: level.sessions.length,
                    tasksCount: levelTasksCount,
                    submissionsCount: levelSubmissionsCount,
                    gradedSubmissionsCount: levelGradedSubmissionsCount,
                    studentCount: level.levelStBalances.length,
                    avgBalance,
                };
            });

            const activeLevel = levelRows.find((l) => l.isActive) ?? null;

            // Build a set of task IDs in the active level for per-student task stats
            const activeLevelObj = group.levels.find((l) => l.isActive) ?? null;
            const activeLevelTaskIds = new Set<string>();
            if (activeLevelObj) {
                for (const session of activeLevelObj.sessions) {
                    for (const task of session.tasks) {
                        activeLevelTaskIds.add(task.id);
                    }
                }
            }

            const activeLevelId = activeLevelObj?.id ?? null;

            // ---- Student rows ----
            const studentRows: LevelsIntelligenceStudentRow[] = group.students.map(
                (student) => {
                    const currentLevelBalance = activeLevelId
                        ? (student.levelStBalances.find(
                              (b) => b.levelId === activeLevelId
                          )?.balance ?? null)
                        : null;

                    const studentSubmissions = student.submissions;
                    const totalSubs = studentSubmissions.length;
                    const gradedSubs = studentSubmissions.filter((s) => s.gradedAt).length;

                    // Tasks submitted within the active level
                    const submittedActiveLevelTaskIds = new Set(
                        studentSubmissions
                            .filter((s) => activeLevelTaskIds.has(s.taskId))
                            .map((s) => s.taskId)
                    );

                    allStudentAvgSts.push(student.avgSt);

                    return {
                        id: student.id,
                        name: student.name,
                        email: student.email,
                        avgSt: student.avgSt,
                        beginnerSt: student.beginnerSt,
                        createdAt: student.createdAt,
                        currentLevelSt: currentLevelBalance,
                        totalSubmissions: totalSubs,
                        gradedSubmissions: gradedSubs,
                        ungradedSubmissions: totalSubs - gradedSubs,
                        tasksAvailable: activeLevelTaskIds.size,
                        tasksSubmitted: submittedActiveLevelTaskIds.size,
                    };
                }
            );

            globalTotalStudents += group.students.length;
            if (group.type === "INTERMEDIATE") globalIntermediateGroups++;
            else globalBeginnerGroups++;

            // Group-level derived stats
            const groupTotalTasks = levelRows.reduce((acc, l) => acc + l.tasksCount, 0);
            const groupTotalSubmissions = levelRows.reduce(
                (acc, l) => acc + l.submissionsCount,
                0
            );
            const groupGradedSubmissions = levelRows.reduce(
                (acc, l) => acc + l.gradedSubmissionsCount,
                0
            );
            const groupStudentSts = studentRows.map((s) => s.avgSt);
            const groupAvgSt =
                groupStudentSts.length > 0
                    ? Math.round(
                          groupStudentSts.reduce((a, b) => a + b, 0) /
                              groupStudentSts.length
                      )
                    : null;
            const completedLevels = levelRows.filter((l) => !l.isActive).length;

            return {
                id: group.id,
                name: group.name,
                batchId: group.batchId,
                batchName: batch.name,
                type: group.type as "BEGINNER" | "INTERMEDIATE",
                createdAt: group.createdAt,
                instructors: groupInstructors,
                studentCount: group.students.length,
                activeLevel,
                allLevels: levelRows,
                students: studentRows,
                stats: {
                    totalTasks: groupTotalTasks,
                    totalSubmissions: groupTotalSubmissions,
                    gradedSubmissions: groupGradedSubmissions,
                    avgStudentSt: groupAvgSt,
                    totalLevels: levelRows.length,
                    completedLevels,
                },
            };
        });

        const batchStudentCount = groupRows.reduce((acc, g) => acc + g.studentCount, 0);
        const batchIntermediateGroups = groupRows.filter(
            (g) => g.type === "INTERMEDIATE"
        ).length;

        return {
            id: batch.id,
            name: batch.name,
            createdAt: batch.createdAt,
            groups: groupRows,
            studentCount: batchStudentCount,
            groupCount: groupRows.length,
            intermediateGroupCount: batchIntermediateGroups,
            beginnerGroupCount: groupRows.length - batchIntermediateGroups,
        };
    });

    const globalAvgSt =
        allStudentAvgSts.length > 0
            ? Math.round(
                  allStudentAvgSts.reduce((a, b) => a + b, 0) / allStudentAvgSts.length
              )
            : null;

    return {
        globalStats: {
            totalBatches: batches.length,
            totalGroups: batches.reduce((acc, b) => acc + b.groups.length, 0),
            totalStudents: globalTotalStudents,
            totalInstructors: allInstructors.length,
            intermediateGroups: globalIntermediateGroups,
            beginnerGroups: globalBeginnerGroups,
            totalActiveLevels: globalTotalActiveLevels,
            totalLevelsEver: globalTotalLevelsEver,
            totalSessions: globalTotalSessions,
            totalTasks: globalTotalTasks,
            totalSubmissions: globalTotalSubmissions,
            gradedSubmissions: globalGradedSubmissions,
            avgStudentSt: globalAvgSt,
        },
        batches: batchRows,
        allInstructors,
    };
}
