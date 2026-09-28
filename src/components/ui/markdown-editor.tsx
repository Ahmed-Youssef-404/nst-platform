// src/components/ui/markdown-editor.tsx
"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Link as LinkIcon,
    List,
    ListOrdered,
    ListTodo,
    Quote,
    Table as TableIcon,
    Heading1,
    Heading2,
    Eye,
    PenLine,
    Plus,
    CheckSquare,
    Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/markdown-content";

export interface MarkdownEditorProps {
    id?: string;
    name?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    rows?: number;
    minHeight?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    label?: string;
}

export function MarkdownEditor({
    id,
    name,
    value: controlledValue,
    defaultValue = "",
    onChange,
    placeholder = "Write your content here using Markdown...",
    rows = 6,
    minHeight = "160px",
    className,
    disabled = false,
    required = false,
    label,
}: MarkdownEditorProps) {
    const generatedId = useId();
    const editorId = id || generatedId;
    const isControlled = controlledValue !== undefined;

    const [internalValue, setInternalValue] = useState(defaultValue);
    const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const currentValue = isControlled ? controlledValue : internalValue;

    const handleValueChange = (newValue: string) => {
        if (!isControlled) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
    };

    // Helper to insert markdown formatting at cursor / selection
    const insertMarkdown = (prefix: string, suffix: string = "", placeholderText: string = "") => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = currentValue;
        const selectedText = text.substring(start, end);

        const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${placeholderText}${suffix}`;
        const updated = text.substring(0, start) + replacement + text.substring(end);

        handleValueChange(updated);

        // Keep cursor position inside
        requestAnimationFrame(() => {
            textarea.focus();
            const newCursorPos = selectedText ? start + replacement.length : start + prefix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos + (selectedText ? 0 : placeholderText.length));
        });
    };

    // Interactive checkbox toggle in preview mode
    const handleToggleCheckbox = (itemIndex: number) => {
        let currentIndex = 0;
        const updated = currentValue.replace(/(- \[(?: |x|X)\])/g, (match) => {
            if (currentIndex === itemIndex) {
                currentIndex++;
                return match.includes("x") || match.includes("X") ? "- [ ]" : "- [x]";
            }
            currentIndex++;
            return match;
        });
        handleValueChange(updated);
    };

    // Quick add items from preview mode or write mode
    const appendMarkdownSnippet = (snippet: string) => {
        const trimmed = currentValue.trimEnd();
        const updated = trimmed ? `${trimmed}\n${snippet}` : snippet;
        handleValueChange(updated);
    };

    // Count words & characters
    const charCount = currentValue.length;
    const wordCount = currentValue.trim() ? currentValue.trim().split(/\s+/).length : 0;

    return (
        <div className={cn("space-y-1.5 w-full", className)}>
            {label && (
                <label
                    htmlFor={editorId}
                    className="block text-xs font-semibold text-starlight-200"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="rounded-xl border border-border/80 bg-space-900/90 overflow-hidden shadow-xs focus-within:border-gold-500/50 transition-colors">
                {/* Header Toolbar — GitHub PR Style */}
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border/70 bg-space-850/60 px-2.5 py-1.5 backdrop-blur-xs">
                    {/* Write / Preview Tab Switcher */}
                    <div className="flex items-center gap-1 bg-space-950/40 p-0.5 rounded-lg border border-border/60">
                        <button
                            type="button"
                            onClick={() => setActiveTab("write")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
                                activeTab === "write"
                                    ? "bg-space-900 text-gold-400 font-semibold shadow-xs"
                                    : "text-starlight-300 hover:text-starlight-100"
                            )}
                        >
                            <PenLine className="size-3.5" />
                            <span>Write</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("preview")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all",
                                activeTab === "preview"
                                    ? "bg-space-900 text-gold-400 font-semibold shadow-xs"
                                    : "text-starlight-300 hover:text-starlight-100"
                            )}
                        >
                            <Eye className="size-3.5" />
                            <span>Preview</span>
                        </button>
                    </div>

                    {/* Toolbar Actions */}
                    {activeTab === "write" ? (
                        <div className="flex items-center flex-wrap gap-0.5 text-starlight-300">
                            <button
                                type="button"
                                title="Heading"
                                onClick={() => insertMarkdown("### ", "", "Heading")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors"
                            >
                                <Heading2 className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                title="Bold (**text**)"
                                onClick={() => insertMarkdown("**", "**", "bold text")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors font-bold"
                            >
                                <Bold className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                title="Italic (*text*)"
                                onClick={() => insertMarkdown("*", "*", "italic text")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors italic"
                            >
                                <Italic className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                title="Strikethrough (~~text~~)"
                                onClick={() => insertMarkdown("~~", "~~", "strikethrough text")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors"
                            >
                                <Strikethrough className="size-3.5" />
                            </button>
                            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
                            <button
                                type="button"
                                title="Inline Code (`code`)"
                                onClick={() => insertMarkdown("`", "`", "code")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors"
                            >
                                <Code className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                title="Link ([text](url))"
                                onClick={() => insertMarkdown("[", "](https://example.com)", "link title")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors"
                            >
                                <LinkIcon className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                title="Bullet List (- item)"
                                onClick={() => insertMarkdown("- ", "", "List item")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors"
                            >
                                <List className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                title="Numbered List (1. item)"
                                onClick={() => insertMarkdown("1. ", "", "First item")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors"
                            >
                                <ListOrdered className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                title="Task / Checklist (- [ ] task)"
                                onClick={() => insertMarkdown("- [ ] ", "", "Task item")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors"
                            >
                                <ListTodo className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                title="Quote (> quote)"
                                onClick={() => insertMarkdown("> ", "", "Quote text")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors"
                            >
                                <Quote className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                title="Table"
                                onClick={() => insertMarkdown("| Header 1 | Header 2 |\n| :--- | :--- |\n| Row 1 | Data 1 |\n| Row 2 | Data 2 |", "")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors"
                            >
                                <TableIcon className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                title="Divider (---)"
                                onClick={() => insertMarkdown("\n---\n", "")}
                                className="p-1.5 hover:bg-space-800 hover:text-starlight-100 rounded-md transition-colors"
                            >
                                <Minus className="size-3.5" />
                            </button>
                        </div>
                    ) : (
                        /* Preview Quick-Add Actions */
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[11px] text-starlight-400 font-medium hidden sm:inline">
                                Quick add to preview:
                            </span>
                            <button
                                type="button"
                                onClick={() => appendMarkdownSnippet("- New list item")}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-space-800/80 hover:bg-space-750 text-starlight-200 hover:text-starlight-100 text-xs font-medium border border-border/50 transition-colors"
                            >
                                <Plus className="size-3 text-gold-400" />
                                <span>Add Point</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => appendMarkdownSnippet("- [ ] New task")}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-space-800/80 hover:bg-space-750 text-starlight-200 hover:text-starlight-100 text-xs font-medium border border-border/50 transition-colors"
                            >
                                <CheckSquare className="size-3 text-gold-400" />
                                <span>Add Task</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Editor Content Area */}
                <div className="relative">
                    {activeTab === "write" ? (
                        <textarea
                            ref={textareaRef}
                            id={editorId}
                            value={currentValue}
                            onChange={(e) => handleValueChange(e.target.value)}
                            placeholder={placeholder}
                            rows={rows}
                            disabled={disabled}
                            required={required}
                            style={{ minHeight }}
                            className="w-full resize-y bg-transparent px-3.5 py-3 font-mono text-xs sm:text-sm text-starlight-100 placeholder:text-starlight-400/60 outline-none leading-relaxed"
                        />
                    ) : (
                        <div
                            style={{ minHeight }}
                            className="p-4 overflow-y-auto max-h-[500px] bg-space-950/30"
                        >
                            {currentValue.trim() ? (
                                <div
                                    onClick={(e) => {
                                        // Detect if an interactive checklist was clicked in preview
                                        const target = e.target as HTMLElement;
                                        if (target && target.tagName === "INPUT" && (target as HTMLInputElement).type === "checkbox") {
                                            const allCheckboxes = Array.from(e.currentTarget.querySelectorAll("input[type='checkbox']"));
                                            const clickedIndex = allCheckboxes.indexOf(target as HTMLInputElement);
                                            if (clickedIndex !== -1) {
                                                handleToggleCheckbox(clickedIndex);
                                            }
                                        }
                                    }}
                                >
                                    <MarkdownContent content={currentValue} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-starlight-400">
                                    <PenLine className="size-7 mb-2 opacity-40 text-gold-400" />
                                    <p className="text-xs font-medium">Nothing to preview yet</p>
                                    <p className="text-[11px] text-starlight-400/80 mt-1">
                                        Type Markdown in the <span className="font-semibold text-gold-400">Write</span> tab to see live formatted results here.
                                    </p>
                                </div>
                            )}

                            {/* Interactive Quick Add Toolbar in Preview */}
                            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
                                <span className="text-[11px] text-starlight-400">
                                    💡 Click any checkbox above to toggle it directly!
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => appendMarkdownSnippet("- New list item")}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-space-850 hover:bg-space-800 text-starlight-200 hover:text-gold-400 border border-border/60 transition-colors text-xs font-semibold"
                                    >
                                        <Plus className="size-3" />
                                        <span>+ Add Point</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => appendMarkdownSnippet("- [ ] New task item")}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-space-850 hover:bg-space-800 text-starlight-200 hover:text-gold-400 border border-border/60 transition-colors text-xs font-semibold"
                                    >
                                        <CheckSquare className="size-3" />
                                        <span>+ Add Task</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Bar */}
                <div className="flex items-center justify-between border-t border-border/70 bg-space-850/40 px-3 py-1.5 text-[11px] text-starlight-400">
                    <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-gold-400 animate-pulse" />
                        <span>Markdown Supported (GFM, Code, Tables, Tasks)</span>
                    </span>
                    <span className="font-mono text-[10px]">
                        {wordCount} words · {charCount} chars
                    </span>
                </div>
            </div>

            {/* Hidden input for native HTML form submissions */}
            {name && (
                <textarea
                    name={name}
                    value={currentValue}
                    readOnly
                    tabIndex={-1}
                    aria-hidden="true"
                    className="sr-only"
                />
            )}
        </div>
    );
}
