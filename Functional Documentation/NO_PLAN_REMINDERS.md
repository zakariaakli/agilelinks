# No-Plan Daily Reminders

## Overview

Users who sign up but never create a goal receive daily motivational notifications for up to 7 days, encouraging them to create their first plan. Delivered via all 3 channels: email, push notification, and in-app.

## How It Works

| Step | Where | What happens |
|------|-------|-------------|
| 1. Detection | `/api/milestoneReminders` | After processing milestone reminders, queries all users and finds those with zero active plans |
| 2. Creation | `lib/noPlanReminders.ts` | Creates `no_plan_reminder` notifications with a pre-filled template message (no AI) |
| 3. Delivery | `.github/scripts/process-milestone-reminders.mjs` | Sends email + push for pending no-plan notifications |
| 4. Display | `/notifications` page | Shows in-app with "Get Started" title, links to `/welcome` |

## Rules

- **Max 7 reminders** per user total — stops after day 7
- **1 per day** — duplicate check with 24-hour lookback
- **Template-based** — 7 rotating motivational messages, no AI cost
- **Respects opt-out** — checks `companionSettings.emailNudgesOptIn` before sending email
- **Test users** bypass the daily duplicate check (same as milestone reminders)

## Notification Shape

```
notifications/{id} = {
  userId: string
  type: "no_plan_reminder"
  prompt: string          // Pre-filled template message
  createdAt: Timestamp
  read: boolean
  feedback: null
  emailStatus: { sent, attempts, deliveryStatus }
  notificationMeta: { priority: "high", category: "no_plan_reminder", expiresAt }
}
```

No `planId`, `milestoneId`, or milestone-specific fields.

## Template Messages

7 messages rotating by send count (day 1 = index 0, day 2 = index 1, etc.). Defined in `lib/noPlanReminders.ts`.

## UI Behavior

- `NotificationCard` receives `type` prop
- When `type === "no_plan_reminder"`: links to `/welcome` instead of `/nudge/{id}`, shows "Get Started" as title
- Priority badge shows "HIGH"

## Key Files

| File | Role |
|------|------|
| `lib/noPlanReminders.ts` | Core detection + notification creation logic |
| `app/api/milestoneReminders/route.ts` | Entry point — calls `processNoPlanReminders()` |
| `.github/scripts/process-milestone-reminders.mjs` | Email + push delivery (`processNoPlanNotifications()`) |
| `Components/NotificationCard.tsx` | UI rendering with type-aware linking |
| `Models/Notification.ts` | Type definition includes `no_plan_reminder` |
| `lib/notificationTracking.ts` | Meta defaults + category type |
