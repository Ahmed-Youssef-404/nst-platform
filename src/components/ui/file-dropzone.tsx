"use client";

import * as React from "react";
import {
    UploadCloud,
    FileText,
    FileArchive,
    ImageIcon,
    FileCode,
    X,
    RefreshCw,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FileDropzoneProps {
    file?: File | null;
    value?: File | null;
    onFileSelect?: (file: File | null) => void;
    onChange?: (file: File | null) => void;
    accept?: string;
    maxSizeMB?: number;
    maxSize?: number;
    disabled?: boolean;
    helperText?: string;
    description?: string;
    className?: string;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileCategory(file: File): "image" | "pdf" | "archive" | "code" | "document" {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) {
        return "image";
    }
    if (type.includes("pdf") || name.endsWith(".pdf")) {
        return "pdf";
    }
    if (
        type.includes("zip") ||
        type.includes("tar") ||
        type.includes("compressed") ||
        /\.(zip|tar|gz|rar|7z)$/.test(name)
    ) {
        return "archive";
    }
    if (/\.(ts|tsx|js|jsx|py|java|cpp|c|html|css|json|sql)$/.test(name)) {
        return "code";
    }
    return "document";
}

export function FileDropzone({
    file: explicitFile,
    value,
    onFileSelect,
    onChange,
    accept = ".pdf,.zip,application/pdf,application/zip",
    maxSizeMB = 5,
    maxSize,
    disabled = false,
    helperText,
    description,
    className,
}: FileDropzoneProps) {
    const file = explicitFile !== undefined ? explicitFile : value ?? null;
    const effectiveMaxSizeMB =
        maxSize !== undefined
            ? maxSize > 10000
                ? Math.round(maxSize / (1024 * 1024))
                : maxSize
            : maxSizeMB;
    const effectiveHelper = helperText ?? description;

    const handleFileChange = (newFile: File | null) => {
        onFileSelect?.(newFile);
        onChange?.(newFile);
    };

    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
    const [sizeError, setSizeError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!file) {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
                setImagePreviewUrl(null);
            }
            return;
        }

        const category = getFileCategory(file);
        if (category === "image") {
            const url = URL.createObjectURL(file);
            setImagePreviewUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
                setImagePreviewUrl(null);
            }
        }
    }, [file]);

    const handleFileValidation = (candidateFile: File | null) => {
        setSizeError(null);
        if (!candidateFile) {
            handleFileChange(null);
            return;
        }

        const maxSizeBytes = effectiveMaxSizeMB * 1024 * 1024;
        if (candidateFile.size > maxSizeBytes) {
            setSizeError(`File size exceeds ${effectiveMaxSizeMB}MB limit (${formatFileSize(candidateFile.size)}).`);
            return;
        }

        handleFileChange(candidateFile);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            handleFileValidation(droppedFile);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] ?? null;
        handleFileValidation(selected);
        // reset input so the same file can be re-selected if needed
        if (e.target) {
            e.target.value = "";
        }
    };

    const openFileDialog = () => {
        if (disabled) return;
        inputRef.current?.click();
    };

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleFileValidation(null);
    };

    // If file is selected, show rich preview card
    if (file) {
        const category = getFileCategory(file);

        return (
            <div className={cn("space-y-2", className)}>
                <div className="relative rounded-2xl border border-border/80 bg-card dark:bg-space-900/90 p-4 shadow-sm backdrop-blur-md transition-all">
                    <div className="flex items-start gap-4">
                        {/* File Visual Preview */}
                        <div className="shrink-0">
                            {category === "image" && imagePreviewUrl ? (
                                <div className="relative size-16 overflow-hidden rounded-xl border border-border/80 bg-muted/40 shadow-xs">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imagePreviewUrl}
                                        alt={file.name}
                                        className="size-full object-cover"
                                    />
                                </div>
                            ) : category === "pdf" ? (
                                <div className="flex size-14 flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 shadow-xs">
                                    <FileText className="size-6" />
                                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                                        PDF
                                    </span>
                                </div>
                            ) : category === "archive" ? (
                                <div className="flex size-14 flex-col items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs">
                                    <FileArchive className="size-6" />
                                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                                        ZIP
                                    </span>
                                </div>
                            ) : category === "code" ? (
                                <div className="flex size-14 flex-col items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-xs">
                                    <FileCode className="size-6" />
                                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                                        CODE
                                    </span>
                                </div>
                            ) : (
                                <div className="flex size-14 flex-col items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-600 dark:text-gold-400 shadow-xs">
                                    <FileText className="size-6" />
                                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                                        DOC
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* File Details */}
                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="truncate text-sm font-semibold text-foreground dark:text-starlight-100">
                                    {file.name}
                                </h4>
                                <CheckCircle2 className="size-4 shrink-0 text-success-500" />
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground dark:text-starlight-400 font-mono">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span className="uppercase text-[11px]">
                                    {file.name.split(".").pop() || "FILE"}
                                </span>
                                {maxSizeMB && (
                                    <>
                                        <span>•</span>
                                        <span className="text-success-600 dark:text-success-400">
                                            Within {maxSizeMB}MB limit
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={openFileDialog}
                                disabled={disabled}
                                className="h-8 gap-1.5 rounded-lg border-border/80 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground dark:text-starlight-200"
                                title="Choose a different file"
                            >
                                <RefreshCw className="size-3" />
                                <span className="hidden sm:inline">Replace</span>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveFile}
                                disabled={disabled}
                                className="size-8 p-0 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                title="Remove selected file"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className="hidden"
                />

                {sizeError && (
                    <p className="text-xs font-medium text-red-500 dark:text-red-400">
                        {sizeError}
                    </p>
                )}
            </div>
        );
    }

    // Empty Dropzone
    return (
        <div className={cn("space-y-1.5", className)}>
            <div
                onClick={openFileDialog}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openFileDialog();
                    }
                }}
                className={cn(
                    "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer select-none outline-none",
                    isDragging
                        ? "border-gold-500 bg-gold-500/10 scale-[1.01] shadow-gold ring-2 ring-gold-500/20"
                        : "border-border/80 bg-card/60 dark:bg-space-900/60 hover:border-gold-500/50 hover:bg-card dark:hover:bg-space-850/80 shadow-xs",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className="hidden"
                />

                {/* Icon */}
                <div
                    className={cn(
                        "flex size-12 items-center justify-center rounded-2xl transition-all duration-200 mb-3 shadow-sm",
                        isDragging
                            ? "bg-gold-500 text-space-950 scale-110"
                            : "bg-muted/80 dark:bg-space-800 text-muted-foreground dark:text-starlight-300 group-hover:bg-gold-500/15 group-hover:text-gold-600 dark:group-hover:text-gold-400 group-hover:scale-105 border border-border/60"
                    )}
                >
                    <UploadCloud className="size-6 transition-transform group-hover:-translate-y-0.5" />
                </div>

                {/* Instructions */}
                <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-foreground dark:text-starlight-100">
                        <span className="text-gold-600 dark:text-gold-400 underline underline-offset-2">
                            Click to upload
                        </span>{" "}
                        or drag and drop
                    </p>
                    <p className="text-[11px] text-muted-foreground dark:text-starlight-400">
                        {effectiveHelper || `PDF or ZIP archive (max ${effectiveMaxSizeMB}MB)`}
                    </p>
                </div>
            </div>

            {sizeError && (
                <p className="text-xs font-medium text-red-500 dark:text-red-400">
                    {sizeError}
                </p>
            )}
        </div>
    );
}
