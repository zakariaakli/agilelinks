# Nudge Workflow Architecture

## Overview

The nudge/notification system is a personality-aware goal milestone reminder system that sends personalized, AI-generated encouragement to users based on their Enneagram type and goal progress.

---

## Two-Phase Architecture

### Why Two Phases?

**Phase 1 (Fast)**: Create notification records

- Takes < 10 seconds
- No AI processing yet
- Avoids Vercel timeout limits
- Runs via API endpoint

**Phase 2 (Thorough)**: Add personalized content and send

- Takes 30-60 seconds per user
- Fetches personality data
- Generates AI content via OpenAI Assistants API
- Sends emails and push notifications
- Runs via GitHub Actions (60-minute timeout)

**Why this matters**: Without this split, the system would timeout when processing 50+ users simultaneously. This architecture scales to thousands of users.

---

## System Flow

```
SCHEDULED TRIGGER (7 AM UTC daily)
        ↓
[API] milestoneReminders/route.ts
    └─ Query active plans
    └─ Check current milestones (startDate ≤ today ≤ dueDate)
    └─ Check if today is nudge day (nudgeDays array)
    └─ Check for existing reminders (last 24h)
    └─ Create Firestore notification { prompt: "" }
        ↓
[GITHUB ACTIONS] process-milestone-reminders.mjs
    ├─ Query notifications with empty prompt
    ├─ For each pending notification:
    │   ├─ Fetch user Enneagram data
    │   ├─ Query personalization/milestone_nudge
    │   ├─ Fetch feedback history (last 5 reminders)
    │   ├─ Build AI input with milestone + personality context
    │   ├─ Call OpenAI Assistants API
    │   ├─ Update notification.prompt with AI response
    │   ├─ Send email via Resend
    │   └─ Send push notification via webPush
    │
    └─ User receives email + push notification
            ↓
    User visits nudge page (/nudge/[id])
            ↓
    Views milestone reminder with blind spot/strength hooks
            ↓
    (Optional) Opens AI reflection chatbot
            ├─ Calls /api/chatbot/nudge-reflect for each message
            ├─ AI uses Enneagram context (unnamed patterns)
            └─ Calls /api/chatbot/nudge-summarize for final summary
            ↓
    Summary stored in feedbackDetails.aiSummary
            ↓
    Next nudge generation includes this summary in feedback history
```

---

## Day-of-Week Scheduling

### Configuration Options

Users can configure when they receive nudges:

| Frequency | nudgeDays Value | Description |
|-----------|-----------------|-------------|
| `daily` | `[0,1,2,3,4,5,6]` | Every day |
| `weekly` | `[1]` | Monday only (legacy default) |
| `custom` | User-specified | Flexible selection |

**Default**: Sunday + Wednesday (`[0, 3]`)

### How It Works

```javascript
const isTodayNudgeDay = nudgeDays.includes(today.getDay());
if (!isTodayNudgeDay) continue; // Skip if not scheduled
```

Day values: 0=Sunday, 1=Monday, ..., 6=Saturday

---

## Enneagram Personality Integration

### Data Structure

Each Enneagram type (1-9) includes:

- **coreMotivation**: Psychological driver
- **keyStrengths**: Array of 3-4 natural abilities
- **growthAreas**: Improvement opportunities
- **blindSpots**: Unconscious patterns

### AI Prompting Rules

- **Never** explicitly mention Enneagram type numbers
- Reflect patterns naturally (e.g., "You seem to value harmony" NOT "Type 9s...")
- Incorporate blind spots as gentle awareness prompts
- Leverage strengths as encouragement hooks

### Data Flow

1. User's Enneagram assessment stored in `users/{uid}/enneagramResult`
2. Type-specific coaching advice stored in `personalization` collection
3. AI receives: summary, strengths, growth areas, blind spots
4. Output: Personalized nudge without type labels

---

## AI Generation Process

### Input Context

```javascript
{
  goalContext: planData.goal,
  milestone: {
    title, description,
    blindSpotTip, strengthHook,
    daysInProgress, totalDays, daysRemaining
  },
  personalityContext: (summary + details),
  growthAdvice: (from Firebase personalization),
  feedbackHistory: [] // Previous nudge summaries
}
```

### OpenAI Assistants API

- Uses dedicated Assistant ID (`NEXT_PUBLIC_REACT_NDG_GENERATOR_ID`)
- Creates thread, sends message, polls for completion
- Max wait: 30 seconds
- Falls back to template if AI fails

### Fallback Template

If AI generation fails:
- Week number and encouragement text
- Blind spot awareness prompt
- Strength-based hook
- Action-oriented question

---

## Notification Delivery

### Email (via Resend)

**Features:**
- HTML template with color-coded sections
- Yellow box: Blind spot alert
- Green box: Strength hook
- CTA button linking to nudge page
- Opt-out link to settings

**Opt-in Check:**
```javascript
companionSettings.emailNudgesOptIn === true
```

### Push Notifications (via Web Push)

**Payload:**
```javascript
{
  title: "🎯 {milestoneTitle}",
  body: nudge.substring(0, 100),
  url: "/nudge/{notificationId}",
  icon, badge,
  tag: "milestone-nudge"
}
```

**Subscription Management:**
- Stored in `pushSubscriptions` collection
- Expired subscriptions auto-deactivated (410/404 errors)
- `lastUsed` timestamp updated on each send

---

## Reflection & Feedback System

### User Flow

1. User opens nudge page
2. Sees "Want to reflect on this nudge with an AI coach?" prompt
3. Opens ReflectiveChatbot component
4. Multi-turn conversation with AI coach
5. Final message triggers summary generation

### API Endpoints

**Nudge Reflect** (`/api/chatbot/nudge-reflect`):
- Model: gpt-4o-mini
- Temperature: 0.7
- Max tokens: 200
- Context: Nudge text, milestone details, Enneagram data

**Nudge Summarize** (`/api/chatbot/nudge-summarize`):
- Model: gpt-4o-mini
- Temperature: 0.5
- Output: 2-3 sentence summary

### Feedback Loop

Summaries are stored in `feedbackDetails.aiSummary` and included in the next nudge's generation context, creating a continuous learning cycle.

---

## Notification Tracking

### Email Status

```typescript
interface EmailStatus {
  sent: boolean;
  sentAt?: Timestamp;
  attempts: number;
  lastAttemptAt?: Timestamp;
  deliveryStatus?: 'pending' | 'sent' | 'failed' | 'bounced' | 'delivered' | 'clicked';
  errorMessage?: string;
}
```

### Notification Metadata

```typescript
interface NotificationMeta {
  priority: 'low' | 'medium' | 'high';
  category: 'milestone_reminder';
  scheduledFor?: Timestamp;
  expiresAt?: Timestamp; // 7 days default
}
```

---

## Error Handling

### Step 1 Failure (User detection)

- Entire workflow fails
- GitHub Actions sends alert
- Product team investigates
- No user impact (they don't know a reminder was supposed to come)

### Step 2 Failure (AI generation)

- System logs error
- Falls back to template
- User still gets reminder (just less personalized)
- No email sent if fallback also fails

### Step 3 Failure (Email/Push delivery)

- Marks notification as "failed" with error details
- Notification still visible in web app
- Can be retried manually if needed
- User can view it by logging into app

---

## Data Privacy

### Data the System Accesses

- User's Enneagram assessment results
- Active goal plans and milestones
- Previous notification feedback
- Email preferences

### What OpenAI Sees

- Milestone title/description
- Personality type summary (no personal identifiers)
- Generic feedback text

### What We Do NOT Send to OpenAI

- User's real name
- Email address
- Full goal details
- Any other personal information

---

## Key Files

| File | Purpose |
|------|---------|
| `app/api/milestoneReminders/route.ts` | Daily scheduled endpoint to create pending notifications |
| `.github/workflows/milestone-reminders.yml` | Cron job orchestrator (7 AM UTC) |
| `.github/scripts/process-milestone-reminders.mjs` | Background AI processing and email/push sending |
| `lib/generateMilestoneNudgeFromAI.ts` | Server-side AI generation (for manual/test triggers) |
| `lib/sendMilestoneEmail.ts` | Resend email delivery integration |
| `lib/sendPushNotification.ts` | Web Push API integration |
| `lib/notificationTracking.ts` | Email status and notification metadata management |
| `Models/Notification.ts` | Notification data model |
| `Models/EnneagramResult.ts` | User Enneagram profile structure |
| `Data/enneagramTypeData.ts` | Complete Enneagram type database (9 types) |
| `Components/FeedbackForm.tsx` | Feedback UI with chatbot entry |
| `Components/ReflectiveChatbot.tsx` | AI reflection conversation component |
| `app/api/chatbot/nudge-reflect/route.ts` | Reflection conversation endpoint |
| `app/api/chatbot/nudge-summarize/route.ts` | Summary generation endpoint |
| `app/nudge/[id]/page.tsx` | Nudge display page with feedback UI |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin credentials |
| `OPENAI_API_KEY` | OpenAI API access |
| `NEXT_PUBLIC_REACT_NDG_GENERATOR_ID` | OpenAI Assistant ID for nudge generation |
| `RESEND_API_KEY` | Email delivery service |
| `VAPID_PUBLIC_KEY` | Web push public key |
| `VAPID_PRIVATE_KEY` | Web push private key |
| `VAPID_SUBJECT` | Web push contact email |

---

## Design Patterns

1. **Two-Phase Processing**: Separates fast notification creation from slow AI processing to avoid timeouts

2. **Personality-Aware Prompting**: Uses Enneagram insights without explicit type labeling

3. **Feedback Loop Integration**: Chat summaries inform future nudge generation

4. **Multi-Channel Delivery**: Same content delivered via email and push notifications

5. **Graceful Degradation**: Template fallbacks ensure users always receive something
