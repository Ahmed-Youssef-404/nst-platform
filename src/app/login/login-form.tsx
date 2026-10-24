"use client";

import { useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    AlertCircle,
    Compass,
    ShieldCheck,
    MessageCircle,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LoginMode = "student" | "staff";

export function LoginForm() {
    const [mode, setMode] = useState<LoginMode>("student");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const result = await loginAction({
            email: email.trim(),
            password: password.trim(),
        });

        // If login succeeded, loginAction redirects and this code is not reached.
        if (!result.success) {
            setError(result.error ?? "Invalid email or credentials. Please verify and try again.");
            setIsSubmitting(false);
        }
    }

    return (
        <div className="nst-auth-panel w-full rounded-2xl p-6 sm:p-8 lg:p-9 shadow-2xl">
            {/* Top gold accent line */}
            <div className="nst-panel-top-glow" />

            {/* Header / Intro */}
            <div className="space-y-1.5 mb-6 sm:mb-8">
                <div className="flex items-center justify-between">
                    <span className="font-technical text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] text-gold-400 uppercase">
                        AUTHENTICATION // ACCESS PORTAL
                    </span>
                    {/* <span className="inline-flex items-center gap-1.5 text-[11px] font-technical text-starlight-400">
                        <span className="size-1.5 rounded-full bg-gold-400 animate-pulse" />
                        SECURE
                    </span> */}
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-starlight-100">
                    Enter Your Universe
                </h2>
                <p className="text-xs sm:text-sm text-starlight-300">
                    Select your access role and enter your credentials to initiate your session.
                </p>
            </div>

            {/* Role Mode Selector */}
            <div
                role="tablist"
                aria-label="Login Role Selection"
                className="grid grid-cols-2 p-1 gap-1 rounded-xl bg-space-850/80 border border-gold-500/15 mb-6"
            >
                <button
                    autoFocus
                    type="button"
                    role="tab"
                    id="tab-student"
                    aria-selected={mode === "student"}
                    aria-controls="panel-student"
                    onClick={() => {
                        setMode("student");
                        setPassword("");
                        setError(null);
                    }}
                    className={cn(
                        "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-gold-500",
                        mode === "student"
                            ? "bg-gold-500 text-space-950 shadow-[var(--shadow-gold)] font-bold"
                            : "text-starlight-300 hover:text-starlight-100 hover:bg-space-750/50"
                    )}
                >
                    <Compass className="size-4 shrink-0" />
                    <span>Student Explorer</span>
                </button>

                <button
                    type="button"
                    role="tab"
                    id="tab-staff"
                    aria-selected={mode === "staff"}
                    aria-controls="panel-staff"
                    onClick={() => {
                        setMode("staff");
                        setPassword("");
                        setError(null);
                    }}
                    className={cn(
                        "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-gold-500",
                        mode === "staff"
                            ? "bg-gold-500 text-space-950 shadow-[var(--shadow-gold)] font-bold"
                            : "text-starlight-300 hover:text-starlight-100 hover:bg-space-750/50"
                    )}
                >
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>Staff / Instructor</span>
                </button>
            </div>

            {/* The Authentication Form */}
            <form
                onSubmit={handleSubmit}
                id={mode === "student" ? "panel-student" : "panel-staff"}
                role="tabpanel"
                aria-labelledby={mode === "student" ? "tab-student" : "tab-staff"}
                className="space-y-4 sm:space-y-5"
            >
                {/* Email Address Field */}
                <div className="space-y-1.5">
                    <label
                        htmlFor="login-email"
                        className="block text-xs font-technical font-medium tracking-wider text-starlight-200 uppercase"
                    >
                        Email Address
                    </label>
                    <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-starlight-400 pointer-events-none">
                            <Mail className="size-4" />
                        </div>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full rounded-xl border border-[color:var(--border-default)] bg-space-900/60 pl-10 pr-4 py-2.5 sm:py-3 text-sm text-starlight-100 placeholder:text-starlight-400 outline-none transition-all duration-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Password / Access Code Field */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="login-password"
                            className="block text-xs font-technical font-medium tracking-wider text-starlight-200 uppercase"
                        >
                            {mode === "student" ? "Student Access Code" : "Password"}
                        </label>
                        {/* {mode === "student" && (
                            <span className="text-[11px] font-technical text-gold-400/90 font-mono">
                                e.g. NST-1001
                            </span>
                        )} */}
                    </div>
                    <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-starlight-400 pointer-events-none">
                            <Lock className="size-4" />
                        </div>
                        <input
                            id="login-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            // placeholder={mode === "student" ? "NST-0000" : "••••••••"}
                            placeholder={"••••••••"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full rounded-xl border border-[color:var(--border-default)] bg-space-900/60 pl-10 pr-11 py-2.5 sm:py-3 text-sm text-starlight-100 placeholder:text-starlight-400 outline-none transition-all duration-200 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isSubmitting}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 p-1 rounded-lg text-starlight-400 hover:text-gold-400 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        >
                            {showPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-[11px] text-starlight-400">
                        {mode === "student"
                            ? "Your unique code issued by NST during course enrollment."
                            : "Enter your staff administrative credentials."}
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div
                        role="alert"
                        aria-live="polite"
                        className="flex items-start gap-2.5 rounded-xl border border-error/35 bg-error/10 p-3 text-xs sm:text-sm text-error-400 animate-in fade-in duration-200"
                    >
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <span className="leading-snug">{error}</span>
                    </div>
                )}

                {/* Submit Action Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 px-4 py-3 text-sm font-bold text-space-950 shadow-[var(--shadow-gold-strong)] transition-all duration-300 hover:from-gold-300 hover:via-gold-400 hover:to-gold-500 hover:shadow-[0_0_24px_rgba(232,184,74,0.4)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 outline-none focus-visible:ring-3 focus-visible:ring-gold-500"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="size-4 animate-spin text-space-950" />
                            <span>Authenticating Session...</span>
                        </>
                    ) : (
                        <>
                            <span>Enter Portal</span>
                            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </>
                    )}
                </button>
            </form>

            {/* Assistance & WhatsApp Support Link */}
            <div className="mt-6 pt-5 border-t border-[color:var(--border-subtle)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-starlight-300">
                    <span className="text-starlight-400">Need help or lost credentials?</span>
                    <a
                        href="https://wa.me/201159169762"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-gold-400 hover:text-gold-300 transition-colors underline-offset-4 hover:underline"
                    >
                        <MessageCircle className="size-3.5" />
                        <span>Support on WhatsApp</span>
                        <ExternalLink className="size-3 opacity-70" />
                    </a>
                </div>

                {/* Gateway security stamp */}
                <div className="flex items-center justify-between text-[10px] font-technical tracking-widest text-starlight-400/80 uppercase">
                    <span>NST GATEWAY · ENCRYPTED</span>
                    <span>NORTHERN STARS TEAM</span>
                </div>
            </div>
        </div>
    );
}