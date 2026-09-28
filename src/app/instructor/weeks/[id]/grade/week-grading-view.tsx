// src/app/instructor/weeks/[id]/grade/week-grading-view.tsx
"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";
import { formatDateTime } from "@/lib/format-date";
import { getSubmissionFileUrlAction } from "@/lib/actions/submission-management";
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
    const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);

    const activeStudent = data.students.find(
        (s) => s.studentId === selectedStudentId
    );

    const filteredStudents = data.students.filter((s) =>
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const finalizedCount = data.students.filter((s) => s.isFinalized).length;

    return (
        <div className="space-y-6">
            {/* Top Bar */}
            <div className="space-y-3">
                <Link
                    href={`/instructor/weeks/${data.week.id}`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="size-4" />
                    Back to Week details
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-display text-2xl font-bold tracking-tight">
                                Grading: {data.week.name}
                            </h1>
                            <Badge variant="outline">{data.week.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {data.week.groupName} · {data.week.batchName} · {finalizedCount} of {data.students.length} students finalized
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Layout: Left Roster + Right Student Grading Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Roster: Students List */}
                <div className="lg:col-span-4 space-y-3">
                    <div className="relative">
                        <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                            placeholder="Search student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 text-xs"
                        />
                    </div>

                    <Card className="overflow-hidden border-border/80">
                        <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Students ({filteredStudents.length})
                            </CardTitle>
                        </CardHeader>
                        <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
                            {filteredStudents.length === 0 ? (
                                <p className="text-xs text-muted-foreground p-4 text-center">
                                    No students found.
                                </p>
                            ) : (
                                filteredStudents.map((student) => {
                                    const isSelected = student.studentId === selectedStudentId;

                                    return (
                                        <button
                                            key={student.studentId}
                                            type="button"
                                            onClick={() => setSelectedStudentId(student.studentId)}
                                            className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-2 ${
                                                isSelected
                                                    ? "bg-primary/10 border-l-2 border-primary"
                                                    : "hover:bg-muted/30"
                                            }`}
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <p
                                                    className={`text-sm font-medium truncate ${
                                                        isSelected ? "text-primary" : "text-foreground"
                                                    }`}
                                                >
                                                    {student.studentName}
                                                </p>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {student.isFinalized ? (
                                                        <Badge variant="success" className="text-[10px] h-4 px-1.5">
                                                            Finalized
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">
                                                            Pending
                                                        </Badge>
                                                    )}

                                                    {student.isLocked && (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                                                            <Lock className="size-2.5" />
                                                            Locked
                                                        </Badge>
                                                    )}

                                                    {student.resource?.status === "ACCEPTED" ? (
                                                        <span className="text-[10px] text-success font-medium">
                                                            File ✓
                                                        </span>
                                                    ) : student.resource?.fileUrl ? (
                                                        <span className="text-[10px] text-amber-500 font-medium">
                                                            File PENDING
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            No file
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <span className="text-xs font-mono font-medium text-coin">
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
                        <Card className="p-8 text-center text-muted-foreground">
                            Please select a student from the list to begin grading.
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
                alert(res.error ?? "Could not get secure link to download file.");
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to open file.");
        } finally {
            setDownloadLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Student Header Card */}
            <Card className="border-border/80 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <CardTitle className="text-xl font-display">
                                {student.studentName}
                            </CardTitle>
                            {student.isFinalized ? (
                                <Badge variant="success">Finalized</Badge>
                            ) : (
                                <Badge variant="outline">Grading In Progress</Badge>
                            )}
                        </div>
                        <CardDescription className="mt-1 flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 font-mono text-coin font-medium">
                                <Coins className="size-3.5" />
                                Current Balance: {student.beginnerSt} ST
                            </span>
                            <span>•</span>
                            <span>
                                {student.isLocked ? (
                                    <span className="text-foreground">
                                        Manually locked week on {student.resource?.lockedAt ? formatDateTime(student.resource.lockedAt) : ""}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Week not manually locked by student
                                    </span>
                                )}
                            </span>
                        </CardDescription>
                    </div>

                    {!student.isFinalized && (
                        <Button onClick={onFinalizeClick} className="shrink-0 gap-1.5">
                            <UserCheck className="size-4" />
                            Finalize Week Grading
                        </Button>
                    )}
                </CardHeader>

                {student.isFinalized && (
                    <div className="mx-6 mb-4 rounded-md bg-success/10 border border-success/20 p-3 text-xs text-success flex items-center gap-2">
                        <Check className="size-4 shrink-0" />
                        <span>
                            Grading for this student has been finalized and ST rewards/penalties have been permanently recorded.
                        </span>
                    </div>
                )}
            </Card>

            {/* Mandatory Resource File Section */}
            <Card className="border-border/80">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4 text-primary" />
                            <CardTitle className="text-base font-semibold">
                                Required Deliverable: {week.requiredFileLabel}
                            </CardTitle>
                        </div>

                        {student.resource?.status === "ACCEPTED" ? (
                            <Badge variant="success">ACCEPTED (100% ST)</Badge>
                        ) : student.resource?.status === "REJECTED" ? (
                            <Badge variant="destructive">REJECTED (×0.5 ST Penalty)</Badge>
                        ) : student.resource?.fileUrl ? (
                            <Badge variant="warning">PENDING REVIEW</Badge>
                        ) : (
                            <Badge variant="secondary">NOT UPLOADED</Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 text-sm">
                    {fileActionError && (
                        <div className="text-xs text-destructive flex items-center gap-1.5 p-2 rounded bg-destructive/10">
                            <AlertCircle className="size-3.5" />
                            <span>{fileActionError}</span>
                        </div>
                    )}

                    {student.resource?.fileUrl ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-card">
                            <div className="space-y-1">
                                <p className="font-medium text-xs text-foreground flex items-center gap-1.5">
                                    <FileText className="size-3.5 text-muted-foreground" />
                                    Deliverable Uploaded
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Uploaded on: {student.resource.submittedAt ? formatDateTime(student.resource.submittedAt) : "N/A"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => handleOpenFile(student.resource!.fileUrl!)}
                                    disabled={downloadLoading}
                                >
                                    <Download className="size-3 mr-1" />
                                    {downloadLoading ? "Opening..." : "View File"}
                                </Button>

                                {!student.isFinalized && (
                                    <>
                                        <Button
                                            size="xs"
                                            variant={student.resource.status === "ACCEPTED" ? "default" : "outline"}
                                            onClick={() => handleSetResourceStatus("ACCEPTED")}
                                            disabled={resourceStatusLoading}
                                            className="text-success border-success/30 hover:bg-success/10"
                                        >
                                            <CheckCircle2 className="size-3 mr-1" />
                                            Accept
                                        </Button>

                                        <Button
                                            size="xs"
                                            variant={student.resource.status === "REJECTED" ? "default" : "outline"}
                                            onClick={() => handleSetResourceStatus("REJECTED")}
                                            disabled={resourceStatusLoading}
                                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                        >
                                            <XCircle className="size-3 mr-1" />
                                            Reject
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-3.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="size-4 text-amber-500 shrink-0" />
                            <span>
                                Student has not uploaded this required file. In accordance with course guidelines, all positive ST rewards for this week will be halved at finalization.
                            </span>
                        </div>
                    )}

                    <p className="text-[11px] text-muted-foreground/80 italic">
                        * Notice: The halving rule applies automatically to the sum of positive rewards (rubrics, bonuses, first-solvers, and finish-all) unless this deliverable is marked ACCEPTED before finalization.
                    </p>
                </CardContent>
            </Card>

            {/* Tasks Grading Section */}
            <div className="space-y-4">
                <h3 className="font-display text-base font-semibold">
                    Tasks & Rubric Grading ({tasks.length})
                </h3>

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
    const router = useRouter();

    const existingGrade = taskData?.draftGrade;
    const submission = taskData?.submission;

    const [markedInvalid, setMarkedInvalid] = useState(
        existingGrade?.markedInvalid ?? false
    );

    // Initial scores from draftGrade or 0
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
                  }
                : {
                      studentId,
                      taskId: task.id,
                      fieldScores: task.rubricFields.map((rf) => ({
                          rubricFieldId: rf.id,
                          awardedPoints: fieldScores[rf.id] ?? 0,
                      })),
                      markedInvalid,
                  };

            const res = await saveDraftGradeAction(payload);

            if (!res.success) {
                setError(res.error ?? "Failed to save draft grade.");
            } else {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2500);
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error saving draft grade.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card className="border-border/80">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-xs text-muted-foreground">
                            #{index}
                        </span>
                        <CardTitle className="text-base font-semibold">
                            {task.title}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                            {task.type}
                        </Badge>
                        {task.isBonus && (
                            <Badge variant="warning" className="text-xs">
                                Bonus (+5 ST)
                            </Badge>
                        )}
                        {isSuggestedFirstSolver && (
                            <Badge variant="outline" className="text-xs border-gold-500/40 text-gold-400 bg-gold-500/10 gap-1">
                                <Trophy className="size-3 text-gold-400" />
                                Earliest Manual Solver
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-sm font-semibold font-mono">
                        {markedInvalid ? (
                            <span className="text-destructive font-bold">Invalid (-10 ST)</span>
                        ) : (
                            <span>{totalAwarded} / 15 pts</span>
                        )}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
                {/* Student Solution Area */}
                <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">
                            Student Solution:
                        </span>
                        {submission ? (
                            <Badge variant="secondary" className="text-[10px]">
                                Mode: {submission.mode} · {submission.status}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                                {task.type === "EXTERNAL" ? "EXTERNAL (Check on OJ)" : "No submission on platform"}
                            </Badge>
                        )}
                    </div>

                    {submission ? (
                        <div className="text-xs space-y-2 pt-1">
                            {submission.mode === "TEXT" && (
                                <pre className="p-2.5 rounded bg-background border border-border text-foreground font-mono text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {submission.textContent || "(empty text)"}
                                </pre>
                            )}

                            {submission.mode === "LINK" && (
                                <a
                                    href={submission.externalLink ?? "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs font-mono"
                                >
                                    <ExternalLink className="size-3.5" />
                                    {submission.externalLink}
                                </a>
                            )}

                            {submission.mode === "FILE" && submission.fileUrl && (
                                <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => onFileOpen(submission.fileUrl!)}
                                >
                                    <Download className="size-3 mr-1" />
                                    Download Solution File
                                </Button>
                            )}

                            <p className="text-[10px] text-muted-foreground">
                                Submitted on: {formatDateTime(submission.submittedAt)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">
                            {task.type === "EXTERNAL"
                                ? "This is an external task. Grade the student based on their profile/activity on the designated external platform."
                                : "The student did not submit work for this task."}
                        </p>
                    )}
                </div>

                {/* Rubric Evaluation Form */}
                <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <Sparkles className="size-3 text-gold-400" />
                            Rubric Criteria Scoring:
                        </span>

                        {!isFinalized && (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={`invalid-${task.id}`}
                                    checked={markedInvalid}
                                    onCheckedChange={(c) => setMarkedInvalid(Boolean(c))}
                                />
                                <Label
                                    htmlFor={`invalid-${task.id}`}
                                    className="text-xs text-destructive font-medium cursor-pointer"
                                >
                                    Mark as Invalid / Unsubmitted
                                </Label>
                            </div>
                        )}
                    </div>

                    {markedInvalid ? (
                        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>
                                This task is marked Invalid. It will yield 0 rubric points and trigger a -10 ST penalty for this task at finalization.
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {task.rubricFields.map((field) => {
                                const currentScore = fieldScores[field.id] ?? 0;

                                return (
                                    <div
                                        key={field.id}
                                        className="flex items-center justify-between gap-3 p-2.5 rounded border border-border bg-card text-xs"
                                    >
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-foreground">
                                                {field.fieldName}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
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
                                                className="w-16 text-center text-xs h-7"
                                            />
                                            <span className="text-muted-foreground">/ {field.maxPoints}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {error}
                    </p>
                )}

                {/* Save Draft Action */}
                {!isFinalized && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        {saveSuccess && (
                            <span className="text-xs text-success flex items-center gap-1 font-medium">
                                <Check className="size-3.5" />
                                Draft saved!
                            </span>
                        )}
                        <Button
                            size="xs"
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={isSaving}
                        >
                            <Save className="size-3 mr-1" />
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

    // Compute preview according to grade-week.ts formula:
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
            // Add rubric points
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
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCheck className="size-5 text-primary" />
                        Finalize Week Grading
                    </DialogTitle>
                    <DialogDescription>
                        Review the score calculation for {student.studentName}. Once finalized, ST transactions are permanently executed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* First Solver Selection */}
                    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Trophy className="size-3.5 text-gold-400" />
                            First Solver Bonus (+5 ST per confirmed task)
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                            Check tasks where this student is confirmed as the earliest manual-lock solver:
                        </p>

                        <div className="space-y-1.5 pt-1">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between text-xs p-2 rounded bg-muted/40"
                                >
                                    <span className="font-medium truncate max-w-xs">{task.title}</span>
                                    <div className="flex items-center gap-1.5">
                                        <Checkbox
                                            id={`first-${task.id}`}
                                            checked={firstSolverTaskIds.includes(task.id)}
                                            onCheckedChange={() => toggleFirstSolver(task.id)}
                                        />
                                        <Label htmlFor={`first-${task.id}`} className="text-xs cursor-pointer">
                                            +5 ST
                                        </Label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Calculation Breakdown Table */}
                    <div className="rounded-lg border border-border bg-card p-3.5 space-y-2 text-xs">
                        <p className="font-semibold text-foreground pb-1 border-b border-border">
                            Score Calculation Summary
                        </p>

                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Rubric Points:</span>
                                <span className="font-mono font-medium">+{rubricTotal} ST</span>
                            </div>

                            {bonusTotal > 0 && (
                                <div className="flex justify-between text-gold-400">
                                    <span>Bonus Tasks Solved:</span>
                                    <span className="font-mono font-medium">+{bonusTotal} ST</span>
                                </div>
                            )}

                            {firstSolverBonus > 0 && (
                                <div className="flex justify-between text-gold-400">
                                    <span>First Solver Bonus:</span>
                                    <span className="font-mono font-medium">+{firstSolverBonus} ST</span>
                                </div>
                            )}

                            {finishAllBonus > 0 && (
                                <div className="flex justify-between text-success">
                                    <span>Finished All Tasks Bonus:</span>
                                    <span className="font-mono font-medium">+{finishAllBonus} ST</span>
                                </div>
                            )}

                            <div className="flex justify-between font-semibold pt-1 border-t border-border/50">
                                <span>Sum of Positive Rewards:</span>
                                <span className="font-mono">+{rawPositiveTotal} ST</span>
                            </div>

                            {/* Halving Notice */}
                            <div className="p-2 rounded bg-muted/50 border border-border text-[11px] space-y-1">
                                <div className="flex justify-between font-medium">
                                    <span>Deliverable Status:</span>
                                    <span className={isResourceAccepted ? "text-success" : "text-destructive"}>
                                        {isResourceAccepted ? "ACCEPTED (No Penalty)" : "NOT ACCEPTED (Halved ×0.5)"}
                                    </span>
                                </div>
                                {wasHalved && (
                                    <div className="flex justify-between text-destructive">
                                        <span>Reward after Halving:</span>
                                        <span className="font-mono font-bold">+{finalPositive} ST</span>
                                    </div>
                                )}
                            </div>

                            {penaltyTotal > 0 && (
                                <div className="flex justify-between text-destructive font-medium pt-1">
                                    <span>Unsubmitted / Invalid Penalties (-10 each):</span>
                                    <span className="font-mono font-bold">-{penaltyTotal} ST</span>
                                </div>
                            )}
                        </div>

                        {/* Net Result */}
                        <div className="p-2.5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-between text-sm font-semibold">
                            <span>Net ST Adjustment:</span>
                            <span className={`font-mono ${netStDelta >= 0 ? "text-success" : "text-destructive"}`}>
                                {netStDelta >= 0 ? `+${netStDelta}` : netStDelta} ST
                            </span>
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground pt-1">
                            <span>Resulting Student Balance:</span>
                            <span className="font-mono font-semibold text-coin">
                                {resultingBalance} ST (from {student.beginnerSt} ST)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isFinalizing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleFinalize}
                            disabled={isFinalizing}
                            className="bg-primary text-primary-foreground hover:bg-primary/80"
                        >
                            {isFinalizing ? "Finalizing & Saving..." : "Confirm & Finalize Grading"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
