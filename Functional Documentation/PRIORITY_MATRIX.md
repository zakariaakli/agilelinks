# Quarterly Priority Matrix

## Overview

The **Priority Matrix** is a portfolio-level planning layer that sits *above* all of a
user's goals. Instead of looking at one goal at a time (as `/profile` and
`/profile/goals/[goalId]` do today), the matrix aggregates actions across **every active
goal** into an Eisenhower-style 2×2 grid (urgency × importance) for a configurable
period — a **quarter by default**.

The matrix is **self-driving**: the system seeds it automatically from the user's goals
and milestones, the user refines it, and a **daily end-of-day check-in** keeps it honest
by recording the actions actually completed each day. From that effort signal the matrix
produces a **trajectory projection** answering one question: *given the work done so far
and the current tendency, is this quarter heading for success or not?*

This document is the functional + technical spec. It also contains a **Database Impact
Analysis** (§9) confirming the feature is additive and free of regressions on existing
collections.

## Product Goals

| # | Capability | Description |
|---|-----------|-------------|
| 1 | Auto-populated matrix | Seed matrix actions automatically from the user's active goals/milestones, classified into quadrants. |
| 2 | User editing | User can move an action between quadrants, edit its text, or remove it. Manual moves are sticky (never re-classified by the system). |
| 3 | Cross-goal monitoring | A single upper-level view spanning **all** active goals, not per-goal. |
| 4 | Daily end-of-day check-in | An evening notification asks the user to report what they did today (conversational). Effort is attributed to actions/goals/quadrants and scored for "worth-it". |
| 5 | Trajectory timeline | A projection of whether completed work + current tendency leads to a successful quarter. |
| 6 | Configurable target date | Period type (`quarter` / `month` / `custom`) and target date are user-configurable. |

## Resolved Design Decisions

These were confirmed with the product owner before spec:

1. **Lifecycle — one matrix per quarter, archived.** When the period's target date passes,
   the active matrix flips to `archived` and a fresh one is seeded for the next period.
   Past quarters remain queryable so the user can review prior performance. A goal that
   spans multiple quarters has its in-window milestones seeded into each relevant matrix.
2. **Daily capture — conversational.** Reuse the existing reflection-chat pattern. Free
   text is mapped to matrix actions by AI; anything not already in the matrix is *proposed*
   as a new action for confirmation rather than silently invented.
3. **Importance — user-rated at the goal level.** A new optional `importance` rating on the
   goal drives the importance axis. Urgency stays auto-derived from due dates / time
   pressure. Manual per-action moves still override AI classification.

## Quadrant Model

Classic Eisenhower quadrants:

| Quadrant key | Urgency | Importance | Coaching intent | Suggested color (warm palette) |
|---|---|---|---|---|
| `urgent_important` | High | High | **Do first** — protect this time | warm red `#B84A42` |
| `not_urgent_important` | Low | High | **Schedule** — where the quarter is actually won | sage `#3D7A4A` |
| `urgent_not_important` | High | Low | **Delegate / minimize** — beware false urgency | gold `#C68B2C` |
| `not_urgent_not_important` | Low | Low | **Eliminate** — stop spending here | neutral `#8A8378` |

## Data Model (New)

All new data lives in **new collections** — no existing collection is restructured. One
field is added to `plans` (see §9 for safety analysis).

### `priorityMatrices` (new top-level collection)

One active document per user per period; previous periods archived.

```ts
// Models/PriorityMatrix.ts
export interface PriorityMatrix {
  id: string;
  userId: string;
  status: 'active' | 'archived';
  periodType: 'quarter' | 'month' | 'custom';   // configurable target window
  periodStart: string;   // ISO date
  periodEnd: string;     // ISO date — the "quarter target date"
  periodLabel: string;   // e.g. "Q2 2026" for display / switcher
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
```

### `priorityMatrices/{matrixId}/actions` (subcollection)

One document per action in the grid.

```ts
export type Quadrant =
  | 'urgent_important'
  | 'not_urgent_important'
  | 'urgent_not_important'
  | 'not_urgent_not_important';

export interface MatrixAction {
  id: string;
  title: string;
  quadrant: Quadrant;
  source: 'ai' | 'user';            // auto-seeded vs user-added
  sourcePlanId?: string;            // link back to originating goal
  sourceMilestoneId?: string;       // link back to originating milestone
  manualOverride: boolean;          // true once user moves it → AI won't re-classify
  status: 'open' | 'done' | 'removed';
  effortMinutes: number;            // accumulated from daily reports
  lastWorkedOn?: string;            // ISO date
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
```

### `priorityMatrices/{matrixId}/dailyLogs` (subcollection)

One document per evening check-in, keyed by `YYYY-MM-DD`.

```ts
export interface MatrixDailyLog {
  id: string;                       // YYYY-MM-DD
  reportedText: string;             // raw user input from chat
  mappedActions: Array<{
    actionId: string;
    effortMinutes: number;
    quadrant: Quadrant;
  }>;
  aiSummary: string;
  worthItScore: number;             // 0..1 — effort concentration in important quadrants
  createdAt: Date | Timestamp;
}
```

### Field added to `plans`

```ts
// Models/Plan.ts — Plan interface
importance?: 'high' | 'medium' | 'low';   // OPTIONAL. Drives importance axis.
                                          // Undefined is treated as 'medium'.
```

### Notification type extension

```ts
// Models/Notification.ts
type: 'milestone_reminder' | 'no_plan_reminder' | 'daily_action_review';
```

## Auto-Classification Logic (`lib/matrixClassifier.ts`)

Derives a quadrant for each active milestone of each active goal:

- **Urgent** = goal `hasTimePressure === true` **OR** milestone `dueDate` within an urgency
  window (default ≤ 14 days from today).
- **Important** = goal `importance` is `high` or `medium` (or `undefined`, treated as
  `medium`). `low` → not important.

Runs on (a) matrix creation/seed and (b) explicit refresh. **Never overrides** an action
where `manualOverride === true`, so user edits persist. New milestones appearing on a goal
after seeding are added as `source: 'ai'` actions on the next refresh.

## Daily End-of-Day Loop

1. **Cron** — a dedicated workflow (evening, e.g. `0 19 * * *`) hits a new
   `GET /api/matrixDailyReview`, which creates a `daily_action_review` notification for each
   user with an active matrix. Mirrors the existing
   [milestone-reminders](../.github/workflows/milestone-reminders.yml) two-stage pattern.
2. **Capture** — the notification links to a reflection chat ("What did you get done
   today?"). Reuses the nudge-reflect chat UI. A new
   `POST /api/chatbot/matrix-daily-summarize` maps free text →
   `{ actionId, effortMinutes, quadrant }[]`, proposes new actions for unmatched items,
   and writes a `dailyLog`.
3. **Update** — accumulate `effortMinutes` onto matched actions, mark reported actions
   `done`, and compute the daily **worth-it score** (effort concentrated in
   `*_important` quadrants scores high; effort sunk into `*_not_important` scores low).

## Trajectory Projection (`lib/matrixTrajectory.ts`)

Computed for the configured period:

- **Required pace** = important actions/milestones remaining ÷ days remaining to `periodEnd`.
- **Actual pace** = completions over a trailing window.
- **Status** = `on_track` | `at_risk` | `off_track`, plus a forecast line.
- **Effort-allocation insight**, e.g. *"62% of your effort this week went to
  Urgent-Not-Important work — that trends toward a missed quarter."*

Rendered by `QuarterTrajectory.tsx` (custom SVG/CSS in the style of `LevelIndicator`;
`chart.js` is available if richer charts are wanted).

## UI / Routing

- **Route:** `/app/profile/matrix/page.tsx` — protected, `onAuthStateChanged` pattern.
- **Components** (in `/Components`, capitalized per convention):
  - `PriorityMatrix.tsx` — 2×2 CSS-grid board; move/edit/remove actions (move → `manualOverride: true`).
  - `MatrixQuadrant.tsx` — one cell; renders its actions + effort indicators.
  - `QuarterTrajectory.tsx` — trajectory timeline.
  - `MatrixPeriodSettings.tsx` — period type + target date + quarter switcher (current vs archived).
- **Navigation:** add a "Matrix" entry in [Header.tsx](../Components/Header.tsx) and
  optionally [MobileBottomNav.tsx](../Components/MobileBottomNav.tsx).
- **Styling:** new `/Styles/priorityMatrix.module.css`. Uses design tokens / hardcoded warm
  hexes per the project color rules. **Does not** touch `design-tokens.css`,
  `header.module.css`, `mobileBottomNav.module.css`, or `levelIndicator.module.css`.

## API Routes (New)

| Route | Purpose |
|---|---|
| `GET/POST/PATCH/DELETE /api/matrix` | CRUD for the matrix doc + actions; seed-from-plans; quarter rollover/archive. |
| `GET /api/matrixDailyReview` | Cron-triggered creation of `daily_action_review` notifications. |
| `POST /api/chatbot/matrix-daily-summarize` | Maps the daily chat transcript → effort attribution + new-action proposals. |

## Integration With Existing Systems

| New piece | Reuses / builds on |
|---|---|
| Matrix actions | Derived from `plans.milestones[]` ([Models/Plan.ts](../Models/Plan.ts)). |
| Daily notification + cron | Same pattern as [milestoneReminders](../app/api/milestoneReminders/route.ts) + GitHub Actions workflow. |
| Daily chat capture | nudge-reflect / nudge-summarize chat ([app/api/chatbot/nudge-reflect/route.ts](../app/api/chatbot/nudge-reflect/route.ts)). |
| Personality-aware tone | Enneagram context as in [generateMilestoneNudgeFromAI](../lib/generateMilestoneNudgeFromAI.ts). |
| Effort = completed actions | The existing `steps` concept ([Models/Step.ts](../Models/Step.ts)). |
| Page/nav/auth/styling | `/app/profile/*` routes, `onAuthStateChanged`, CSS-module warm palette. |
| Firestore access | `trackedFirestore` (server) / `trackedFirestoreClient` (client) wrappers. |

## 9. Database Impact Analysis (Regressions & Redundancy)

This feature was audited against every existing read/write path before implementation. The
two existing-data touch points are the optional `plans.importance` field and the new
`notifications.type` value. Findings below are code-verified.

### 9.1 `plans.importance` — verdict: **purely additive, zero regression**

- **Writes preserve it.** Every plan write is either `addDoc` (new docs) or `updateDoc`
  (field-level merge) — see [planPersistence.ts](../lib/planPersistence.ts),
  [app/api/plans/[planId]/route.ts](../app/api/plans/[planId]/route.ts),
  [app/api/steps/route.ts](../app/api/steps/route.ts), and the goal wizard
  [companion/page.tsx](../app/profile/companion/page.tsx). No `setDoc`-without-merge full
  overwrite exists, so the field is never stripped from existing docs.
- **Step CRUD only rewrites the `milestones` array**, never top-level plan fields.
- **No runtime validation** (no Zod schema / type guard) rejects an extra field; `as Plan`
  assertions are compile-time only.
- **Reads tolerate `undefined`.** All goal renders use optional chaining / fallbacks;
  classification treats missing `importance` as `medium`.
- **Backfill:** none required. Existing goals default to `medium` until the user rates them.

### 9.2 `daily_action_review` notification type — verdict: **safe to process; generic queries handled deliberately**

The risk with a new `notifications.type` is (a) the AI cron picking it up and
double-processing, and (b) generic queries miscounting it. Audit results:

**No double-processing / cron regression — these all filter by `type`:**

| Location | Query | Status |
|---|---|---|
| `.github/scripts/process-milestone-reminders.mjs` | `where('prompt','==','') .where('type','==','milestone_reminder')` | ✅ ignores new type |
| same (no-plan stage) | `where('type','==','no_plan_reminder')` | ✅ |
| [noPlanReminders.ts](../lib/noPlanReminders.ts) | `where('type','==','no_plan_reminder')` (count + recent) | ✅ |
| [generateMilestoneNudgeFromAI.ts](../lib/generateMilestoneNudgeFromAI.ts) | `where('type','==','milestone_reminder')` | ✅ |
| [profile/page.tsx](../app/profile/page.tsx), [goals/[goalId]/page.tsx](../app/profile/goals/[goalId]/page.tsx) | `where('type','==','milestone_reminder')` | ✅ |

**Generic queries (no `type` filter) — intentional handling, not regressions:**

| Location | Effect | Handling |
|---|---|---|
| `milestoneReminders/route.ts` duplicate check | Matches by `userId+planId+milestoneId`; daily reviews carry no milestoneId so they won't match — but add `where('type','==','milestone_reminder')` defensively. | Add type filter |
| `notificationTracking.ts` unsent-email query | Would attempt to email the new type. | Add explicit email handling/template for `daily_action_review`. |
| `notificationTracking.ts` stats aggregate | Would count new type in totals. | Branch on type so stats aren't misattributed to milestones. |
| `notifications/page.tsx` feed + `NotificationBell.tsx` badge | Would show/count the new type. **Desired** — the daily review should appear. | Keep; ensure render is correct (below). |
| `NotificationCard.tsx` | Non-exhaustive type switch defaults to milestone behavior (`/nudge/{id}` link). | Add `daily_action_review` case → route to matrix daily-review chat. |
| `getDefaultNotificationMeta()` | Non-exhaustive; silently defaults priority. | Add explicit case. |
| `admin/page.tsx` notif aggregates | Minor analytics inflation. | Optional: filter or branch by type. |

**Required mechanical changes (tracked as Phase 4 work):**

1. Extend `Notification.type` union in [Models/Notification.ts](../Models/Notification.ts).
2. Add `type` filter to the duplicate-check query in `milestoneReminders/route.ts`.
3. Add a `daily_action_review` case to `NotificationCard.tsx` and `getDefaultNotificationMeta()`.
4. Add email/template + stats handling for the new type in `notificationTracking.ts`.

### 9.3 Redundancy avoidance

- Matrix data lives in **dedicated collections**; goal/milestone/step data is **referenced
  by id** (`sourcePlanId`, `sourceMilestoneId`), never duplicated. The matrix is a *view*
  over goals, with only matrix-specific state (quadrant, effort, manual overrides) stored.
- Effort reuses the existing completed-action signal rather than introducing a parallel
  tracking concept.

### 9.4 New Firestore indexes (likely required)

- `priorityMatrices`: `where userId == X` + `where status == 'active'`.
- `priorityMatrices` (history): `where userId == X` + `orderBy periodEnd desc`.
- `actions` subcollection: `where quadrant == X` + `where status == 'open'`.
- Firestore will prompt with a console link on first failing query (per
  [NOTIFICATIONS.md](./NOTIFICATIONS.md) convention).

## Build Sequence (Phased, each independently shippable)

1. **Data + classifier** — `Models/PriorityMatrix.ts`, `plans.importance` field,
   `lib/matrixClassifier.ts`, `/api/matrix` CRUD, seed-from-plans, quarter rollover/archive.
2. **Matrix UI** — page, board, move/edit/remove, period switcher + target-date config, nav entry.
3. **Trajectory** — `lib/matrixTrajectory.ts` + `QuarterTrajectory.tsx` (current + archived).
4. **Daily review loop** — evening cron + `daily_action_review` notification +
   `matrix-daily-summarize` endpoint + effort accumulation + worth-it scoring + the §9.2
   mechanical notification changes.
5. **Goal-importance capture** — wire the rating into the goal wizard / goal edit.
6. **Polish** — empty states, mobile nav, tests.
