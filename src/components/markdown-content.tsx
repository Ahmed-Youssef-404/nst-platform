// src/components/markdown-content.tsx
// Renders Task descriptions and Hint content as Markdown. Both fields are
// authored as Markdown by instructors (plain Textareas - no live preview
// yet), so the Student-facing side needs to actually render it instead of
// dumping raw "**bold**" / "```code```" as plain text.
//
// Code blocks (and inline code) get their own framed/"card" look per the
// client's request, with a language label + copy button on fenced blocks.
// No rehype-raw plugin is used, so raw HTML in the source is never
// executed - safe by default.

"use client";

import { useState, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

function textFromNode(node: ReactNode): string {
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(textFromNode).join("");
    if (isValidElement<{ children?: ReactNode }>(node)) {
        return textFromNode(node.props.children);
    }
    return "";
}

function CodeBlock({ children, ...props }: React.ComponentProps<"pre">) {
    const [copied, setCopied] = useState(false);

    const codeChild = isValidElement<{ className?: string; children?: ReactNode }>(
        Array.isArray(children) ? children[0] : children
    )
        ? ((Array.isArray(children) ? children[0] : children) as React.ReactElement<{
            className?: string;
            children?: ReactNode;
        }>)
        : null;

    const lang = /language-(\w+)/.exec(codeChild?.props.className ?? "")?.[1];
    const raw = textFromNode(codeChild?.props.children ?? children).replace(/\n$/, "");

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(raw);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard API can fail (permissions, non-secure context) -
            // not worth surfacing an error for a "nice to have" button.
        }
    }

    return (
        <div className="my-3 overflow-hidden rounded-lg border border-border bg-muted/40 text-left">
            <div className="flex items-center justify-between border-b border-border bg-muted/70 px-3 py-1.5">
                <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {lang || "code"}
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                    {copied ? (
                        <>
                            <Check className="size-3" /> Copied
                        </>
                    ) : (
                        <>
                            <Copy className="size-3" /> Copy
                        </>
                    )}
                </button>
            </div>
            <pre {...props} className="overflow-x-auto px-3 py-2.5 text-xs leading-relaxed">
                {children}
            </pre>
        </div>
    );
}

const components: Components = {
    p: ({ children }) => (
        <p className="leading-relaxed [&:not(:first-child)]:mt-2">{children}</p>
    ),
    a: ({ children, href }) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
        >
            {children}
        </a>
    ),
    ul: ({ children }) => (
        <ul className="ml-5 list-disc space-y-1 [&:not(:first-child)]:mt-2">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="ml-5 list-decimal space-y-1 [&:not(:first-child)]:mt-2">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-border pl-3 text-muted-foreground [&:not(:first-child)]:mt-2">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-3 border-border" />,
    h1: ({ children }) => (
        <h1 className="font-display text-base font-semibold [&:not(:first-child)]:mt-3">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="font-display text-sm font-semibold [&:not(:first-child)]:mt-3">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="font-display text-sm font-semibold [&:not(:first-child)]:mt-3">{children}</h3>
    ),
    table: ({ children }) => (
        <div className="my-3 overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse text-xs">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
    th: ({ children }) => (
        <th className="border-b border-border px-2.5 py-1.5 text-left font-medium">{children}</th>
    ),
    td: ({ children }) => (
        <td className="border-b border-border px-2.5 py-1.5 last:border-b-0">{children}</td>
    ),
    pre: CodeBlock,
    code: ({ className, children, ...props }) => {
        const isBlock = /language-(\w+)/.test(className ?? "");
        if (isBlock) {
            return (
                <code className={cn("font-mono", className)} {...props}>
                    {children}
                </code>
            );
        }
        return (
            <code
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
                {...props}
            >
                {children}
            </code>
        );
    },
};

export function MarkdownContent({
    content,
    className,
}: {
    content: string;
    className?: string;
}) {
    return (
        <div className={cn("text-sm", className)}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
}