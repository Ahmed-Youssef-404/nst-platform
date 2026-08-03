// src/lib/telegram/send-feedback.ts
// Raw integration logic for the Send Feedback feature. No Prisma here -
// this feature is deliberately not persisted to the DB (client decision):
// a Student's feedback goes straight to the team's Telegram chat and
// nowhere else. If the Telegram call fails, the feedback is lost and the
// student is told to retry - there is no fallback storage.
//
// Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in the environment.

import type { FeedbackTypeCode } from "@/types/types";
import { formatDateTime } from "@/lib/format-date";

const FEEDBACK_TYPE_LABELS: Record<FeedbackTypeCode, string> = {
    PROBLEM: "Problem",
    SUGGESTION: "Suggestion",
    COMPLAINT: "Complaint",
    OTHER: "Other",
};

// Telegram's Bot API uses a specific subset of HTML and requires the five
// reserved characters below to be escaped in any text passed with
// parse_mode: "HTML" - otherwise the request fails outright if a student's
// message happens to contain a literal '<', '>', or '&'.
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export interface SendFeedbackToTelegramInput {
    studentName: string;
    studentEmail: string;
    type: FeedbackTypeCode;
    message: string;
}

// Sends one Student feedback submission to the configured Telegram chat.
// Throws on any failure (missing env vars, network error, non-OK response)
// so the caller (the Server Action) can surface a clear error - this
// function has no fallback path since there is nowhere else to store the
// feedback.
export async function sendFeedbackToTelegram(
    input: SendFeedbackToTelegramInput
): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        throw new Error(
            "Feedback delivery isn't configured on the server (missing Telegram credentials)."
        );
    }

    const submittedAt = formatDateTime(new Date());

    const text = [
        `<b>📬 New Student Feedback</b>`,
        ``,
        `<b>Type:</b> ${escapeHtml(FEEDBACK_TYPE_LABELS[input.type])}`,
        `<b>Student:</b> ${escapeHtml(input.studentName)}`,
        `<b>Email:</b> ${escapeHtml(input.studentEmail)}`,
        `<b>Submitted:</b> ${escapeHtml(submittedAt)}`,
        ``,
        `<b>Message:</b>`,
        escapeHtml(input.message),
    ].join("\n");

    const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "HTML",
            }),
        }
    );

    if (!response.ok) {
        // Don't leak raw Telegram API error bodies to the client - log
        // server-side for debugging, throw a generic message for the UI.
        const errorBody = await response.text().catch(() => "");
        console.error("Telegram sendMessage failed:", response.status, errorBody);
        throw new Error(
            "Could not deliver your feedback right now. Please try again in a moment."
        );
    }
}