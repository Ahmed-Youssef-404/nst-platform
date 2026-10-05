// src/app/instructor/weeks/[id]/grade/week-grading-view.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    ChevronLeft,
    FileText,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Lock,
    Save,
    Sparkles,
    Trophy,
    UserCheck,
    Coins,
    Search,
    Download,
    Check,
    MessageSquareQuote,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format-date";
import { getSubmissionFileUrlAction } from "@/lib/actions/submission-management";
import { showToast } from "@/components/ui/toast";
import {
    saveDraftGradeAction,
    setWeekResourceStatusAction,
    finalizeWeekGradingAction,
} from "@/lib/actions/week-grading";
import type {
    WeekGradingViewData,
    StudentGradingRow,
    GradingTask,
} from "@/lib/data/get-week-grading-data";

export function WeekGradingView({ data }: { data: WeekGradingViewData }) {
    const router = useRouter();

    const [selectedStudentId, setSelectedStudentId] = useState<string>(
        data.students[0]?.studentId ?? ""
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "finalized">("all");
    const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);

    const activeStudent = data.students.find(
        (s) => s.studentId === selectedStudentId
    );

    const filteredStudents = data.students
        .filter((s) => {
            if (filterStatus === "pending") return !s.isFinalized;
            if (filterStatus === "finalized") return s.isFinalized;
            return true;
        })
        .filter((s) =>
            s.studentName.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const finalizedCount = data.students.filter((s) => s.isFinalized).length;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Top Bar */}
            <div className="space-y-3">
                <Link
                    href={`/instructor/weeks/${data.week.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-starlight-400 hover:text-gold-300 font-mono transition-colors"
                >
                    <ChevronLeft className="size-3.5" />
                    Back to Week details
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-starlight-100">
                                Grading: {data.week.name}
                            </h1>
                            <Badge className="bg-space-850 text-starlight-300 border-border/80 text-xs px-2.5 py-0.5 rounded-full font-mono">
                                {data.week.status}
                            </Badge>
                        </div>
                        <p className="mt-1 text-xs text-starlight-300 font-mono">
                            {data.week.groupName} · {data.week.batchName} ·{" "}
                            <span className="text-gold-400 font-semibold">
                                {finalizedCount} of {data.students.length} students finalized
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Layout: Left Roster + Right Student Grading Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Roster: Students List */}
                <div className="lg:col-span-4 space-y-3">
                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 p-1 bg-space-900 border border-border/70 rounded-xl text-xs font-mono">
                        <button
                            type="button"
                            onClick={() => setFilterStatus("all")}
                            className={`flex-1 py-1 px-2 rounded-lg text-center transition-all ${
                                filterStatus === "all"
                                    ? "bg-gold-500/20 text-gold-300 font-bold border border-gold-500/40"
                                    : "text-starlight-400 hover:text-starlight-200"
                            }`}
                        >
                            All ({data.students.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("pending")}
                            className={`flex-1 py-1 px-2 rounded-lg text-center transition-all ${
                                filterStatus === "pending"
                                    ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                                    : "text-starlight-400 hover:text-starlight-200"
                            }`}
                        >
                            Pending ({data.students.length - finalizedCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("finalized")}
                            className={`flex-1 py-1 px-2 rounded-lg text-center transition-all ${
                                filterStatus === "finalized"
                                    ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40"
                                    : "text-starlight-400 hover:text-starlight-200"
                            }`}
                        >
                            Done ({finalizedCount})
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="size-3.5 text-starlight-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                            placeholder="Search student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 text-xs bg-space-850/80 border-border/80 text-starlight-100 placeholder:text-starlight-400/60 rounded-xl focus-visible:border-gold-500 focus-visible:ring-gold-500/20"
                        />
                    </div>

                    <Card className="overflow-hidden border-border/80 bg-space-900/80 rounded-2xl shadow-2 backdrop-blur-md">
                        <CardHeader className="py-3 px-4 border-b border-border/70 bg-space-950/40">
                            <CardTitle className="text-xs font-bold text-starlight-300 uppercase tracking-wider font-mono">
                                Enrolled Students ({filteredStudents.length})
                            </CardTitle>
                        </CardHeader>
                        <div className="divide-y divide-border/60 max-h-[70vh] overflow-y-auto">
                            {filteredStudents.length === 0 ? (
                                <p className="text-xs text-starlight-400 p-6 text-center italic">
                                    No students found matching search.
                                </p>
                            ) : (
                                filteredStudents.map((student) => {
                                    const isSelected = student.studentId === selectedStudentId;

                                    return (
                                        <button
                                            key={student.studentId}
                                            type="button"
                                            onClick={() => setSelectedStudentId(student.studentId)}
                                            className={`w-full text-left p-3.5 transition-all flex items-start justify-between gap-3 ${
                                                isSelected
                                                    ? "bg-gold-500/10 border-l-4 border-l-gold-500 shadow-gold"
                                                    : "hover:bg-space-850/60 border-l-4 border-l-transparent"
                                            }`}
                                        >
                                            <div className="space-y-1.5 min-w-0">
                                                <p
                                                    className={`text-sm font-bold truncate ${
                                                        isSelected ? "text-gold-300" : "text-starlight-100"
                                                    }`}
                                                >
                                                    {student.studentName}
                                                </p>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {student.isFinalized ? (
                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-success-500/15 text-success-400 border border-success-500/30">
                                                            Finalized
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-space-850 text-starlight-400 border border-border/80">
                                                            Pending
                                                        </span>
                                                    )}

                                                    {student.isLocked && (
                                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-space-850 text-gold-400 border border-gold-500/30 flex items-center gap-0.5">
                                                            <Lock className="size-2.5" />
                                                            Locked
                                                        </span>
                                                    )}

                                                    {student.resource?.status === "ACCEPTED" ? (
                                                        <span className="text-[10px] text-success-400 font-semibold font-mono">
                                                            File ✓
                                                        </span>
                                                    ) : student.resource?.fileUrl ? (
                                                        <span className="text-[10px] text-amber-400 font-semibold font-mono">
                                                            File PENDING
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-starlight-400 font-mono">
                                                            No file
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <span className="text-xs font-mono font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-md border border-gold-500/20">
                                                    {student.beginnerSt} ST
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Workspace: Selected Student Grading */}
                <div className="lg:col-span-8">
                    {activeStudent ? (
                        <StudentGradingWorkspace
                            key={activeStudent.studentId}
                            student={activeStudent}
                            week={data.week}
                            tasks={data.tasks}
                            firstSolverSuggestions={data.firstSolverSuggestions}
                            onFinalizeClick={() => setFinalizeModalOpen(true)}
                        />
                    ) : (
                        <Card className="p-12 text-center text-starlight-400 rounded-2xl border-border/80 bg-space-900/60">
                            Please select a student from the left roster to begin grading.
                        </Card>
                    )}
                </div>
            </div>

            {/* Finalize Confirmation Modal */}
            {activeStudent && finalizeModalOpen && (
                <FinalizeGradingModal
                    student={activeStudent}
                    week={data.week}
                    tasks={data.tasks}
                    isOpen={finalizeModalOpen}
                    onClose={() => setFinalizeModalOpen(false)}
                    onSuccess={() => {
                        setFinalizeModalOpen(false);
                        showToast({
                            title: "Grading Finalized",
                            description: `Grading for ${activeStudent.studentName} has been permanently finalized and recorded.`,
                            type: "success",
                        });
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}

// -----------------------------------------------------------------------------
// Student Grading Workspace
// -----------------------------------------------------------------------------
function StudentGradingWorkspace({
    student,
    week,
    tasks,
    firstSolverSuggestions,
    onFinalizeClick,
}: {
    student: StudentGradingRow;
    week: WeekGradingViewData["week"];
    tasks: GradingTask[];
    firstSolverSuggestions: WeekGradingViewData["firstSolverSuggestions"];
    onFinalizeClick: () => void;
}) {
    const router = useRouter();
    const [resourceStatusLoading, setResourceStatusLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [fileActionError, setFileActionError] = useState<string | null>(null);

    async function handleSetResourceStatus(status: "ACCEPTED" | "REJECTED" | "PENDING") {
        setResourceStatusLoading(true);
        setFileActionError(null);

        try {
            const res = await setWeekResourceStatusAction({
                studentId: student.studentId,
                weekId: week.id,
                status,
            });

            if (!res.success) {
                setFileActionError(res.error ?? "Failed to update resource status.");
            } else {
                router.refresh();
            }
        } catch (err) {
            setFileActionError(err instanceof Error ? err.message : "Error updating file status.");
        } finally {
            setResourceStatusLoading(false);
        }
    }

    async function handleOpenFile(fileUrl: string) {
        setDownloadLoading(true);
        try {
            const res = await getSubmissionFileUrlAction(fileUrl);
            if (res.success && res.data) {
                window.open(res.data, "_blank");
            } else {
                showToast({
                    title: "Download Error",
                    description: res.error ?? "Could not get secure link to download file.",
                    type: "error",
                });
            }
        } catch (err) {
            showToast({
                title: "Download Error",
                description: err instanceof Error ? err.message : "Failed to open file.",
                type: "error",
            });
        } finally {
            setDownloadLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Student Header Card */}
            <Card className="rounded-2xl border border-border/80 bg-space-900/80 shadow-2 backdrop-blur-md overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-border/70 bg-space-950/40">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <CardTitle className="text-xl font-bold font-display text-starlight-100">
                                {student.studentName}
                            </CardTitle>
                            {student.isFinalized ? (
                                <Badge className="bg-success-500/15 text-success-400 border-success-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                    Finalized
                                </Badge>
                            ) : (
                                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                    Grading In Progress
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="mt-1 flex items-center gap-3 text-xs text-starlight-300 font-mono">
                            <span className="flex items-center gap-1.5 text-gold-400 font-bold">
                                <Coins className="size-3.5" />
                                Current Balance: {student.beginnerSt} ST
                            </span>
                            <span>•</span>
                            <span>
                                {student.isLocked ? (
                                    <span className="text-starlight-200">
                                        Locked: {student.resource?.lockedAt ? formatDateTime(student.resource.lockedAt) : ""}
                                    </span>
                                ) : (
                                    <span className="text-starlight-400">
                                        Not manually locked by student
                                    </span>
                                )}
                            </span>
                        </CardDescription>
                    </div>

                    {!student.isFinalized && (
                        <Button
                            onClick={onFinalizeClick}
                            className="shrink-0 gap-1.5 bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs transition-all"
                        >
                            <UserCheck className="size-4" />
                            Finalize Week Grading
                        </Button>
                    )}
                </CardHeader>

                {student.isFinalized && (
                    <div className="m-5 rounded-xl bg-success-500/10 border border-success-500/25 p-3.5 text-xs text-success-400 flex items-center gap-2">
                        <Check className="size-4 shrink-0" />
                        <span>
                            Grading for this student has been finalized and ST rewards/penalties have been permanently recorded.
                        </span>
                    </div>
                )}
            </Card>

            {/* Mandatory Resource File Section */}
            <Card className="rounded-2xl border border-border/80 bg-space-900/80 shadow-2 backdrop-blur-md overflow-hidden">
                <CardHeader className="p-5 border-b border-border/70 bg-space-950/40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-gold-400" />
                            <CardTitle className="text-sm font-bold text-starlight-100 font-display">
                                Required Deliverable: {week.requiredFileLabel}
                            </CardTitle>
                        </div>

                        {student.resource?.status === "ACCEPTED" ? (
                            <Badge className="bg-success-500/15 text-success-400 border-success-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                ACCEPTED (100% ST)
                            </Badge>
                        ) : student.resource?.status === "REJECTED" ? (
                            <Badge className="bg-error-500/15 text-error-400 border-error-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                REJECTED (×0.5 ST Penalty)
                            </Badge>
                        ) : student.resource?.fileUrl ? (
                            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                PENDING REVIEW
                            </Badge>
                        ) : (
                            <Badge className="bg-space-850 text-starlight-400 border-border/80 text-xs px-2.5 py-0.5 rounded-full font-mono">
                                NOT UPLOADED
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-5 space-y-3.5 text-xs">
                    {fileActionError && (
                        <div className="text-xs text-error-400 flex items-center gap-2 p-3 rounded-xl bg-error-500/10 border border-error-500/25">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{fileActionError}</span>
                        </div>
                    )}

                    {student.resource?.fileUrl ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/70 bg-space-850/80">
                            <div className="space-y-1">
                                <p className="font-semibold text-xs text-starlight-100 flex items-center gap-1.5">
                                    <FileText className="size-3.5 text-gold-400" />
                                    Deliverable Uploaded
                                </p>
                                <p className="text-[11px] text-starlight-400 font-mono">
                                    Uploaded on: {student.resource.submittedAt ? formatDateTime(student.resource.submittedAt) : "N/A"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenFile(student.resource!.fileUrl!)}
                                    disabled={downloadLoading}
                                    className="border-border/80 bg-space-800 hover:bg-space-750 text-starlight-200 rounded-xl text-xs font-semibold"
                                >
                                    <Download className="size-3.5 mr-1" />
                                    {downloadLoading ? "Opening..." : "View File"}
                                </Button>

                                {!student.isFinalized && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => handleSetResourceStatus("ACCEPTED")}
                                            disabled={resourceStatusLoading}
                                            className={`rounded-xl text-xs font-semibold ${
                                                student.resource.status === "ACCEPTED"
                                                    ? "bg-success-500 text-space-950 font-bold"
                                                    : "bg-success-500/15 text-success-400 border border-success-500/30 hover:bg-success-500/25"
                                            }`}
                                        >
                                            <CheckCircle2 className="size-3.5 mr-1" />
                                            Accept
                                        </Button>

                                        <Button
                                            size="sm"
                                            onClick={() => handleSetResourceStatus("REJECTED")}
                                            disabled={resourceStatusLoading}
                                            className={`rounded-xl text-xs font-semibold ${
                                                student.resource.status === "REJECTED"
                                                    ? "bg-error-500 text-white font-bold"
                                                    : "bg-error-500/15 text-error-400 border border-error-500/30 hover:bg-error-500/25"
                                            }`}
                                        >
                                            <XCircle className="size-3.5 mr-1" />
                                            Reject
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2.5">
                            <AlertCircle className="size-4 text-amber-400 shrink-0" />
                            <span>
                                Student has not uploaded this required file. In accordance with platform policy, all positive ST rewards for this week will be halved (×0.5) at finalization.
                            </span>
                        </div>
                    )}

                    <p className="text-[11px] text-starlight-400/80 italic">
                        * Note: The halving rule applies automatically to the sum of positive rewards (rubrics, bonuses, first-solvers, and finish-all) unless this deliverable is marked ACCEPTED before finalization.
                    </p>
                </CardContent>
            </Card>

            {/* Tasks Grading Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-starlight-100">
                        Tasks & Rubric Grading
                    </h3>
                    <span className="rounded-full bg-space-800 border border-border/80 px-2 py-0.5 text-[11px] font-mono text-starlight-300">
                        {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
                    </span>
                </div>

                <div className="space-y-4">
                    {tasks.map((task, index) => {
                        const taskData = student.tasks.find((t) => t.taskId === task.id);
                        const isSuggestedFirstSolver =
                            firstSolverSuggestions.find((s) => s.taskId === task.id)?.suggestedStudentId === student.studentId;

                        return (
                            <TaskGradingCard
                                key={task.id}
                                index={index + 1}
                                task={task}
                                taskData={taskData}
                                studentId={student.studentId}
                                isFinalized={student.isFinalized}
                                isSuggestedFirstSolver={isSuggestedFirstSolver}
                                onFileOpen={handleOpenFile}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------------
// Individual Task Grading Card
// -----------------------------------------------------------------------------
function TaskGradingCard({
    index,
    task,
    taskData,
    studentId,
    isFinalized,
    isSuggestedFirstSolver,
    onFileOpen,
}: {
    index: number;
    task: GradingTask;
    taskData: StudentGradingRow["tasks"][0] | undefined;
    studentId: string;
    isFinalized: boolean;
    isSuggestedFirstSolver: boolean;
    onFileOpen: (fileUrl: string) => void;
}) {
    const existingGrade = taskData?.draftGrade;
    const submission = taskData?.submission;

    const [markedInvalid, setMarkedInvalid] = useState(
        existingGrade?.markedInvalid ?? false
    );

    const [fieldScores, setFieldScores] = useState<Record<string, number>>(() => {
        const scores: Record<string, number> = {};
        for (const rf of task.rubricFields) {
            const found = existingGrade?.fieldScores.find(
                (fs) => fs.rubricFieldId === rf.id
            );
            scores[rf.id] = found ? found.awardedPoints : 0;
        }
        return scores;
    });

    const [instructorComment, setInstructorComment] = useState(
        submission?.instructorComment ?? ""
    );

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalAwarded = Object.values(fieldScores).reduce((a, b) => a + b, 0);

    async function handleSaveDraft() {
        setIsSaving(true);
        setError(null);
        try {
            const payload: Parameters<typeof saveDraftGradeAction>[0] = submission
                ? {
                      submissionId: submission.id,
                      fieldScores: task.rubricFields.map((rf) => ({
                          rubricFieldId: rf.id,
                          awardedPoints: fieldScores[rf.id] ?? 0,
                      })),
                      markedInvalid,
                      instructorComment: instructorComment.trim() || undefined,
                  }
                : {
                      studentId,
                      taskId: task.id,
                      fieldScores: task.rubricFields.map((rf) => ({
                          rubricFieldId: rf.id,
                          awardedPoints: fieldScores[rf.id] ?? 0,
                      })),
                      markedInvalid,
                      instructorComment: instructorComment.trim() || undefined,
                  };

            const res = await saveDraftGradeAction(payload);

            if (!res.success) {
                setError(res.error ?? "Failed to save draft grade.");
            } else {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2500);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error saving draft grade.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card className="rounded-2xl border border-border/80 bg-space-900/80 shadow-2 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-gold-500/30">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 border-b border-border/70 bg-space-950/40">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-md">
                            Task #{index}
                        </span>
                        <CardTitle className="text-base font-bold text-starlight-100 font-display">
                            {task.title}
                        </CardTitle>
                        <Badge className="bg-space-850 text-starlight-300 border-border/80 text-[10px] px-2 py-0.5 rounded-full font-mono">
                            {task.type}
                        </Badge>
                        {task.isBonus && (
                            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                Bonus (+5 ST)
                            </Badge>
                        )}
                        {isSuggestedFirstSolver && (
                            <Badge className="bg-gold-500/15 text-gold-300 border-gold-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-gold">
                                <Trophy className="size-3 text-gold-400" />
                                Earliest Solver
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2.5 py-1 rounded-full">
                        Score: {markedInvalid ? "0" : totalAwarded} / 15 pts
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
                {/* Submission Details */}
                <div className="rounded-xl border border-border/70 bg-space-850/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-starlight-200">
                            Student Submission
                        </span>
                        {submission ? (
                            <span className="text-starlight-400 font-mono text-[11px]">
                                Submitted {formatDateTime(submission.submittedAt)}
                            </span>
                        ) : (
                            <span className="text-error-400 font-mono text-[11px] font-semibold">
                                No submission on record
                            </span>
                        )}
                    </div>

                    {submission && (
                        <div className="space-y-1.5 pt-1 text-xs">
                            {submission.textContent && (
                                <div className="space-y-1">
                                    <span className="text-starlight-400 text-[10px] uppercase font-mono">
                                        Source Code / Content:
                                    </span>
                                    <pre className="p-3 rounded-lg bg-space-950 border border-border/70 text-starlight-200 font-mono text-xs overflow-x-auto max-h-48">
                                        <code>{submission.textContent}</code>
                                    </pre>
                                </div>
                            )}

                            {submission.externalLink && (
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-starlight-400">External URL:</span>
                                    <a
                                        href={submission.externalLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gold-400 hover:text-gold-300 font-semibold underline flex items-center gap-1"
                                    >
                                        <ExternalLink className="size-3" />
                                        {submission.externalLink}
                                    </a>
                                </div>
                            )}

                            {submission.fileUrl && (
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-starlight-400">Uploaded File:</span>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={() => onFileOpen(submission.fileUrl!)}
                                        className="border-border/80 bg-space-800 text-starlight-200 rounded-lg text-xs"
                                    >
                                        <Download className="size-3 mr-1" />
                                        Download / View File
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Marked Invalid Flag */}
                <div className="rounded-xl border border-border/70 bg-space-950/50 p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id={`invalid-${task.id}`}
                            checked={markedInvalid}
                            onCheckedChange={(c) => setMarkedInvalid(Boolean(c))}
                            disabled={isFinalized || isSaving}
                        />
                        <Label
                            htmlFor={`invalid-${task.id}`}
                            className="text-xs font-bold text-error-400 cursor-pointer flex items-center gap-1.5"
                        >
                            <AlertCircle className="size-3.5" />
                            Mark submission as Invalid / Plagiarized (-10 ST Penalty)
                        </Label>
                    </div>

                    {markedInvalid && (
                        <p className="text-[11px] text-error-400/90 pl-6">
                            When marked invalid, rubric points are discarded and the student receives a permanent -10 ST penalty for this task.
                        </p>
                    )}
                </div>

                {/* Rubric Criteria Evaluation */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-starlight-200 flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-gold-400" />
                        Rubric Criteria Scores (Total: 15 max)
                    </Label>

                    {markedInvalid ? (
                        <p className="text-xs text-starlight-400 italic p-3 rounded-xl bg-space-950/60 border border-border/60">
                            Rubric scoring is disabled because this task is marked as Invalid.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {task.rubricFields.map((field) => {
                                const currentScore = fieldScores[field.id] ?? 0;

                                return (
                                    <div
                                        key={field.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-space-850/70 text-xs"
                                    >
                                        <div className="space-y-0.5">
                                            <p className="font-semibold text-starlight-100">
                                                {field.fieldName}
                                            </p>
                                            <p className="text-[10px] text-starlight-400 font-mono">
                                                Max points: {field.maxPoints}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={field.maxPoints}
                                                value={currentScore}
                                                onChange={(e) => {
                                                    const val = Math.min(
                                                        field.maxPoints,
                                                        Math.max(0, parseInt(e.target.value, 10) || 0)
                                                    );
                                                    setFieldScores((prev) => ({
                                                        ...prev,
                                                        [field.id]: val,
                                                    }));
                                                }}
                                                disabled={isFinalized || isSaving}
                                                className="w-16 text-center text-xs font-mono bg-space-900 border-border/80 text-starlight-100 rounded-lg focus-visible:border-gold-500"
                                            />
                                            <span className="text-starlight-400 font-mono">/ {field.maxPoints}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-xs text-error-400 flex items-center gap-1.5 p-2 rounded-lg bg-error-500/10 border border-error-500/25">
                        <AlertCircle className="size-3.5 shrink-0" />
                        {error}
                    </p>
                )}

                {/* Instructor Feedback Comment */}
                <div className="space-y-1.5 pt-3 border-t border-border/70">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-starlight-200">
                        <MessageSquareQuote className="size-3.5 text-gold-400" />
                        <span>Instructor Feedback & Comment</span>
                        <span className="text-[11px] font-normal text-starlight-400 font-mono">(Visible to student)</span>
                    </div>
                    {isFinalized ? (
                        instructorComment ? (
                            <div className="p-3 rounded-xl border border-border/70 bg-space-950/60 text-xs text-starlight-200 leading-relaxed whitespace-pre-wrap">
                                {instructorComment}
                            </div>
                        ) : (
                            <p className="text-xs text-starlight-400 italic">No feedback comment provided for this task.</p>
                        )
                    ) : (
                        <Textarea
                            value={instructorComment}
                            onChange={(e) => setInstructorComment(e.target.value)}
                            placeholder="Write constructive feedback or guidance for the student (will be displayed on their task scorecard)..."
                            rows={2}
                            disabled={isSaving}
                            className="text-xs bg-space-950/70 border-border/80 text-starlight-100 placeholder:text-starlight-400/50 rounded-xl focus-visible:border-gold-500 resize-y"
                        />
                    )}
                </div>

                {/* Save Draft Action */}
                {!isFinalized && (
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/70">
                        {saveSuccess && (
                            <span className="text-xs text-success-400 flex items-center gap-1.5 font-semibold">
                                <Check className="size-3.5" />
                                Draft saved!
                            </span>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={isSaving}
                            className="border-border/80 bg-space-850 hover:bg-space-800 text-starlight-200 rounded-xl text-xs font-semibold"
                        >
                            <Save className="size-3.5 mr-1 text-gold-400" />
                            {isSaving ? "Saving..." : "Save Task Draft"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// -----------------------------------------------------------------------------
// Finalize Grading Modal & Scoring Formula Preview
// -----------------------------------------------------------------------------
function FinalizeGradingModal({
    student,
    week,
    tasks,
    isOpen,
    onClose,
    onSuccess,
}: {
    student: StudentGradingRow;
    week: WeekGradingViewData["week"];
    tasks: GradingTask[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [firstSolverTaskIds, setFirstSolverTaskIds] = useState<string[]>([]);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isResourceAccepted = student.resource?.status === "ACCEPTED";
    const wasHalved = !isResourceAccepted;

    let rubricTotal = 0;
    let bonusTotal = 0;
    let penaltyTotal = 0;
    let allTasksSubmitted = true;

    for (const task of tasks) {
        const studentTask = student.tasks.find((t) => t.taskId === task.id);
        const draft = studentTask?.draftGrade;
        const sub = studentTask?.submission;

        const isInvalid = draft?.markedInvalid ?? false;
        const hasSub = Boolean(sub);

        if (!hasSub && task.type === "INTERNAL") {
            allTasksSubmitted = false;
        }

        if (isInvalid || (!hasSub && task.type === "INTERNAL")) {
            penaltyTotal += 10;
        } else {
            if (draft?.fieldScores) {
                rubricTotal += draft.fieldScores.reduce((a, b) => a + b.awardedPoints, 0);
            }
            if (task.isBonus) {
                bonusTotal += 5;
            }
        }
    }

    const firstSolverBonus = firstSolverTaskIds.length * 5;
    const finishAllBonus = allTasksSubmitted && penaltyTotal === 0 ? 10 : 0;

    const rawPositiveTotal = rubricTotal + bonusTotal + firstSolverBonus + finishAllBonus;
    const finalPositive = wasHalved ? Math.floor(rawPositiveTotal * 0.5) : rawPositiveTotal;
    const netStDelta = finalPositive - penaltyTotal;
    const resultingBalance = student.beginnerSt + netStDelta;

    function toggleFirstSolver(taskId: string) {
        setFirstSolverTaskIds((prev) =>
            prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
        );
    }

    async function handleFinalize() {
        setIsFinalizing(true);
        setError(null);

        try {
            const res = await finalizeWeekGradingAction({
                studentId: student.studentId,
                weekId: week.id,
                firstSolverTaskIds,
            });

            if (!res.success) {
                setError(res.error ?? "Failed to finalize week grading.");
                setIsFinalizing(false);
                return;
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error finalizing grading.");
            setIsFinalizing(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-space-900/95 border-border/80 text-starlight-100 rounded-2xl backdrop-blur-xl shadow-4 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold text-starlight-100">
                        <UserCheck className="size-5 text-gold-400" />
                        Finalize Week Grading
                    </DialogTitle>
                    <DialogDescription className="text-xs text-starlight-400">
                        Review the score calculation for {student.studentName}. Once finalized, ST transactions are permanently recorded.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {error && (
                        <div className="flex items-center gap-2 rounded-xl bg-error-500/10 p-3 text-xs text-error-400 border border-error-500/25">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* First Solver Selection */}
                    <div className="rounded-xl border border-border/80 bg-space-950/60 p-4 space-y-2.5">
                        <Label className="text-xs font-bold text-starlight-100 flex items-center gap-1.5">
                            <Trophy className="size-3.5 text-gold-400" />
                            First Solver Bonus (+5 ST per confirmed task)
                        </Label>
                        <p className="text-[11px] text-starlight-400">
                            Check tasks where this student is confirmed as the earliest solver:
                        </p>

                        <div className="space-y-2 pt-1">
                            {tasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`first-solver-${task.id}`}
                                        checked={firstSolverTaskIds.includes(task.id)}
                                        onCheckedChange={() => toggleFirstSolver(task.id)}
                                        disabled={isFinalizing}
                                    />
                                    <Label
                                        htmlFor={`first-solver-${task.id}`}
                                        className="text-xs text-starlight-200 cursor-pointer truncate max-w-sm"
                                    >
                                        {task.title}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scoring Breakdown Card */}
                    <div className="rounded-xl border border-border/80 bg-space-950/80 p-4 space-y-2.5 font-mono text-xs">
                        <p className="font-sans font-bold text-starlight-100 text-xs flex items-center gap-1.5 border-b border-border/70 pb-2">
                            <Coins className="size-3.5 text-gold-400" />
                            Final ST Breakdown Formula
                        </p>

                        <div className="space-y-1.5 text-starlight-300">
                            <div className="flex justify-between">
                                <span>Rubric Points Sum:</span>
                                <span className="text-starlight-100 font-bold">+{rubricTotal} ST</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bonus Tasks (+5 each):</span>
                                <span className="text-starlight-100 font-bold">+{bonusTotal} ST</span>
                            </div>
                            <div className="flex justify-between">
                                <span>First Solver Bonus (+5 each):</span>
                                <span className="text-gold-400 font-bold">+{firstSolverBonus} ST</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Finish All Tasks Bonus:</span>
                                <span className="text-gold-400 font-bold">+{finishAllBonus} ST</span>
                            </div>

                            <div className="border-t border-border/70 pt-1.5 flex justify-between">
                                <span>Raw Positive Total:</span>
                                <span className="text-starlight-100 font-bold">+{rawPositiveTotal} ST</span>
                            </div>

                            {wasHalved && (
                                <div className="flex justify-between text-amber-400 font-semibold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                                    <span>File Not Accepted Penalty:</span>
                                    <span>× 0.5 (Halved to +{finalPositive} ST)</span>
                                </div>
                            )}

                            {penaltyTotal > 0 && (
                                <div className="flex justify-between text-error-400 font-semibold bg-error-500/10 p-2 rounded-lg border border-error-500/20">
                                    <span>Penalties (-10 per missing/invalid):</span>
                                    <span>-{penaltyTotal} ST</span>
                                </div>
                            )}

                            <div className="border-t border-border/70 pt-2 flex justify-between font-bold text-sm">
                                <span className="font-sans text-starlight-100">Net Balance Change:</span>
                                <span className={netStDelta >= 0 ? "text-gold-400" : "text-error-400"}>
                                    {netStDelta >= 0 ? `+${netStDelta}` : netStDelta} ST
                                </span>
                            </div>

                            <div className="flex justify-between text-xs text-starlight-400 pt-1">
                                <span>New Projected Balance:</span>
                                <span className="text-starlight-100 font-bold">
                                    {student.beginnerSt} → {resultingBalance} ST
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isFinalizing}
                            className="border-border/80 bg-space-850 hover:bg-space-800 text-starlight-300 rounded-xl text-xs font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleFinalize}
                            disabled={isFinalizing}
                            className="bg-gold-500 hover:bg-gold-400 text-space-950 font-bold shadow-gold rounded-xl text-xs"
                        >
                            {isFinalizing ? "Finalizing..." : "Confirm & Finalize Grading"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
