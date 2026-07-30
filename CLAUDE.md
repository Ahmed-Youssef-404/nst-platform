# CLAUDE.md — NST Platform

This file is my (Claude's) onboarding doc for this repo. It reflects the **actual code**, verified by cloning and reading the repo directly — not just past conversation summaries. Read this fully before doing any work here.

> **Rule zero:** Never trust a memory/summary over the code. Any time a claim about "what's built" matters, `grep`/`view` the real files first. This file itself can go stale — re-verify anything that looks surprising against the current repo.

---

## 1. What this project is

**NST Platform** — an educational platform for teaching programming to students. Built for a third-party client by Ahmed (frontend developer, learning backend as he goes). Ahmed talks to the client directly and relays requirements. **The platform is live** with real students and instructors — this is not a prototype, treat data-affecting changes with care.

- **Repo:** https://github.com/Ahmed-Youssef-404/nst-platform (public)
- **Working style:** "One door at a time." We design a feature fully, reach consensus, then write code. I explain my reasoning before writing code; Ahmed copies/runs it himself and tests end-to-end. Don't jump ahead to the next feature until the current one is closed.
- **Deferred features exist on purpose** — see §8. Do not build them without Ahmed explicitly asking.

---

## 2. Stack (verified from `package.json`)

- **Next.js 16.2.10** (App Router, TypeScript) — ⚠️ **not Next 15**. The repo's own `AGENTS.md` warns: *"This is NOT the Next.js you know — read `node_modules/next/dist/docs/` before writing code, heed deprecation notices."* Take that seriously; Next 16 has real API differences from what's in general training data.
- **React 19.2.4**
- **Prisma 7.8.0** with the `PrismaPg` adapter (`@prisma/adapter-pg`) — connection setup lives in `prisma.config.ts`, **not** in `schema.prisma`'s `datasource` block (that block just declares `provider = "postgresql"` with no `url`).
- **Supabase**: Auth + PostgreSQL + Storage (private `submissions` bucket)
- **shadcn/ui** (`components.json` present, using the new `shadcn` CLI package), Tailwind v4, Lucide React icons, `next-themes`
- **react-markdown** + **remark-gfm** for Markdown rendering (already installed and wired up — see §6)
- Deployed on **Vercel free tier** → servers run in UTC+0, always handle timezones explicitly (see §6, date/timezone fix)

Env vars actually used in code: `DATABASE_URL`, `DIRECT_URL` (Prisma direct connection for migrations), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. No `.env.example` is committed — ask Ahmed if you need actual values.

Supabase connection notes: direct connection (port 5432) doesn't work from this environment due to IPv6 — use the **Session Pooler** for direct/CLI use and the **Transaction Pooler** (port 6543) for `DATABASE_URL`.

---

## 3. Roles & identity model

Three roles, all created by **SuperAdmin only** — there is no self-registration, just a single `/login` page with role-appropriate tabs.

| Role | Table | Notes |
|---|---|---|
| `super_admin` | `super_admins` | Founder, one account |
| `instructor` | `instructors` | **Always call this "Instructor" in code/UI/docs — never "Admin".** The DB migration history literally shows it was renamed from `Admin`/`AdminGroup` → `Instructor`/`InstructorGroup`. |
| `student` | `students` | See identity bridge below |

`UserRole` type: `"super_admin" | "instructor" | "student"` (`src/types/types.ts`).

### The critical student identity bridge

Supabase Auth's `user.id` (a UUID) is **never** the same as `students.id` (a human-readable code like `NST-1001`, which doubles as the student's login password). They are bridged only through the shared, unique `email` column.

- `getCurrentUser()` in `src/lib/auth/get-current-user.ts` returns `{ id, email, role }` from Supabase Auth — `id` here is the **Auth UUID**, safe to use directly for SuperAdmin/Instructor (their tables use the Auth id as PK), **unsafe** to use as a `Student.id` foreign key.
- `getCurrentStudentId()` (same file) does the email lookup to resolve the real `students.id`. **Always use this** for any student-scoped query/action — never assume `user.id === student.id`.

### Authorization — two layers, both required

1. **Middleware** (`src/middleware.ts`) — route-prefix → allowed roles map (`/super-admin`, `/instructor`, `/student`). Redirects to `/login` if unauthenticated or wrong role. This is UX/navigation-level protection, not the real security boundary.
2. **`requireRole()`** (`src/lib/auth/require-role.ts`) — called at the top of **every** Server Action, **outside** any try/catch (so an auth failure throws immediately and isn't swallowed as a `{success:false}` result). This is the actual security boundary, since Server Actions are directly callable regardless of which page rendered them.

On top of that, cross-entity ownership is enforced explicitly where it matters: `assertInstructorOwnsStudent()` in `src/lib/actions/st-economy.ts` checks that an acting Instructor is actually assigned (via `InstructorGroup`) to the Group the target Student belongs to, before letting them record attendance/engagement/grade a submission. SuperAdmin bypasses this check (not Group-scoped).

**Known, deliberate gap:** `reconcileStudentSTAction` does **not** have this ownership check. Left unfixed on purpose — low risk, since reconciliation only ever applies already-earned ST changes, it can't be abused to grant arbitrary ST. Don't "fix" this without asking Ahmed first; it was a conscious decision, not an oversight.

---

## 4. Content hierarchy & core data model

`Batch → Group → Level → Session → Task → Hint`, plus `Submission`, `Attendance`, `STTransaction`, `StoreItem`/`StudentInventory`.

Read `prisma/schema.prisma` directly for full field lists — it's well-commented (in Arabic) and is the source of truth. Key semantics worth internalizing:

- **Level**: each `Group` has its own Levels (not a shared global list). Only one Level per Group has `isActive = true` at a time.
- **Session**: has a real `startTime` + `durationMinutes`. Its `upcoming`/`ongoing`/`completed` **status is always computed on the fly** from those two fields — never stored as a column. Don't add a `status` column; compute it wherever it's needed (see `get-my-groups.ts` for the pattern).
- **Task**: belongs to a `Session` (not directly to a `Level`). `type` is `INTERNAL` (has real Submissions) or `EXTERNAL` (external link only, no Submission flow). Has a mandatory `deadline`, an `isBonus` flag, and an optional `allowedSubmissionMode` (`null` = student picks freely between FILE/LINK/TEXT; non-null = only that mode is allowed). **Must be `null` whenever `type = EXTERNAL`** (there's no submission at all for external tasks).
- **Hint**: exactly 3 per Task (`order: 1|2|3`, no forced unlock order). `cost` is **instructor-set per hint at Task-creation time** (via the session-creation form) — it is NOT hardcoded in the schema/logic. `5 / 15 / 30` is the convention used in seed/test data and the UI defaults, not an enforced rule. Once a student pays to unlock a Hint, it's permanently unlocked for them (`HintUnlock` unique on `(studentId, hintId)`), with a confirmation popup before the charge.
- **Submission**: one row per `(studentId, taskId)` — a resubmit is an `UPDATE`, not a new row, and the old content is simply overwritten (no history table). Resubmission is blocked if **either** the Task's deadline has passed **or** `isLocked = true`. These are independent conditions — `isLocked` is set to `true` at grading time currently, but it's a separate column precisely so other locking scenarios can exist later without being tied to grading.
- File submissions: **only PDF and ZIP** are accepted (`SUBMISSION_ALLOWED_MIME_TYPES` in `types.ts`), max 5MB. Stored in Supabase Storage (private `submissions` bucket) at a **fixed** path `submissions/{taskId}/{studentId}/submission.{ext}` — deliberately not using the student's original filename, to avoid sanitizing arbitrary user input. A human-readable filename is generated only at download time.
- **StoreItem / StudentInventory**: Avatar-only store (the "Editorial" store idea was fully cancelled by the client). ⚠️ **Schema is mid-migration** — see §8, this is a known gap, don't build on it without fixing the schema first.

---

## 5. The ST economy (single most complex subsystem)

`applySTChange()` in `src/lib/st-economy/create-transaction.ts` is the **one and only** function allowed to touch `Student.levelSt` / `Student.totalSt`. Never write to those columns directly from anywhere else. It:
- Runs inside one Prisma `$transaction`, using atomic `increment`/`decrement` so concurrent calls can't produce a lost update.
- Always creates exactly one `STTransaction` audit row with a post-write balance **snapshot** (`levelStBalance`/`totalStBalance`), built from the values the same update returned (so the snapshot can never drift from reality).
- Takes a positive `amount` always — sign comes from `type: "REWARD" | "PENALTY"`, not from the amount itself.

`applySTChangeOnce()` wraps it with idempotency, keyed on `(studentId, reason, relatedEntityId)` — used everywhere a check might legitimately run more than once (e.g. every dashboard load) but should only ever apply the reward/penalty a single time.

### Two categories of ST events

**Deadline-triggered** (`src/lib/st-economy/deadline-events.ts`, `weekly-mission.ts`) — things that only become knowable once time has passed. Since Vercel's free tier has no reliable cron, these are evaluated **lazily**: `reconcileStudentST()` (`reconcile.ts`) is called whenever we already have a reason to load a student's data. It currently **is** wired into two real call sites: `src/app/student/page.tsx` and `src/app/student/student-top-bar.tsx` (both call it before reading the balance). A stale code comment in `reconcile.ts`/`get-st-balance.ts` says "not wired to any UI yet" — that comment is **out of date**, don't trust it.
  - `reconcileTaskDeadlines`: +5 `SUBMIT_BEFORE_DEADLINE` or −10 `TASK_NOT_SUBMITTED`, per non-bonus Task once its deadline passes.
  - `reconcileFinishAllTasks`: +10 `FINISH_ALL_TASKS` once per Session, once every non-bonus Task in it has an on-time submission.
  - `reconcileWeeklyMission`: +30 `WEEKLY_MISSION`, evaluated over 7-day windows anchored to `Level.startDate` (not calendar weeks, not per-student join date). A week with zero scheduled Sessions is skipped entirely (no fail, no reward). **Known open edge case, deliberately deferred:** what happens if a student joins a Group mid-week/mid-Level — currently the mission is still evaluated from the Level's start, which could unfairly "fail" a week the student wasn't even present for yet. Flagged in the code, not solved. Don't solve it without asking Ahmed.

**Instructor-driven** (`src/lib/st-economy/instructor-events.ts`) — fire whenever the Instructor acts, not gated by any deadline:
  - `recordAttendance`: +10 `PRESENT` / −20 `ABSENT` (`MISSED_SESSION`). Correcting a previous record reverses the old ST effect then applies the new one (two separate atomic calls, not one shared transaction — accepted as safe enough for this low-frequency, single-actor action).
  - `recordSessionEngagement`: +5, once per (student, session).
  - `gradeSubmission`: rubric total 0–10 (`understandingScore` 0–2, `approachScore` 0–3, `correctnessScore` 0–3, `implementationScore` 0–2) → `RUBRIC_GRADING` reward if > 0. Also handles `BONUS_TASK_SOLVED` (+10, if `task.isBonus` and `correctnessScore > 0`) and `FIRST_SOLVER` (+5, only if the Instructor explicitly flags `isFirstSolver` at grading time). Grading also sets `isLocked = true`. **Throws if the submission was already graded** — there is currently no correction/re-grade flow; the only fix today is a manual DB edit plus a `MANUAL_ADJUSTMENT` transaction (see §8).

`unlockHint()` (`hint-unlock.ts`) deducts ST via `applySTChange` then creates the `HintUnlock` row; has an explicit race-condition fallback that refunds a "losing" concurrent double-click so a student is never double-charged for the same hint.

**Balance zones** (`balance-status.ts`): `normal` / `warning` (`levelSt <= warningThreshold`) / `danger` (`levelSt <= 0`). `warningThreshold` defaults to a **hardcoded 20** — there is no SuperAdmin settings table/UI for this yet; it's a known `TODO` in the code, and the fix is designed to be a one-file change (`DEFAULT_WARNING_THRESHOLD` in `balance-status.ts`) once that settings surface exists.

---

## 6. Frontend structure & UI state (verified against actual files)

### Brand & design system — `src/app/globals.css`
"Luxury Gold & Black" theme, OKLCH colors, light/dark variants defined for both. Key tokens beyond the basics: `--success`/`--success-bg`, `--warning`/`--warning-bg`, `--error`/`--error-bg` (mapped from `--destructive`), `--coin`/`--coin-bg`. **Use these tokens, not raw Tailwind colors** (`yellow-400` etc.) — this was already fixed once in `st-balance-card.tsx`, don't reintroduce raw colors.
- Dark theme is forced as default (`defaultTheme="dark"`, `enableSystem={false}` in `layout.tsx`). A light/dark toggle exists in code (`theme-toggle.tsx`) but isn't user-facing.
- Fonts: Space Grotesk (`--font-display`, headings) + Inter (body).

### Student area (`src/app/student/`)
- **Layout**: `StudentSidebar` (collapsible icon-rail sidebar, "My Sessions" is the only nav link on purpose — more links get added when their doors are actually built, not as disabled placeholders) + a **sticky top bar** (`student-top-bar.tsx`) that shows "Welcome, {name}" / ST balance / warning-or-danger message, present on **every** `/student` page (not just the sessions list). The bar re-fetches its own balance independently, wrapped in its own `<Suspense>`.
- **Sessions list** (`/student`, `session-list-view.tsx`): clickable full-card links, sorted by `startTime`. `upcoming` sessions are disabled (no link, muted styling) both in the UI **and** via a server-side redirect if someone hits the URL directly.
- **Session detail** (`/student/sessions/[id]`): back button → session info → 4-count progress summary (Total / Submitted / Not submitted / Graded) → a **Task pager** (one Task at a time, prev/next arrows, "Task X of Y", free navigation in any order) reusing `TaskCard`/`HintsList`/`SubmissionPanel`-equivalent logic (now in `src/components/student/task-detail-card.tsx` + `task-pager.tsx`).
- `st-balance-card.tsx` still exists as a component but the top bar is now the primary/persistent display — check current call sites before assuming which one is actually rendered where.

### Markdown rendering — ✅ already done
`src/components/markdown-content.tsx` (`MarkdownContent`) renders Task descriptions and Hint content as Markdown via `react-markdown` + `remark-gfm`, with a styled/framed code-block component (language label + copy-to-clipboard button) and full styling for headings, lists, tables, blockquotes, links. It's already wired into `task-detail-card.tsx`. **If old notes say this is "pending," they're stale — it's implemented.** No `rehype-raw` is used, so raw HTML in source Markdown is never executed (safe by default).

### Date/timezone handling
`src/lib/format-date.ts` exports `formatDateTime(date: Date): string`, hardcoding `APP_LOCALE = "en-GB"` and `APP_TIMEZONE = "Africa/Cairo"` — this exists because `date.toLocaleString(undefined, {...})` silently uses the *runtime's* locale/timezone, which differs between localhost (Cairo) and Vercel (UTC+0), producing different displayed times for the same underlying `Date`.
- **Currently used in:** `task-detail-card.tsx`, `create-session-form.tsx`, `instructor/sessions/[id]/session-detail-view.tsx`, `student/sessions/[id]/session-detail-view.tsx`, `student/session-list-view.tsx`, `student/student-dashboard-view.tsx`.
- **⚠️ Still NOT migrated (verified via grep):** `src/app/instructor/instructor-dashboard-view.tsx` line ~90 still calls `session.startTime.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })` directly. This is a real, live instance of the exact bug the fix was written for. Flag/fix this the next time date formatting comes up in that file.
- `src/components/ui/calendar.tsx` (shadcn date-picker) intentionally still uses raw `toLocaleString`/`toLocaleDateString` for its own internal locale-aware month/day labels — **leave this one alone**, it's a different concern (calendar widget i18n, not "what timezone is this event in").

### Instructor area (`src/app/instructor/`)
Much thinner than the Student side — no separate attendance/grading pages. Almost everything (attendance, session engagement, rubric grading) lives inside one large file: `src/app/instructor/sessions/[id]/session-detail-view.tsx` (~770 lines). `instructor-dashboard-view.tsx` lists the Instructor's assigned Groups + their active Level's Sessions with computed status badges.

### SuperAdmin area (`src/app/super-admin/`)
`page.tsx` → `UserManagementForm` (create Instructor/Student accounts). `batches/` and `levels/` each have their own page + management view for Batch/Group CRUD and Level creation/transition. There is currently **no** SuperAdmin students list, no Store management UI, and no settings page (e.g. for the warning threshold above) — none of these exist yet.

### `dev-preview` page
`src/app/dev-preview/page.tsx` is a temporary, self-described-as-"safe to delete" visual QA page for skeleton loaders and scroll-reveal animations against the real brand tokens. Not part of the real app; ignore it unless asked about it specifically.

---

## 7. Code conventions (follow these exactly)

- **Layered architecture, strictly followed:**
  `lib/<domain>/*.ts` (raw Prisma logic, no `"use server"`) → `lib/actions/*.ts` (Server Actions, `"use server"` at top of file) → `lib/data/*.ts` (read-only fetchers, shaped for a specific UI need) → Server page component (`page.tsx`) → Client view component (`*-view.tsx`).
- **Server Action pattern**, verified consistently across `src/lib/actions/*.ts`:
  ```ts
  "use server";
  export async function xAction(input: XInput) {
      const user = await requireRole([...]); // OUTSIDE try/catch — auth failures throw immediately
      try {
          // business logic, additional ownership checks if needed
          return { success: true, data };
      } catch (error) {
          return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error occurred",
          };
      }
  }
  ```
- **Central types** live in `src/types/types.ts`. ST-economy string unions (`STReasonCode`, `STTransactionKind`, `TaskTypeCode`, `SubmissionModeCode`) are deliberately hand-mirrored from the Prisma enums rather than imported from the generated client — keeps this file free of a dependency on `@/generated/prisma`.
- **English only** for code comments and error messages shown to users — even though a lot of the *design-doc-style* comments in `schema.prisma` and elsewhere are in Arabic (that's fine, those are internal notes, not user-facing).
- **shadcn components only** for UI — Ahmed installs them himself after I give him the exact `npx shadcn@latest add <component>` command. Where no shadcn `Select` equivalent exists yet in the repo for a given case, the existing pattern is a plain HTML `<select>` (match this, don't invent a new pattern).
- Every file in `src/lib/**` that touches Prisma instantiates its own `PrismaClient` with the `PrismaPg` adapter at module scope (`const adapter = new PrismaPg(...); const prisma = new PrismaClient({ adapter });`) — this repeated boilerplate is the existing pattern; match it in new files rather than trying to introduce a shared singleton unless Ahmed asks for that refactor explicitly.

---

## 8. Deferred / known-incomplete — do NOT build without explicit instruction

These are **intentional** gaps, already discussed and postponed post-launch. Don't "helpfully" implement them proactively — confirm with Ahmed first.

1. **Level-transition ST reset.** Moving a Group to a new Level is supposed to reset every student's `levelSt` to 50 (logging a `LEVEL_RESET` `STTransaction` — the enum value and migration for it already exist: `20260723072719_add_level_reset_reason`). **Not implemented** — confirmed via grep, no `levelSt` reset logic exists anywhere in `src/lib/levels/` or `src/lib/actions/level-management.ts`. Level Management currently creates/activates Levels but does not touch student balances.
2. **Store / Avatar door.** `StoreItem` in `schema.prisma` still only has the original 6 fields (`id, name, description, imageUrl, cost, isActive`). The `AvatarSlot`/`StoreGenderTab`/`StoreRarity` enums exist in the DB (migration `20260721051430`), but the corresponding `ALTER TABLE` to add `slot`/`genderTab`/`rarity` columns to `StoreItem` was **never run** — the migration only did `CREATE TYPE`. No purchase or equip/unequip Server Actions exist at all. **Fix the schema/migration before writing any Store logic.**
3. **Weekly Mission UI.** The +30 reward logic runs (`reconcile.ts` → `weekly-mission.ts`), but there is no UI anywhere (Instructor or SuperAdmin) that surfaces weekly mission status/results.
4. **Grading correction flow.** `gradeSubmission()` throws if a submission is already graded. Today's only fix for a mis-grade is a manual DB edit plus a `MANUAL_ADJUSTMENT` transaction.
5. **Forgot-password / reset flow.** Doesn't exist. SuperAdmin creates every account through the single `/login` page's flows.
6. **`reconcileStudentSTAction` authorization gap.** See §3 — deliberately left unpatched; low risk since it only applies already-earned changes.
7. **Instructor dashboard timezone bug.** `instructor-dashboard-view.tsx`'s raw `toLocaleString(undefined, ...)` call — not "deferred" exactly, just not yet migrated to `formatDateTime()`. Low-risk to fix opportunistically if Ahmed asks about that file.
8. **SuperAdmin settings surface.** No table/UI exists for things like the ST warning threshold (currently hardcoded at 20) — flagged as a likely future need, not started.
9. **Open edge case, unresolved:** student joining a Group mid-Level/mid-week, and how that should interact with Weekly Mission scoring (see §5).

---

## 9. How to work with Ahmed on this repo

- Always `git clone` fresh and read the actual code before making any claim about what is/isn't built — Ahmed has been burned before by summaries describing designs that were agreed on but never actually coded.
- Use `grep -rn "pattern" --include="*.ts" --include="*.tsx" . | grep -v node_modules` for codebase-wide search, `sed -n 'X,Yp' file` for targeted reads on large files.
- Prefer giving Ahmed **one concrete before/after example** plus a shared helper, and let him apply a repetitive mechanical change across the remaining files himself, rather than editing every file for him — this matches how the `formatDateTime` rollout was actually done.
- Full design-then-code cycle for anything nontrivial: pose the open questions explicitly, wait for Ahmed's answers, don't start writing code until there's real consensus. "One door fully closed" before opening the next — don't scope-creep into the next feature mid-implementation.