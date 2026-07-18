# Logging Gaps by Functionality

Audit of logging coverage across all user-facing features. For each functionality, we list **what's currently logged** and the **gaps developers need** to diagnose user issues.

---

## 1. Authentication & Onboarding

**Files:** `Components/Auth.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`, `app/welcome/page.tsx`

### What's Logged
- `console.error('Error verifying auth token:', error)` — API-side token verification
- PostHog analytics: `auth_signin` event tracked

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| Google sign-in popup failure — no log when OAuth popup fails or user cancels | Auth.tsx | Dev can't tell if users fail at Google auth or never attempt it |
| Firestore user profile write (`set()`) — no try/catch | Auth.tsx | User created in Firebase Auth but profile never saved; silent data loss |
| Companion settings creation failure — no try/catch | Auth.tsx | New user has no settings doc; nudges never work |
| `JSON.parse(localStorage.userTestResult)` — no try/catch | Auth.tsx | Enneagram results lost on parse error; no trace |
| `router.push()` after sign-in — no error handling | Auth.tsx | Navigation fails silently; `isLoading` stuck true forever |
| PostHog `identifyUser` / `setUserProperties` — no try/catch | Auth.tsx | Analytics silently broken for user |
| Welcome page — zero logging in entire file | welcome/page.tsx | No visibility into onboarding flow |

---

## 2. Enneagram Personality Assessment

**Files:** `Components/Chat.tsx`, `Components/GamifiedEnneagram.tsx`, `Components/SimplifiedEnneagramInput.tsx`, `app/personality/page.tsx`

### What's Logged
- Token tracking for chat conversation and result parsing (`console.log/warn`)
- `console.error('Error adding result:', error)` — Firestore save
- `console.error('Error loading enneagram data:', error)` — page load

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| OpenAI thread/message/run creation — zero error handling on 6 async calls | Chat.tsx | UI stuck on "Waiting..." indefinitely if API fails; no error shown, no log |
| OpenAI response structure access `content[0]['text'].value` — no validation | Chat.tsx | Crash if response format changes; no diagnostic info |
| `openai.beta.chat.completions.parse()` result — no null check | Chat.tsx | Silent failure if parsing returns no result |
| Token tracking `response.ok` false — not logged | Chat.tsx | Failed tracking invisible |
| GamifiedEnneagram — zero logging, zero try/catch in entire component | GamifiedEnneagram.tsx | Crash on undefined `summary`, `keyStrengths`, `growthAreas`, `blindSpots` — no diagnostic |
| `localStorage.setItem()` — no try/catch (can throw on quota exceeded) | SimplifiedEnneagramInput.tsx | Unhandled exception, test results lost |
| Auth redirect on personality page — no log of why user was redirected | personality/page.tsx | Can't audit auth failures vs intentional redirects |

---

## 3. Goal Wizard (Plan Creation)

**Files:** `app/profile/companion/page.tsx`, `app/api/plan/frame-assumptions/route.ts`, `app/api/plan/draft-milestones/route.ts`, `app/api/plan/review-synthesize/route.ts`, `app/api/openAi/route.ts`

### What's Logged
- All 5 AI passes have entry/exit logging with emoji prefixes
- `console.error` for each pass failure
- Token usage tracking logged

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| JSON parsing of OpenAI responses — no log when parse fails | All API routes | Silent fallback to defaults; dev can't tell if AI returned garbage |
| Firestore `createPlanDocument` / `updatePlanWithFrame` / `updatePlanWithDraft` / `updatePlanWithFinal` — no try/catch | API routes | User sees "success" but plan never persisted |
| OpenAI Assistant polling timeout — returns empty array without updating plan status | draft-milestones, review-synthesize | Plan stuck in "drafted" status forever; no error state |
| Fallback activation not logged — when defaults are used instead of AI results | All API routes | Client can't distinguish real AI output from hardcoded fallbacks |
| Missing/invalid API key — not logged at startup | API routes | Entire AI pipeline fails with generic error |
| Date validation failures in milestone generation — no logging | companion/page.tsx | Invalid dates accepted silently |
| Request parameter validation — returns 400 but no log | API routes | Can't audit why requests were rejected |

---

## 4. Dashboard & Plan Management

**Files:** `app/profile/page.tsx`, `app/profile/goals/[goalId]/page.tsx`, `app/api/plans/[planId]/route.ts`, `Components/MilestoneCard.tsx`, `Components/GameNudgeSlider.tsx`

### What's Logged
- `console.error` for profile load, plans load, notifications load, plan actions
- Goal detail page has good debug logging (`📋 Loaded plan`, `🔍 Fetching notifications`)
- Plan API: `console.error` for update/delete failures

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| `handleAddStep()` — zero error handling on step creation API call | GameNudgeSlider.tsx | User clicks "Add" → API fails → nothing happens; no log, no toast |
| `formatDate()` / `getTimeAgo()` — silent catch returning fallback string | MilestoneCard.tsx, GameNudgeSlider.tsx | Date parsing errors invisible; shows "Recently" with no trace |
| Milestone notification fetch returns non-ok — no else clause | profile/page.tsx | Notification fetch fails silently |
| StepsList all 4 CRUD operations — `if (response.ok)` with no else clause | StepsList.tsx | Failed step create/update/delete/fetch invisible to user and logs |
| Milestone completion toggle — no success/failure logging | profile/page.tsx | Can't verify if XP was awarded or milestone state changed |

---

## 5. Nudge System (AI Notifications)

**Files:** `app/api/milestoneReminders/route.ts`, `lib/noPlanReminders.ts`, `app/nudge/[id]/page.tsx`, `app/notifications/page.tsx`, `.github/scripts/process-milestone-reminders.mjs`

### What's Logged
- Milestone reminder route: detailed progress logging (11 statements)
- GitHub Actions script: excellent observability (60+ logs)
- Notification tracking: `markNotificationAsSent` / `markNotificationSendFailed`

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| `noPlanReminders.ts` — entire function has no try/catch wrapper | noPlanReminders.ts | One Firebase failure crashes entire no-plan reminder process |
| 5 Firestore queries (`getDocs`) in noPlanReminders — all unprotected | noPlanReminders.ts | Any query failure = unhandled exception |
| `onSnapshot()` real-time listener — no error callback | notifications/page.tsx | Real-time notification updates fail silently |
| `setDoc()` notification creation — no try/catch | milestoneReminders/route.ts | Notification created in logic but never persisted |
| `planData.milestones` — no null check before iteration | milestoneReminders/route.ts | Crash if plan has no milestones array |
| Nudge detail page `TrackedFirestoreClient.update()` (mark read) — no error log | nudge/[id]/page.tsx | "Mark as read" fails silently |
| `JSON.parse(serviceAccount)` — no try/catch | process-milestone-reminders.mjs | Script crashes on invalid env var; no diagnostic |
| Timestamp parsing across all nudge files — no validation | Multiple files | Date calculations fail silently |

---

## 6. Steps & Commitments

**Files:** `app/api/steps/route.ts`, `app/profile/commitments/page.tsx`, `Components/StepsList.tsx`, `Components/StepItem.tsx`, `Components/NudgeContentWithSteps.tsx`

### What's Logged
- API route: `console.error` for all 4 CRUD operations
- Commitments page: `console.error` for load/toggle/delete

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| StepItem — zero logging, zero try/catch in entire component | StepItem.tsx | Date conversion `toDate()` can crash; `getDaysOld()` fails silently |
| NudgeContentWithSteps — `fetch('/api/steps')` POST with zero error handling | NudgeContentWithSteps.tsx | Step creation from nudge page fails silently |
| StepsList — all 4 API calls check `response.ok` but have no else clause | StepsList.tsx | API returns 500 → user sees nothing; no log of what failed |
| Steps API — success operations not logged | steps/route.ts | Can't verify step CRUD completed; only failures are visible |
| Commitments page — `response.ok` false not logged | commitments/page.tsx | Failed fetch silently returns empty list |

---

## 7. Coaching Chatbot

**Files:** `app/api/chatbot/nudge-reflect/route.ts`, `app/api/chatbot/nudge-summarize/route.ts`, `app/api/chatbot/coach-reflect/route.ts`, `app/api/chatbot/coach-summarize/route.ts`

### What's Logged
- `console.error('Error in <route-name>:', error)` — outer catch
- `console.warn('Failed to track OpenAI usage:', trackError)` — token tracking
- `console.error('Firestore update/save error:', error)` — non-blocking DB errors

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| Empty transcript validation — returns 400 but no log | nudge-summarize, coach-summarize | Can't audit why summarization requests were rejected |
| OpenAI API response content — not validated before use | All 4 routes | Null/undefined response causes crash; no diagnostic |
| Successful completions — not logged | All 4 routes | Can't distinguish "never called" from "called successfully" |
| User message content — not logged (even truncated) | reflect routes | Can't debug why AI gave unexpected response |
| Firestore save marked as "non-blocking" — no alerting mechanism | summarize routes | Conversation summaries silently lost |

---

## 8. Gamification System

**Files:** `Components/GamificationSystem.tsx`, `app/profile/levels/page.tsx`

### What's Logged
- Levels page: `console.error` for data loading failure

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| GamificationSystem — zero logging, zero try/catch in entire component | GamificationSystem.tsx | XP calculation, achievement detection, level progression all unobservable |
| `window.innerWidth` access — no SSR guard | GamificationSystem.tsx | Server-side rendering crash |
| Stats calculation: empty milestones, missing timestamps, division by zero | levels/page.tsx | NaN/Infinity in XP display; no log |
| Achievement unlock events — not logged | GamificationSystem.tsx | Can't verify if achievements trigger correctly |
| XP award events — not logged | GamificationSystem.tsx | Can't verify 100/200/25 XP increments |

---

## 9. Notifications & Push

**Files:** `app/notifications/page.tsx`, `app/api/subscribe-push/route.ts`, `app/api/unsubscribe-push/route.ts`

### What's Logged
- Push subscribe/unsubscribe: `console.log` on success, `console.error` on failure
- Notifications page: `console.error` for update operations

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| `onSnapshot()` — no error callback for real-time listener | notifications/page.tsx | Real-time updates fail silently; user sees stale data |
| `onAuthStateChanged()` — no error callback | notifications/page.tsx | Auth state changes not monitored |
| Batch `updateDoc()` for mark-all-read — no per-item error tracking | notifications/page.tsx | Partial batch failure invisible |
| Push subscription validation failures — not logged | subscribe-push/route.ts | Can't audit invalid subscription attempts |
| `.toMillis()` timestamp conversion — no try/catch | notifications/page.tsx | Crash on malformed timestamp |

---

## 10. Settings & Preferences

**Files:** `app/profile/settings/page.tsx`

### What's Logged
- `console.error` for settings load and save failures

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| Successful settings save — not logged | settings/page.tsx | Can't verify settings persistence |
| Email validation failure — toast shown but no log | settings/page.tsx | Can't audit invalid email attempts |
| User null check early return — no log | settings/page.tsx | Can't tell if settings page accessed without auth |
| Nudge frequency change — not logged | settings/page.tsx | Can't track preference changes |
| Firestore `getDoc` / `setDoc` — no operation-level logging | settings/page.tsx | DB operations invisible |

---

## 11. Feedback System

**Files:** `app/api/feedback/route.ts`, `app/admin/feedback/page.tsx`

### What's Logged
- `console.log('Feedback submitted: ${id} | ${sentiment} | ${page}')` — success
- `console.error` for save and fetch failures

### Gaps

| Gap | File | Impact |
|-----|------|--------|
| Validation failures (missing fields, invalid sentiment) — not logged | feedback/route.ts | Can't audit rejected feedback submissions |
| Admin page data load — only error logged, no success | admin/feedback/page.tsx | Can't verify admin dashboard populated correctly |
| Filter/calculation operations — not logged | admin/feedback/page.tsx | Sentiment analysis invisible |

---

## 12. Content Pages (Landing, About, Product, Articles)

**Files:** `app/page.tsx`, `app/about/page.tsx`, `app/product/page.tsx`, `app/articles/page.tsx`

### What's Logged
- Nothing (static/marketing pages)

### Gaps

| Gap | Impact |
|-----|--------|
| No page view tracking beyond PostHog | Can't correlate marketing page visits with conversion |
| Article page data fetch errors — no logging | Broken articles show blank page silently |

---

## Summary: Coverage by Functionality

| Functionality | Current Coverage | Risk Level |
|---------------|-----------------|------------|
| Authentication & Onboarding | 15% | **CRITICAL** |
| Enneagram Assessment | 30% | **CRITICAL** |
| Goal Wizard | 50% | MEDIUM |
| Dashboard & Plan Mgmt | 55% | HIGH |
| Nudge System | 45% | **CRITICAL** |
| Steps & Commitments | 35% | HIGH |
| Coaching Chatbot | 40% | MEDIUM |
| Gamification | 5% | **CRITICAL** |
| Notifications & Push | 30% | HIGH |
| Settings | 25% | MEDIUM |
| Feedback | 60% | LOW |
| Content Pages | 0% | LOW |

---

## Cross-Cutting Gaps (All Features)

These patterns repeat across the entire codebase:

1. **No React Error Boundaries** — Client-side crashes show blank page with zero diagnostic
2. **No request correlation IDs** — Can't trace a user's journey across API calls
3. **No structured logging** — All logs are plain `console.*`; not searchable in production
4. **Silent `if (response.ok)` patterns** — API failures ignored on client-side throughout
5. **No success path logging** — Only errors are logged; can't verify happy path executed
6. **Firestore operations unwrapped** — Many `getDoc`/`setDoc`/`updateDoc` calls have no try/catch
7. **No centralized error monitoring** (Sentry/Bugsnag) — Errors only visible in server logs
8. **Timestamp parsing unvalidated** — `.toDate()`, `.toMillis()` used without guards across 10+ files
